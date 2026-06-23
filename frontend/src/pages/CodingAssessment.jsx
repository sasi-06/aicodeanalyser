import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Terminal, 
  Loader, 
  Code2, 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  Rocket, 
  ChevronRight,
  TrendingUp,
  Award,
  Download
} from 'lucide-react';
import Navbar from '../components/Navbar';
import TelemetryStats from '../components/TelemetryStats';
import AlertBanner from '../components/AlertBanner';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { setSession, setSubmissionResult } from '../store/sessionSlice';
import toast from 'react-hot-toast';
import { Button, Card, Badge, Container, Section, Stack, Grid, Heading, Paragraph } from '@/common/components';
import { animations } from '@/design-system';

const LANGUAGES = [
  { value: 'python', label: 'Python 3', monacoLang: 'python' },
  { value: 'javascript', label: 'JavaScript', monacoLang: 'javascript' },
  { value: 'java', label: 'Java', monacoLang: 'java' },
  { value: 'cpp', label: 'C++', monacoLang: 'cpp' },
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
  const [telemetryStats, setTelemetryStats] = useState({ totalKeystrokes: 0, totalPasteCount: 0, compilationCount: 0, averagePause: 0, totalTabSwitches: 0 });
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('description');

  // Refs for telemetry
  const sessionRef = useRef(null);
  const startTimeRef = useRef(null);
  const telemetryBatch = useRef([]);
  const lastKeypressRef = useRef(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const flushRef = useRef(null);

  // Load questions
  useEffect(() => {
    api.get('/questions').then(({ data }) => setQuestions(data));
  }, []);

  // Timer
  useEffect(() => {
    if (phase === 'coding') {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const formatTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Flush telemetry batch to server
  const flushTelemetry = useCallback(() => {
    if (!sessionRef.current || !telemetryBatch.current.length || !socketRef.current) return;
    socketRef.current.emit('telemetry_batch', { sessionId: sessionRef.current._id, events: [...telemetryBatch.current] });
    telemetryBatch.current = [];
  }, []);

  // Add telemetry event
  const addEvent = useCallback((type, data = {}) => {
    if (!startTimeRef.current) return;
    const timestamp = Date.now() - startTimeRef.current;
    telemetryBatch.current.push({ type, timestamp, data });
  }, []);

  // Setup socket
  const setupSocket = useCallback((sess) => {
    const socket = getSocket();
    socketRef.current = socket;
    socket.emit('join_session', { sessionId: sess._id });
    socket.on('live_alert', (alert) => {
      setLiveAlerts((prev) => [alert, ...prev].slice(0, 5));
      toast.error(`⚠️ ${alert.message}`, { duration: 4000 });
    });
    socket.on('live_telemetry', (stats) => setTelemetryStats((prev) => ({ ...prev, ...stats })));
    flushRef.current = setInterval(flushTelemetry, 3000);
    return socket;
  }, [flushTelemetry]);

  // Start session
  const startSession = async () => {
    if (!selectedQ) return toast.error('Please select a question');
    try {
      const { data } = await api.post('/sessions/start', { questionId: selectedQ._id, language });
      setSessionState(data.session);
      sessionRef.current = data.session;
      setCode(data.starterCode || '');
      startTimeRef.current = Date.now();
      dispatch(setSession(data.session));
      setupSocket(data.session);
      setPhase('coding');
      toast.success('Assessment started! Your coding behavior is being monitored.');
    } catch (err) {
      toast.error('Failed to start session');
    }
  };

  // Keyboard handler
  const onEditorKeyDown = useCallback((e) => {
    const key = e.key;
    const now = Date.now();
    if (lastKeypressRef.current) {
      const gap = now - lastKeypressRef.current;
      if (gap > 2000) addEvent('idle_end', { duration: gap });
    }
    lastKeypressRef.current = now;
    if (key === 'Backspace') addEvent('backspace', {});
    else if (key.length === 1) addEvent('keypress', { char: key });
    setTelemetryStats((prev) => ({ ...prev, totalKeystrokes: (prev.totalKeystrokes || 0) + 1 }));
  }, [addEvent]);

  // Paste handler
  const onEditorPaste = useCallback((e) => {
    const text = e.clipboardData?.getData('text') || '';
    addEvent('paste', { length: text.length });
    setTelemetryStats((prev) => ({ ...prev, totalPasteCount: (prev.totalPasteCount || 0) + 1 }));
  }, [addEvent]);

  // Mount editor events
  const handleEditorMount = (editor) => {
    editor.onKeyDown(onEditorKeyDown);
    const domNode = editor.getDomNode();
    if (domNode) domNode.addEventListener('paste', onEditorPaste);
  };

  // Tab/blur detection
  useEffect(() => {
    if (phase !== 'coding') return;
    const handleBlur = () => { addEvent('blur', {}); setTelemetryStats((prev) => ({ ...prev, totalTabSwitches: (prev.totalTabSwitches || 0) + 1 })); };
    const handleFocus = () => addEvent('focus', {});
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => { window.removeEventListener('blur', handleBlur); window.removeEventListener('focus', handleFocus); };
  }, [phase, addEvent]);

  // Run code
  const runCode = async () => {
    if (!code.trim()) return;
    setRunLoading(true);
    addEvent('compile', {});
    setTelemetryStats((prev) => ({ ...prev, compilationCount: (prev.compilationCount || 0) + 1 }));
    try {
      const { data } = await api.post('/execute', { code, language });
      setOutput(data.stdout || data.stderr || data.compile_output || 'No output');
      if (!data.success) { addEvent('compile_error', {}); }
    } catch (err) {
      setOutput('Execution error: ' + (err.response?.data?.message || err.message));
      addEvent('compile_error', {});
    } finally {
      setRunLoading(false);
    }
  };

  // Submit
  const submitCode = async () => {
    if (!session) return;
    setSubmitLoading(true);
    flushTelemetry();
    clearInterval(flushRef.current);
    try {
      const { data } = await api.post(`/sessions/${session._id}/submit`, { code });
      setResult(data);
      dispatch(setSubmissionResult(data));
      setPhase('result');
      toast.success('Submission complete! ML analysis done.');
    } catch (err) {
      toast.error('Submission failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── SELECT PHASE ──
  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <Container className="pt-32 pb-20">
          <Stack gap="xl" align="stretch">
            <header>
               <motion.div {...animations.fadeInDown}>
                  <Badge variant="primary" className="mb-4">Challenge Selector</Badge>
                  <Heading level={1} className="mb-4">Start New Assessment</Heading>
                  <Paragraph color="secondary" lead>
                    Select a question and language to begin. Your coding behavior will be securely monitored 
                    to generate an authenticity profile.
                  </Paragraph>
               </motion.div>
            </header>

            <Grid columns={3} gap="lg">
              <div className="lg:col-span-2">
                <Card className="p-8">
                  <Heading level={3} className="mb-8 flex items-center gap-3">
                    <Code2 className="text-blue-500" size={24} /> 
                    Choose a Problem
                  </Heading>
                  <Stack gap="md">
                    {questions.map((q) => (
                      <motion.div 
                        key={q._id}
                        whileHover={{ x: 4 }}
                        onClick={() => setSelectedQ(q)}
                        className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center gap-6 ${
                          selectedQ?._id === q._id 
                            ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                            : 'bg-white/5 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${
                          selectedQ?._id === q._id ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-500'
                        }`}>
                          {q.title[0]}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-white mb-2">{q.title}</div>
                          <div className="flex gap-2">
                            <Badge variant={q.difficulty?.toLowerCase() === 'hard' ? 'error' : q.difficulty?.toLowerCase() === 'medium' ? 'warning' : 'success'} size="xs">
                              {q.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedQ?._id === q._id ? 'bg-blue-600 border-blue-500' : 'border-white/10'
                        }`}>
                          {selectedQ?._id === q._id && <CheckCircle size={12} color="#fff" />}
                        </div>
                      </motion.div>
                    ))}
                  </Stack>
                </Card>
              </div>

              <Stack gap="lg">
                <Card className="p-8">
                  <Heading level={4} className="mb-6">Language</Heading>
                  <Grid columns={1} gap="xs">
                    {LANGUAGES.map((l) => (
                      <button 
                        key={l.value} 
                        onClick={() => setLanguage(l.value)}
                        className={`p-4 rounded-xl border text-left font-bold transition-all ${
                          language === l.value 
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                            : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </Grid>
                </Card>

                <Card className="p-6 bg-yellow-500/10 border-yellow-500/20">
                  <Stack gap="sm" align="start">
                    <div className="flex items-center gap-2 text-yellow-500">
                      <AlertTriangle size={18} />
                      <span className="font-black text-xs uppercase tracking-widest">Security Protocol</span>
                    </div>
                    <Paragraph variant="sm" className="text-yellow-500/80 leading-relaxed">
                      Behavioral monitoring is active. Automated plagiarism detection and 
                      typing analysis will be used to verify submission authenticity.
                    </Paragraph>
                  </Stack>
                </Card>

                <Button 
                  variant="primary" 
                  size="xl" 
                  onClick={startSession} 
                  disabled={!selectedQ}
                  className="w-full shadow-2xl shadow-blue-500/20"
                  icon={Play}
                >
                  Begin Assessment
                </Button>
              </Stack>
            </Grid>
          </Stack>
        </Container>
      </div>
    );
  }

  // ── RESULT PHASE ──
  if (phase === 'result' && result) {
    const score = result.prediction?.authenticityScore ?? 0;
    const label = result.prediction?.classification ?? 'N/A';
    
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <Container className="pt-32 pb-20">
          <Section hasPadding={false} className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <motion.div {...animations.fadeInUp}>
                <Badge variant="success" className="mb-6">Analysis Complete</Badge>
                <Heading level={1} className="mb-4">Mission Accomplished</Heading>
                <Paragraph color="secondary" lead>Your submission has been captured and verified by our ML engine.</Paragraph>
              </motion.div>
            </div>

            <Grid columns={3} gap="lg" className="mb-12">
              <Card className="p-8 text-center border-blue-500/20">
                <div className={`text-6xl font-black mb-2 ${score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {score}
                </div>
                <Paragraph variant="xs" color="muted" className="uppercase font-black tracking-widest mb-6">TrustValue™</Paragraph>
                <Badge variant={label === 'Genuine' ? 'primary' : 'warning'}>{label}</Badge>
              </Card>

              <Card className="p-8 text-center">
                <div className="text-6xl font-black text-blue-500 mb-2">
                  {result.session?.testCasesPassed ?? 0}<span className="text-2xl text-slate-700">/{result.session?.totalTestCases ?? 0}</span>
                </div>
                <Paragraph variant="xs" color="muted" className="uppercase font-black tracking-widest mb-6">Test Cases Pass</Paragraph>
                <Badge variant="info">Functionality</Badge>
              </Card>

              <Card className="p-8 text-center">
                <div className="text-6xl font-black text-purple-500 mb-2">
                  {result.prediction?.confidence ?? 0}<span className="text-2xl text-slate-700">%</span>
                </div>
                <Paragraph variant="xs" color="muted" className="uppercase font-black tracking-widest mb-6">AI Confidence</Paragraph>
                <Badge variant="secondary">Model Weight</Badge>
              </Card>
            </Grid>

            <Stack gap="lg">
              <Card className="overflow-hidden p-0">
                <div className="p-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-black text-white uppercase tracking-tight">Functional Verification</h3>
                </div>
                <div className="p-6 space-y-3">
                  {result.testResults?.filter(tc => !tc.hidden).map((tc, i) => (
                    <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${
                      tc.passed ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-red-500/5 border-red-500/20 text-red-500'
                    }`}>
                      {tc.passed ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                      <span className="font-bold text-sm">Test Case {i + 1}</span>
                      <code className="text-[10px] bg-black/30 px-2 py-1 rounded opacity-75 font-mono">Input: {tc.input}</code>
                      <div className="ml-auto text-xs font-medium">
                        Expected: <span className="opacity-75">{tc.expected}</span> | Got: <span className="font-bold">{tc.actual || 'ERROR'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex gap-4">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={() => window.open(`${import.meta.env.VITE_API_URL}/sessions/${result.session?._id}/report`, '_blank')}
                  className="flex-1"
                  icon={Download}
                >
                  Download Analysis PDF
                </Button>
                <Button variant="ghost" size="lg" onClick={() => navigate('/candidate')} className="flex-1">
                  Return to Dashboard
                </Button>
              </div>
            </Stack>
          </Section>
        </Container>
      </div>
    );
  }

  // ── CODING PHASE ──
  const monacoLang = LANGUAGES.find((l) => l.value === language)?.monacoLang || 'python';
  
  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      <Navbar />
      
      {/* Precision Control Bar */}
      <div className="mt-16 h-20 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl px-8 flex items-center gap-8 z-40">
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
          <Clock className="text-blue-500" size={18} />
          <span className="font-black text-white font-mono text-lg">{formatTimer(timer)}</span>
        </div>

        <div className="hidden md:flex items-center gap-6 border-x border-white/5 px-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Neural Monitor Active</span>
          </div>
          <TelemetryStats stats={telemetryStats} />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="md" 
            onClick={runCode} 
            disabled={runLoading}
            icon={runLoading ? Loader : Play}
            className={runLoading ? 'animate-pulse' : ''}
          >
            {runLoading ? 'Compiling...' : 'Run Test'}
          </Button>
          <Button 
            variant="primary" 
            size="md" 
            onClick={submitCode} 
            disabled={submitLoading}
            icon={submitLoading ? Loader : Send}
            className="shadow-lg shadow-blue-500/20"
          >
            Final Submit
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Intelligence Sidebar */}
        <div className="w-[450px] border-r border-white/5 flex flex-col bg-slate-900/20">
          <div className="p-4 flex gap-2">
            {['description', 'examples'].map((t) => (
              <button 
                key={t} 
                onClick={() => setActiveTab(t)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  activeTab === t ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {activeTab === 'description' && selectedQ ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-white tracking-tight">{selectedQ.title}</h2>
                  <Badge variant={selectedQ.difficulty?.toLowerCase()}>{selectedQ.difficulty}</Badge>
                </div>
                <div className="prose prose-invert max-w-none">
                   <p className="text-sm text-gray-400 leading-relaxed font-medium whitespace-pre-wrap">{selectedQ.description}</p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {selectedQ?.examples?.map((ex, i) => (
                  <Card key={i} className="p-6 bg-white/[0.02]">
                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Example {i + 1}</div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-[9px] text-gray-600 font-black uppercase mb-1">Input</div>
                        <pre className="text-xs text-white bg-black/40 p-3 rounded-xl font-mono border border-white/5 overflow-x-auto">{ex.input}</pre>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-600 font-black uppercase mb-1">Output</div>
                        <pre className="text-xs text-emerald-400 bg-black/40 p-3 rounded-xl font-mono border border-white/5 overflow-x-auto">{ex.output}</pre>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {liveAlerts.length > 0 && (
              <div className="mt-12 space-y-3">
                <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ShieldCheck size={14} /> Behavioral Violations
                </div>
                {liveAlerts.map((a, i) => (
                  <AlertBanner key={i} type="warning" message={a.message} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Neural Editor Core */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0A0D18]">
          <div className="flex-1 relative z-10">
            <Editor
              height="100%"
              language={monacoLang}
              value={code}
              theme="vs-dark"
              onChange={(v) => setCode(v || '')}
              onMount={handleEditorMount}
              options={{
                fontSize: 16,
                fontFamily: '"JetBrains Mono", monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                glyphMargin: true,
                folding: true,
                bracketPairColorization: { enabled: true },
                automaticLayout: true,
                padding: { top: 24, bottom: 24 },
                backgroundColor: 'transparent',
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 4,
              }}
            />
          </div>

          {/* Precision Console */}
          <div className="h-64 bg-slate-950 border-t border-white/10 flex flex-col shadow-2xl z-20">
            <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <Terminal size={16} className="text-blue-500" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Assessment Console</span>
              </div>
              <Badge variant="secondary" size="xs">Read Only</Badge>
            </div>
            <div className="flex-1 p-6 overflow-y-auto font-mono text-sm custom-scrollbar">
              {output ? (
                <pre className={`whitespace-pre-wrap ${output.toLowerCase().includes('error') ? 'text-red-400' : 'text-emerald-400'}`}>
                  {output}
                </pre>
              ) : (
                <div className="text-gray-600 flex flex-col items-center justify-center h-full gap-4">
                  <Cpu className="opacity-10" size={48} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">System Idle — Ready for Execution</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
