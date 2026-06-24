import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, Download, ShieldCheck, AlertCircle, Clock, Code2, User, Calendar,
  Terminal, Activity, Zap, BarChart3, Cpu, MousePointer2, FileCode2, Video,
  Braces, GitBranch, MessageSquare, CheckCircle2, XCircle, AlertTriangle, Layers,
  TrendingUp
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Helpers ──────────────────────────────────────────────────────────────────

const scoreColor = (score) =>
  score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';

const scoreBg = (score) =>
  score >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : score >= 50 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';

const classColor = (c) =>
  c === 'Genuine' ? 'text-emerald-400' : c === 'Suspicious' ? 'text-red-400' : 'text-yellow-400';

// Animated score bar
const ScoreBar = ({ label, value, color, note }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`text-sm font-black ${color}`}>{value}%</span>
    </div>
    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full ${color === 'text-emerald-400' ? 'bg-emerald-500' : color === 'text-yellow-400' ? 'bg-yellow-500' : 'bg-red-500'}`}
      />
    </div>
    {note && <p className="text-[10px] text-gray-600">{note}</p>}
  </div>
);

// Code metric card
const MetricCard = ({ icon: Icon, label, value, sub, good, iconColor }) => (
  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-3">
    <Icon className={`${iconColor || 'text-blue-400'}`} size={20} />
    <div>
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-black ${good === undefined ? 'text-white' : good ? 'text-emerald-400' : 'text-red-400'}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-gray-600 mt-0.5">{sub}</div>}
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export default function SessionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ classification: '', notes: '', status: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => { loadSessionDetails(); }, [id]);

  const loadSessionDetails = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/sessions/${id}`);
      setData(data);
      setReviewForm({
        classification: data.session.classification || 'Review Needed',
        notes: data.session.recruiterNotes || '',
        status: data.session.status || 'submitted',
      });
      if (data.session.candidate?._id) {
        const hist = await api.get(`/sessions/my?candidateId=${data.session.candidate._id}`);
        setHistory(hist.data.filter(s => s._id !== id));
      }
    } catch (err) {
      toast.error('Failed to load session details');
      navigate('/recruiter/sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReview = async () => {
    setIsUpdating(true);
    try {
      await api.put(`/recruiter/sessions/${id}/review`, reviewForm);
      toast.success('✅ Audit confirmed & training sample saved!');
      loadSessionDetails();
    } catch (err) {
      toast.error('Failed to update audit');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadReport = async (sessionId = id) => {
    try {
      const response = await api.get(`/sessions/${sessionId}/report`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download report');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  const { session, telemetry, mlPrediction, alerts } = data;
  const codeAnalysis = mlPrediction?.codeAnalysis || null;

  // Score breakdown
  const behavioralScore = session.authenticityScore || 0;
  const codeQualityScore = session.codeQualityScore || codeAnalysis?.code_quality_score || 0;
  const testScore = session.totalTestCases > 0
    ? Math.round((session.testCasesPassed / session.totalTestCases) * 100) : 0;
  const finalScore = session.finalScore ||
    Math.round(behavioralScore * 0.40 + codeQualityScore * 0.35 + testScore * 0.25);

  return (
    <div className="min-h-screen bg-[#020817] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-60">
        <Navbar />

        <main className="p-8 pt-24 max-w-[1400px] mx-auto w-full">
          <button
            onClick={() => navigate('/recruiter/sessions')}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 font-bold text-sm uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> Back to Sessions
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── LEFT COLUMN ───────────────────────────────────────────── */}
            <div className="lg:col-span-1 space-y-6">

              {/* Candidate + Trust Score Card */}
              <div className="bg-[#0A0D18] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/10">
                    <User size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{session.candidate?.name || 'Anonymous'}</h2>
                    <p className="text-gray-500 font-bold text-sm">{session.candidate?.email || 'No email'}</p>
                  </div>
                </div>

                {/* Combined Final Score */}
                <div className="p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/10 rounded-3xl mb-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Combined AI Score</div>
                  <div className="flex items-end justify-between mb-4">
                    <div className={`text-6xl font-black ${scoreColor(finalScore)}`}>{finalScore}</div>
                    <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                      session.classification === 'Genuine' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : session.classification === 'Suspicious' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {session.classification || 'PENDING'}
                    </div>
                  </div>

                  {/* Score Breakdown Bars */}
                  <div className="space-y-4">
                    <ScoreBar label="Behavioral (40%)" value={behavioralScore} color={scoreColor(behavioralScore)} note="Typing, paste, focus, gaze" />
                    <ScoreBar label="Code Quality (35%)" value={codeQualityScore} color={scoreColor(codeQualityScore)} note="AST: complexity, naming, structure" />
                    <ScoreBar label="Test Cases (25%)" value={testScore} color={scoreColor(testScore)} note={`${session.testCasesPassed}/${session.totalTestCases} tests passed`} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Duration</div>
                    <div className="text-lg font-black text-white">{Math.floor((session.duration || 0) / 60)}m {(session.duration || 0) % 60}s</div>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Language</div>
                    <div className="text-lg font-black text-white uppercase">{session.language}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadReport()}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Export Intelligence Report
                </button>
              </div>

              {/* Behavioral Alerts */}
              <div className="bg-[#0A0D18] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-500" /> Behavioral Alerts ({alerts.length})
                </h3>
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <p className="text-emerald-400 text-sm font-bold">No behavioral anomalies detected.</p>
                    </div>
                  ) : alerts.map((alert, i) => (
                    <div key={i} className="flex gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                      <Activity size={16} className="text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-wide">{alert.type?.replace(/_/g, ' ')}</div>
                        <div className="text-[11px] text-gray-500 font-medium mt-0.5">{alert.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Audit Panel */}
              <div className="bg-[#0A0D18] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tight flex items-center gap-2">
                  <ShieldCheck size={20} className="text-blue-500" /> Manual Session Audit
                </h3>
                <p className="text-[11px] text-gray-500 font-medium mb-6">
                  Your decision becomes a <span className="text-blue-400">training sample</span> to improve the AI model.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Classification Override</label>
                    <select
                      value={reviewForm.classification}
                      onChange={(e) => setReviewForm({ ...reviewForm, classification: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-bold"
                    >
                      <option value="Genuine">✅ Genuine Candidate</option>
                      <option value="Suspicious">🚨 Suspicious / High Risk</option>
                      <option value="Review Needed">⚠️ Manual Review Required</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Recruiter Notes</label>
                    <textarea
                      value={reviewForm.notes}
                      onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })}
                      placeholder="Add comments on candidate behavior..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-medium h-28 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleUpdateReview}
                    disabled={isUpdating}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    {isUpdating ? '💾 Saving...' : '✅ Confirm & Save Training Sample'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ──────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Submitted Code */}
              <div className="bg-[#0A0D18] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <FileCode2 className="text-blue-500" size={20} />
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Submitted Solution</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    session.testCasesPassed === session.totalTestCases && session.totalTestCases > 0
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}>
                    {session.testCasesPassed} / {session.totalTestCases} Tests Passed
                  </span>
                </div>
                <div className="p-8">
                  <pre className="p-6 bg-[#020817] rounded-3xl border border-white/5 overflow-x-auto custom-scrollbar font-mono text-sm text-gray-300 leading-relaxed max-h-96">
                    <code>{session.finalCode || '// No code submitted'}</code>
                  </pre>
                </div>
              </div>

              {/* ── CONCEPTUAL QUESTIONS & ANSWERS ── */}
              {session.conceptualAnswers && session.conceptualAnswers.length > 0 && (
                <div className="bg-[#0A0D18] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <Braces className="text-blue-500" size={22} />
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Conceptual AI Verification</h3>
                  </div>

                  <div className="space-y-6">
                    {session.conceptualAnswers.map((ans, idx) => (
                      <div key={idx} className="space-y-3 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded bg-blue-500/10 text-blue-400 border border-blue-500/10 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <h4 className="text-white font-bold text-sm tracking-tight leading-snug">
                            {ans.questionText}
                          </h4>
                        </div>

                        <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
                          <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2">Candidate's Answer</div>
                          <p className="text-gray-300 text-xs leading-relaxed font-medium whitespace-pre-wrap">
                            {ans.candidateAnswer || "No answer provided"}
                          </p>
                        </div>

                        {ans.aiFeedback && (
                          <div className="flex items-start gap-2.5 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-[11px] text-blue-300 font-medium">
                            <ShieldCheck size={14} className="text-blue-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-blue-400 uppercase tracking-wider text-[9px] block mb-0.5">AI Analysis Feedback</span>
                              {ans.aiFeedback}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CODE INTELLIGENCE (AST Analysis) ── */}
              {codeAnalysis && (
                <div className="bg-[#0A0D18] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                      <Braces size={20} className="text-purple-500" /> Code Intelligence Analysis
                    </h3>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest ${
                      codeAnalysis.syntax_error
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {codeAnalysis.syntax_error ? <XCircle size={12} /> : <CheckCircle2 size={12} />}
                      {codeAnalysis.syntax_error ? 'Syntax Error' : 'Valid Syntax'}
                    </div>
                  </div>

                  {codeAnalysis.syntax_error && (
                    <div className="mb-6 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                      <p className="text-red-400 text-sm font-mono">{codeAnalysis.syntax_error_msg}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <MetricCard
                      icon={GitBranch}
                      label="Cyclomatic Complexity"
                      value={codeAnalysis.complexity}
                      sub={codeAnalysis.complexity <= 10 ? 'Low — Good' : codeAnalysis.complexity <= 20 ? 'Medium' : 'High — Complex'}
                      good={codeAnalysis.complexity <= 15}
                      iconColor="text-blue-400"
                    />
                    <MetricCard
                      icon={Braces}
                      label="Functions Defined"
                      value={codeAnalysis.function_count}
                      sub={codeAnalysis.has_functions ? 'Well structured' : 'No functions'}
                      good={codeAnalysis.has_functions}
                      iconColor="text-purple-400"
                    />
                    <MetricCard
                      icon={MessageSquare}
                      label="Comment Ratio"
                      value={`${Math.round(codeAnalysis.comment_ratio * 100)}%`}
                      sub={codeAnalysis.comment_ratio > 0.05 ? 'Documented' : 'No comments'}
                      good={codeAnalysis.comment_ratio > 0.05}
                      iconColor="text-yellow-400"
                    />
                    <MetricCard
                      icon={Layers}
                      label="Naming Quality"
                      value={codeAnalysis.good_naming ? 'Good' : 'Poor'}
                      sub={`Avg length: ${codeAnalysis.avg_name_length}`}
                      good={codeAnalysis.good_naming}
                      iconColor="text-emerald-400"
                    />
                    <MetricCard
                      icon={Code2}
                      label="Lines of Code"
                      value={codeAnalysis.code_lines}
                      sub={`${codeAnalysis.total_lines} total`}
                      iconColor="text-gray-400"
                    />
                    <MetricCard
                      icon={Activity}
                      label="Loops"
                      value={codeAnalysis.loop_count}
                      sub="for / while"
                      iconColor="text-cyan-400"
                    />
                    <MetricCard
                      icon={GitBranch}
                      label="Conditions"
                      value={codeAnalysis.condition_count}
                      sub="if / else branches"
                      iconColor="text-orange-400"
                    />
                    <MetricCard
                      icon={TrendingUp}
                      label="Code Quality"
                      value={codeAnalysis.code_quality_score}
                      sub="/ 100 (AI scored)"
                      good={codeAnalysis.code_quality_score >= 60}
                      iconColor="text-pink-400"
                    />
                  </div>

                  {/* Feature importance bar if available */}
                  {mlPrediction?.featureImportance && Object.keys(mlPrediction.featureImportance).length > 0 && (
                    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Model Feature Importance</div>
                      <div className="space-y-2">
                        {Object.entries(mlPrediction.featureImportance)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 6)
                          .map(([feat, val]) => (
                            <div key={feat} className="flex items-center gap-3">
                              <div className="text-[10px] text-gray-500 w-44 truncate font-mono">{feat.replace(/_/g, ' ')}</div>
                              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${val * 100 * 3}%` }}
                                  transition={{ duration: 0.6, ease: 'easeOut' }}
                                  className="h-full bg-blue-500 rounded-full"
                                />
                              </div>
                              <div className="text-[10px] text-gray-500 w-10 text-right">{(val * 100).toFixed(1)}%</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ML Telemetry Insights */}
              <div className="bg-[#0A0D18] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                  <Terminal size={20} className="text-emerald-500" /> Behavioral Telemetry
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <Zap className="text-yellow-500 mb-3" size={22} />
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Keystroke Speed</div>
                    <div className="text-2xl font-black text-white">{((mlPrediction?.features?.typing_speed || 0) * 60).toFixed(0)}<span className="text-[10px] text-gray-600 ml-1">CPM</span></div>
                  </div>
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <MousePointer2 className="text-blue-500 mb-3" size={22} />
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Tab Switches</div>
                    <div className="text-2xl font-black text-white">{mlPrediction?.features?.focus_loss_count || 0}<span className="text-[10px] text-gray-600 ml-1">Events</span></div>
                  </div>
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <Cpu className="text-emerald-500 mb-3" size={22} />
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Paste Ratio</div>
                    <div className="text-2xl font-black text-white">{mlPrediction?.features?.paste_ratio ? (mlPrediction.features.paste_ratio * 100).toFixed(1) : 0}<span className="text-[10px] text-gray-600 ml-1">%</span></div>
                  </div>
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <Video className="text-red-500 mb-3" size={22} />
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Off-Screen Gaze</div>
                    <div className="text-2xl font-black text-white">{telemetry?.totalOffScreenEvents || mlPrediction?.features?.off_screen_events_count || 0}<span className="text-[10px] text-gray-600 ml-1">Times</span></div>
                  </div>
                </div>
              </div>

              {/* Evaluation History */}
              <div className="bg-[#0A0D18] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                  <BarChart3 size={20} className="text-purple-500" /> Candidate Assessment History
                </h3>
                <div className="space-y-4">
                  {history.length === 0 ? (
                    <p className="text-gray-600 text-sm font-medium">No previous assessments for this candidate.</p>
                  ) : history.map((h) => (
                    <div key={h._id} className="group flex items-center gap-5 p-5 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500 text-lg border border-blue-500/10 group-hover:scale-110 transition-transform">
                        {h.question?.title?.[0]?.toLowerCase() || 'e'}
                      </div>
                      <div className="flex-1">
                        <div className="font-black text-white uppercase tracking-tight text-base mb-1">{h.question?.title || 'Assessment'}</div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500">
                          <span className="flex items-center gap-1"><Clock size={10} /> {new Date(h.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Code2 size={10} /> {h.language}</span>
                        </div>
                      </div>
                      <div className="text-center px-5 border-x border-white/5">
                        <div className={`text-xl font-black ${scoreColor(h.finalScore || h.authenticityScore)}`}>{h.finalScore || h.authenticityScore || '—'}</div>
                        <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Final Score</div>
                      </div>
                      <div className="text-center px-5">
                        <div className="text-xl font-black text-blue-500">{h.testCasesPassed || 0}/{h.totalTestCases || 0}</div>
                        <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Tests</div>
                      </div>
                      <button
                        onClick={() => handleDownloadReport(h._id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-blue-600 hover:border-blue-500 transition-all"
                      >
                        <FileCode2 size={12} /> Report
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
