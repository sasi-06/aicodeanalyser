import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { 
  Play, 
  Send, 
  ChevronDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Terminal, 
  Loader,
  Brain,
  Shield,
  History,
  Info,
  ChevronRight,
  Code,
  Layout,
  RefreshCw,
  Download,
  ArrowRight
} from 'lucide-react';

import Navbar from '../../components/Navbar';
import TelemetryStats from '../../components/TelemetryStats';
import AlertBanner from '../../components/AlertBanner';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { setSession, setSubmissionResult } from '../../store/sessionSlice';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { value: 'python', label: 'Python 3', monacoLang: 'python', icon: '🐍' },
  { value: 'javascript', label: 'JavaScript', monacoLang: 'javascript', icon: 'JS' },
  { value: 'java', label: 'Java', monacoLang: 'java', icon: '☕' },
  { value: 'cpp', label: 'C++', monacoLang: 'cpp', icon: 'C++' },
];

export default function CodingAssessment() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // State
  const [questions, setQuestions] = useState([]);
  const [selectedQ, setSelectedQ] = useState(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [session, setSessionState] = useState(null);
  const [phase, setPhase] = useState('select'); // select | coding | result
  const [timer, setTimer] = useState(0);
  const [output, setOutput] = useState('');
  const [runLoading, setRunLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [telemetryStats, setTelemetryStats] = useState({ 
    totalKeystrokes: 0, 
    totalPasteCount: 0, 
    compilationCount: 0, 
    averagePause: 0, 
    totalTabSwitches: 0 
  });
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('description');
  const [userInput, setUserInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [recentSessions, setRecentSessions] = useState([]);
  const [assignedQuestions, setAssignedQuestions] = useState(new Set());
  const [cameraDenied, setCameraDenied] = useState(false);

  // Refs for telemetry & socket
  const sessionRef = useRef(null);
  const startTimeRef = useRef(null);
  const telemetryBatch = useRef([]);
  const lastKeypressRef = useRef(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const flushRef = useRef(null);
  const videoRef = useRef(null);
  const faceModelRef = useRef(null);
  const gazeLoopRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // Telemetry: Flush batch to server
  const flushTelemetry = useCallback(() => {
    if (!sessionRef.current || !Array.isArray(telemetryBatch.current) || !telemetryBatch.current.length || !socketRef.current) return;
    socketRef.current.emit('telemetry_batch', { 
      sessionId: sessionRef.current._id, 
      events: [...telemetryBatch.current] 
    });
    telemetryBatch.current = [];
  }, []);

  // Telemetry: Add event to batch
  const addEvent = useCallback((type, data = {}) => {
    if (!startTimeRef.current) return;
    const timestamp = Date.now() - startTimeRef.current;
    telemetryBatch.current.push({ type, timestamp, data });
  }, []);

  // Load questions and previous sessions
  useEffect(() => {
    const fetchData = async () => {
       try {
          const [qRes, sRes, aRes] = await Promise.all([
             api.get('/questions'),
             api.get('/sessions/my'),
             api.get('/sessions/assessments/my')
          ]);
          
          const rawQuestions = Array.isArray(qRes.data?.questions) ? qRes.data.questions : (Array.isArray(qRes.data) ? qRes.data : []);
          const sessions = sRes.data || [];
          const assessments = aRes.data || [];
          
          const completedQIds = new Set(
            sessions
              .filter(s => ['submitted', 'evaluated'].includes(s.status))
              .map(s => s.question?._id)
          );
          
          const assignedQIds = new Set();
          assessments.forEach(a => {
             if (Array.isArray(a.questions)) {
                a.questions.forEach(q => {
                   if (q && q._id) assignedQIds.add(q._id);
                });
             }
          });
          
          const sortedQuestions = [...rawQuestions].sort((a, b) => {
             const aComp = completedQIds.has(a._id);
             const bComp = completedQIds.has(b._id);
             if (aComp && !bComp) return 1;
             if (!aComp && bComp) return -1;
             
             const aAssign = assignedQIds.has(a._id);
             const bAssign = assignedQIds.has(b._id);
             if (aAssign && !bAssign) return -1;
             if (!aAssign && bAssign) return 1;
             
             return 0;
          });

          setQuestions(sortedQuestions);
          setRecentSessions(sessions);
          setAssignedQuestions(assignedQIds);
          if (sortedQuestions.length > 0) setSelectedQ(sortedQuestions[0]);
       } catch (e) {
          console.error('Failed to load assessment data');
       }
    };
    fetchData();
  }, []);

  // Timer logic
  useEffect(() => {
    if (phase === 'coding') {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // AI Eye-Tracking / Gaze Detection
  useEffect(() => {
    if (phase !== 'coding') return;
    let offScreenCount = 0;
    let isActive = true;

    const startEyeTracking = async () => {
      try {
        const stream = cameraStreamRef.current || await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig = { runtime: 'tfjs', maxFaces: 1, refineLandmarks: false };
        faceModelRef.current = await faceLandmarksDetection.createDetector(model, detectorConfig);
        
        const detectGaze = async () => {
          if (!isActive || !videoRef.current || !faceModelRef.current) return;
          
          if (videoRef.current.readyState === 4) {
             const faces = await faceModelRef.current.estimateFaces(videoRef.current);
             if (faces.length === 0) {
               offScreenCount++;
             } else {
               offScreenCount = Math.max(0, offScreenCount - 1);
             }
             
             if (offScreenCount > 30) {
                addEvent('off_screen_gaze', {});
                offScreenCount = 0; // reset
             }
          }
          if (isActive) gazeLoopRef.current = requestAnimationFrame(detectGaze);
        };
        detectGaze();
      } catch (err) {
        console.warn("Camera access denied or model failed.");
        addEvent('camera_denied', {});
        setCameraDenied(true);
      }
    };

    startEyeTracking();

    return () => {
      isActive = false;
      if (gazeLoopRef.current) cancelAnimationFrame(gazeLoopRef.current);
      if (videoRef.current?.srcObject) {
         videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [phase, addEvent]);

  const formatTimer = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Setup Socket.io for live proctoring & notifications
  const setupSocket = useCallback((sess) => {
    const socket = getSocket();
    socketRef.current = socket;
    socket.emit('join_session', { sessionId: sess._id });
    
    socket.on('live_alert', (alert) => {
      setLiveAlerts((prev) => [alert, ...prev].slice(0, 5));
      toast.error(`⚠️ ${alert.message}`, { duration: 4000 });
    });

    socket.on('live_telemetry', (stats) => {
      setTelemetryStats((prev) => ({ ...prev, ...stats }));
    });

    flushRef.current = setInterval(flushTelemetry, 3000);
    return socket;
  }, [flushTelemetry]);

  // Start the assessment
  const startSession = async () => {
    if (!selectedQ) return toast.error('Please select a question');
    
    // UI check for existing sessions (redundant but good UX)
    if (recentSessions.some(s => s.question?._id === selectedQ._id && ['submitted', 'evaluated'].includes(s.status))) {
       return toast.error('Check evaluation history: You have already submitted this challenge.');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      cameraStreamRef.current = stream;
    } catch (err) {
      toast.error('Camera access is required to take this assessment. Please allow camera access.');
      return;
    }

    try {
      const { data } = await api.post('/sessions/start', { questionId: selectedQ._id, language });
      setSessionState(data.session);
      sessionRef.current = data.session;
      setCode(data.starterCode || '');
      startTimeRef.current = Date.now();
      dispatch(setSession(data.session));
      setupSocket(data.session);
      setPhase('coding');
      toast.success('Assessment started. Focus and good luck!', { icon: '🚀' });
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You have already attempted this question. Only one attempt is allowed.');
      } else {
        toast.error('Initialization failed. Check your connection.');
      }
    }
  };

  // Editor interaction hooks
  const onEditorKeyDown = useCallback((e) => {
    const key = e.browserEvent?.key;
    const now = Date.now();
    if (lastKeypressRef.current) {
      const gap = now - lastKeypressRef.current;
      if (gap > 2000) addEvent('idle_end', { duration: gap });
    }
    lastKeypressRef.current = now;
    if (key === 'Backspace') addEvent('backspace', {});
    else if (key && typeof key === 'string' && key.length === 1) addEvent('keypress', { char: key });
    
    setTelemetryStats(prev => ({ ...prev, totalKeystrokes: (prev.totalKeystrokes || 0) + 1 }));
  }, [addEvent]);

  const onEditorPaste = useCallback((e) => {
    // Monaco specific paste handling is Done in handleEditorMount via onDidPaste
    // This is a fallback for raw textarea paste if needed
  }, []);

  const handleEditorMount = (editor) => {
    editor.onKeyDown(onEditorKeyDown);
    
    // NATIVE MONACO PASTE DETECTION (Much more reliable)
    editor.onDidPaste((e) => {
      const text = editor.getValue(); // Fallback if range not available
      const length = e.range?.endLineNumber ? 500 : 0; // Approximate or use actual text if possible
      addEvent('paste', { length: length || 250 });
      setTelemetryStats(prev => ({ ...prev, totalPasteCount: (prev.totalPasteCount || 0) + 1 }));
      toast.error('🚫 Copy-Paste is restricted. This event has been logged.', { id: 'paste-block' });
    });

    const domNode = editor.getDomNode();
    if (domNode) {
       // Stop default browser paste in the editor area
       domNode.addEventListener('paste', (e) => {
          e.preventDefault();
          e.stopPropagation();
       }, true);
    }
  };

  // Tab change detection & Fullscreen enforcement
  useEffect(() => {
    if (phase !== 'coding') return;

    const handleBlur = () => {
      addEvent('blur', {});
      setTelemetryStats(prev => ({ ...prev, totalTabSwitches: (prev.totalTabSwitches || 0) + 1 }));
      toast.error('⚠️ Warning: Window focus lost. This event is logged.', { id: 'blur-warn' });
    };

    const handleFocus = () => addEvent('focus', {});
    
    const handleVisibilityChange = () => {
       if (document.hidden) {
          addEvent('visibility_hidden', {});
          setTelemetryStats(prev => ({ ...prev, totalTabSwitches: (prev.totalTabSwitches || 0) + 1 }));
       }
    };

    // BLOCK NATIVE ACTIONS
    // BLOCK NATIVE ACTIONS
    const blockAction = (e) => {
       e.preventDefault();
       toast.error('🚫 This action is disabled during the assessment.', { id: 'action-block' });
       return false;
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Global block
    document.addEventListener('copy', blockAction);
    document.addEventListener('cut', blockAction);
    document.addEventListener('contextmenu', blockAction);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', blockAction);
      document.removeEventListener('cut', blockAction);
      document.removeEventListener('contextmenu', blockAction);
    };
  }, [phase, addEvent]);

  // Execute current code against public test cases
  const runCode = async () => {
    if (!code.trim()) return;
    setRunLoading(true);
    addEvent('compile', {});
    setTelemetryStats(prev => ({ ...prev, compilationCount: (prev.compilationCount || 0) + 1 }));
    
    try {
      const { data } = await api.post('/execute', { code, language, stdin: userInput });
      setOutput(data.stdout || data.stderr || data.compile_output || 'Program executed with no output.');
      if (!data.success) addEvent('compile_error', {});
    } catch (err) {
      setOutput(`[System Error]: ${err.response?.data?.message || err.message}`);
      addEvent('compile_error', {});
    } finally {
      setRunLoading(false);
    }
  };

  // Final submission
  const submitCode = async () => {
    if (!session) return;
    setSubmitLoading(true);
    flushTelemetry();
    if (flushRef.current) clearInterval(flushRef.current);
    
    try {
      const { data } = await api.post(`/sessions/${session._id}/submit`, { code });
      setResult(data);
      dispatch(setSubmissionResult(data));
      setPhase('result');
      toast.success('Your assessment has been submitted successfully.');
    } catch (err) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const res = await api.get(`/sessions/${result.session?._id}/report`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', result.reportFilename || 'assessment-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download report.');
    }
  };

  // ── PHASE 1: SELECT ──
  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-[#020817] pt-24 pb-12 px-6">
        <Navbar />
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h1 className="text-4xl font-black text-white tracking-tighter mb-4">Assessment Setup</h1>
            <p className="text-gray-400 text-lg">Select your preferred environment and challenge to begin your evaluation.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 px-1">Choose Challenge</h3>
                <div className="space-y-4">
                  {questions.map((q, index) => {
                    const isCompleted = recentSessions.some(s => s.question?._id === q._id && ['submitted', 'evaluated'].includes(s.status));
                    const isAssigned = assignedQuestions.has(q._id) && !isCompleted;
                    const isNewestUncompleted = index === 0 && !isCompleted && !isAssigned;
                    return (
                    <div 
                      key={q._id} 
                      onClick={() => setSelectedQ(q)}
                      className={`group flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                        selectedQ?._id === q._id 
                        ? 'bg-blue-600/10 border-blue-500/50' 
                        : isAssigned
                        ? 'bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border-purple-500/40 hover:border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                        : isNewestUncompleted
                        ? 'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/40 hover:border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                        : 'bg-white/5 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {isAssigned && (
                         <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-lg z-10">
                            Assigned Lab
                         </div>
                      )}
                      {!isAssigned && isNewestUncompleted && (
                         <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-lg z-10">
                            New Available
                         </div>
                      )}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        selectedQ?._id === q._id ? 'bg-blue-600' : isAssigned ? 'bg-purple-500/20 text-purple-400' : isNewestUncompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-400 group-hover:text-white'
                      }`}>
                        {q.title?.charAt(0) || 'C'}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white group-hover:text-white transition-colors uppercase tracking-tight">{q.title}</div>
                        <div className="flex gap-3 mt-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                            q.difficulty === 'Easy' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' :
                            q.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5' :
                            'text-red-400 border-red-500/30 bg-red-500/5'
                          }`}>
                            {q.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         {selectedQ?._id === q._id && <CheckCircle size={20} className="text-blue-500" />}
                         {recentSessions.some(s => s.question?._id === q._id && ['submitted', 'evaluated'].includes(s.status)) && (
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">Completed</span>
                         )}
                      </div>
                    </div>
                  );})}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 px-1">Runtime Environment</h3>
                <div className="grid grid-cols-2 gap-3">
                  {LANGUAGES.map((l) => (
                    <button 
                      key={l.value} 
                      onClick={() => setLanguage(l.value)}
                      className={`py-3 rounded-xl border font-bold text-sm transition-all ${
                        language === l.value 
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-600/20' 
                        : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 flex gap-4">
                 <Shield className="text-blue-500 shrink-0" size={24} />
                 <p className="text-[13px] text-blue-200/70 leading-relaxed font-medium">
                   This assessment utilizes <b className="text-white">AI Telemetry</b>. Tab switches, prolonged idle time, and large paste events are logged and reported for authentication scoring.
                 </p>
              </div>

              {recentSessions.some(s => s.question?._id === selectedQ?._id && ['submitted', 'evaluated'].includes(s.status)) ? (
                 <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                    <CheckCircle className="text-emerald-500 mx-auto mb-3" size={32} />
                    <div className="text-white font-black">Challenge Completed</div>
                    <div className="text-gray-500 text-xs mt-1">Review your results in the dashboard.</div>
                 </div>
              ) : (
                <button 
                  onClick={startSession} 
                  disabled={!selectedQ}
                  className="w-full py-5 rounded-2xl bg-white text-black font-black text-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 disabled:opacity-30 shadow-xl"
                >
                  Begin Assessment <ArrowRight size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE 2: RESULT ──
  if (phase === 'result' && result) {
    const score = result.prediction?.authenticityScore ?? 0;
    const label = result.prediction?.classification ?? 'N/A';
    const statusColor = score >= 85 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
    
    return (
      <div className="min-h-screen bg-[#020817] pt-24 pb-12 px-6">
        <Navbar />
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-5xl font-black text-white tracking-tighter mb-4">Assessment Summary</motion.h1>
            <p className="text-gray-500 font-medium">Your coding session has been successfully processed by the evaluation engine.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] text-center">
              <div className={`text-6xl font-black mb-2 ${statusColor}`}>{score}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Authenticity Score</div>
              <div className="mt-4 inline-block px-3 py-1 rounded-lg bg-white/5 text-xs font-bold border border-white/10 text-white">
                {label}
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] text-center">
              <div className="text-6xl font-black text-blue-500 mb-2">{result.session?.testCasesPassed ?? 0}/{result.session?.totalTestCases ?? 0}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Test Cases Passed</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] text-center">
              <div className="text-6xl font-black text-purple-500 mb-2">{result.prediction?.confidence ?? 0}%</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Analysis Confidence</div>
            </div>
          </div>

          {/* Test case breakdown */}
          <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden mb-12">
             <div className="px-8 py-6 border-b border-white/10 bg-white/[0.02]">
                <h3 className="font-bold text-white">Execution Breakdown</h3>
             </div>
             <div className="p-8 space-y-4">
                {result.testResults?.filter(tc => !tc.hidden).map((tc, k) => {
                  const hasSysError = tc.error && tc.errorMessage;
                  return (
                    <div key={k} className={`p-5 rounded-2xl border flex items-center gap-5 ${
                      tc.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 
                      hasSysError ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-red-500/5 border-red-500/20'
                    }`}>
                       {tc.passed ? <CheckCircle className="text-emerald-500" size={24} /> : <AlertTriangle className={hasSysError ? 'text-yellow-500' : 'text-red-500'} size={24} />}
                       <div className="flex-1">
                          <div className={`font-black text-sm uppercase tracking-wider ${tc.passed ? 'text-emerald-400' : hasSysError ? 'text-yellow-400' : 'text-red-400'}`}>
                             TestCase #{k+1}
                          </div>
                          <div className="text-xs text-gray-500 font-medium mt-1">Input: <span className="font-mono text-gray-300">{tc.input}</span></div>
                       </div>
                       
                       <div className="text-right">
                          {hasSysError ? (
                            <div className="text-xs font-bold text-yellow-500/80 max-w-[200px] truncate">{tc.errorMessage}</div>
                          ) : (
                            <div className="flex flex-col text-[10px] font-bold">
                               <span className="text-gray-500 uppercase tracking-widest">Output</span>
                               <span className={tc.passed ? 'text-emerald-400' : 'text-red-400'}>{tc.actual || 'No Output'}</span>
                            </div>
                          )}
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             {result.reportFilename && (
               <button 
                 onClick={handleDownloadReport}
                 className="px-10 py-5 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
               >
                 <Download size={20} /> Download Final Report (PDF)
               </button>
             )}
             <button 
                onClick={() => navigate('/candidate')}
                className="px-10 py-5 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all"
             >
                Return to Dashboard
             </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE 3: CODING ──
  const activeMonacoLang = LANGUAGES.find(l => l.value === language)?.monacoLang || 'python';

  return (
    <div className="h-screen bg-[#020817] flex flex-col overflow-hidden relative">
      {cameraDenied && phase === 'coding' && (
        <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center">
          <div className="bg-[#0A0D18] border border-red-500/30 p-10 rounded-3xl max-w-lg text-center shadow-2xl">
            <AlertTriangle className="text-red-500 mx-auto mb-6" size={56} />
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Camera Access Revoked</h2>
            <p className="text-gray-400 text-sm font-medium leading-relaxed">
              You must allow camera access for proctoring to continue your assessment. Please enable it in your browser settings and refresh the page.
            </p>
          </div>
        </div>
      )}
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <Navbar />

      {/* Proctoring Header */}
      <div className="mt-16 bg-[#0B0F1A] border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-blue-500/10"><Clock className="text-blue-500" size={18} /></div>
               <span className="text-white font-black text-xl tracking-tighter tabular-nums">{formatTimer(timer)}</span>
            </div>
            
            <TelemetryStats stats={telemetryStats} />
         </div>

         <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                <div className="pulse-dot" />
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Telemetry Active</span>
            </div>
            
            <button 
              onClick={runCode} 
              disabled={runLoading}
              className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {runLoading ? <Loader size={16} className="spin" /> : <Play size={16} />} Run Code
            </button>

            <button 
              onClick={submitCode} 
              disabled={submitLoading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {submitLoading ? <Loader size={16} className="spin" /> : <Send size={16} />} Final Submission
            </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Challenge Info */}
        <div className="w-[450px] border-r border-white/5 bg-[#0A0D18] flex flex-col overflow-hidden">
           <div className="flex border-b border-white/5 p-2 gap-2">
              <button onClick={() => setActiveTab('description')} className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'description' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>Description</button>
              <button onClick={() => setActiveTab('examples')} className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'examples' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>Examples</button>
              <button onClick={() => setActiveTab('security')} className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>Security</button>
           </div>

           <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <AnimatePresence mode="wait">
                 {activeTab === 'description' && selectedQ && (
                   <motion.div key="desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="flex items-center gap-3 mb-6">
                         <h2 className="text-2xl font-black text-white tracking-tight">{selectedQ.title}</h2>
                         <span className="text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/20">{selectedQ.difficulty}</span>
                      </div>
                      <div className="text-gray-400 leading-relaxed font-medium text-[15px] whitespace-pre-wrap">
                        {selectedQ.description}
                      </div>
                   </motion.div>
                 )}

                 {activeTab === 'examples' && (
                    <motion.div key="ex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                       {selectedQ?.examples?.map((ex, i) => (
                          <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                             <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Example {i+1}</div>
                             <div className="space-y-4">
                                <div>
                                   <div className="text-xs font-bold text-blue-400/60 mb-2">INPUT</div>
                                   <pre className="p-3 rounded-lg bg-black/40 text-[13px] text-gray-300 font-mono">{ex.input}</pre>
                                </div>
                                <div>
                                   <div className="text-xs font-bold text-emerald-400/60 mb-2">OUTPUT</div>
                                   <pre className="p-3 rounded-lg bg-black/40 text-[13px] text-emerald-400 font-mono">{ex.output}</pre>
                                </div>
                                <button 
                                  onClick={() => {
                                    setUserInput(ex.input);
                                    setShowCustomInput(true);
                                    toast.success('Example input copied to console');
                                  }}
                                  className="w-full py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-blue-500/20 transition-all focus:ring-2 focus:ring-blue-500/50"
                                >
                                   Try with this input
                                </button>
                             </div>
                          </div>
                       ))}
                    </motion.div>
                 )}

                 {activeTab === 'security' && (
                    <motion.div key="sec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                       <h3 className="text-sm font-bold text-white mb-4">Live Monitoring Events</h3>
                       {Array.isArray(liveAlerts) && liveAlerts.length === 0 ? (
                         <div className="py-20 text-center space-y-4">
                            <Shield className="mx-auto text-emerald-500/20" size={48} />
                            <p className="text-gray-500 text-xs font-medium">No suspicious behavior detected.</p>
                         </div>
                       ) : (
                         liveAlerts.map((a, j) => <AlertBanner key={j} type="warning" message={a.message || a.type} />)
                       )}
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>

        {/* Right Panel: Editor & Console */}
        <div className="flex-1 flex flex-col bg-[#020817]">
           <div className="flex-1 border-b border-white/5 relative">
              <Editor 
                 theme="vs-dark"
                 language={activeMonacoLang}
                 value={code}
                 onChange={v => setCode(v || '')}
                 onMount={handleEditorMount}
                 options={{
                    fontSize: 15,
                    fontFamily: '"JetBrains Mono", monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    padding: { top: 20, bottom: 20 },
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                    quickSuggestions: true,
                    contextmenu: false,
                 }}
              />
           </div>

            <div className="h-72 bg-[#080B14] flex flex-col border-t border-white/5">
               <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-2 text-gray-500">
                        <Terminal size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Execution Console</span>
                     </div>
                     <button 
                       onClick={() => setShowCustomInput(!showCustomInput)}
                       className={`text-[10px] font-black uppercase tracking-widest transition-all ${showCustomInput ? 'text-blue-400' : 'text-gray-600 hover:text-gray-400'}`}
                     >
                        {showCustomInput ? 'Hide Input' : 'Show Input'}
                     </button>
                  </div>
                  <button onClick={() => setOutput('')} className="text-[10px] font-bold text-gray-600 hover:text-white uppercase transition-colors">Clear Output</button>
               </div>
               
               <div className="flex flex-1 overflow-hidden">
                  {showCustomInput && (
                    <div className="w-64 border-r border-white/5 flex flex-col">
                       <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02]">
                          <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Stdin / Custom Input</span>
                       </div>
                       <textarea 
                         value={userInput}
                         onChange={(e) => setUserInput(e.target.value)}
                         placeholder="Enter input here..."
                         className="flex-1 bg-transparent p-4 text-xs font-mono text-blue-400 placeholder:text-gray-800 outline-none resize-none custom-scrollbar"
                       />
                    </div>
                  )}
                  <div className="flex-1 p-6 overflow-y-auto font-mono text-sm custom-scrollbar bg-black/20">
                     <pre className={`whitespace-pre-wrap ${output.includes('[System Error]') ? 'text-red-400' : 'text-emerald-400'}`}>
                        {output || '> Initializing runtime...\n> Input can be provided in the "Show Input" panel.'}
                     </pre>
                  </div>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}
