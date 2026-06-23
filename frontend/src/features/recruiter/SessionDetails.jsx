import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Download,
  ShieldCheck,
  AlertCircle,
  Clock,
  Code2,
  User,
  Calendar,
  Terminal,
  Activity,
  Zap,
  BarChart3,
  Cpu,
  MousePointer2,
  FileCode2
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SessionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ classification: '', notes: '', status: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [history, setHistory] = useState([]);


  useEffect(() => {
    loadSessionDetails();
  }, [id]);

  const loadSessionDetails = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/sessions/${id}`);
      setData(data);
      setReviewForm({
        classification: data.session.classification || 'Review Needed',
        notes: data.session.recruiterNotes || '',
        status: data.session.status || 'submitted'
      });

      // Load candidate history
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
      toast.success('Session audit updated successfully');
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
            {/* Left Column: Stats & Meta */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-[#0A0D18] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/10">
                    <User size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{session.candidate?.name || 'Anonymous'}</h2>
                    <p className="text-gray-500 font-bold text-sm">{session.candidate?.email || 'No email provided'}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">TrustValue™ Analysis</div>
                    <div className="flex items-end justify-between">
                      <div className={`text-6xl font-black ${(session.authenticityScore || 0) >= 80 ? 'text-emerald-400' : (session.authenticityScore || 0) >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {session.authenticityScore || '—'}
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${session.classification === 'Genuine' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          session.classification === 'Suspicious' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-white/5 text-gray-500 border-white/5'
                        }`}>
                        {session.classification || 'PENDING'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Duration</div>
                      <div className="text-lg font-black text-white">{Math.floor(session.duration / 60)}m {session.duration % 60}s</div>
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Environment</div>
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
              </div>

              <div className="bg-[#0A0D18] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-500" /> Behavioral Alerts ({alerts.length})
                </h3>
                <div className="space-y-4">
                  {alerts.length === 0 ? (
                    <p className="text-gray-600 text-sm font-medium">No behavioral anomalies detected during this session.</p>
                  ) : alerts.map((alert, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                      <div className="mt-1 text-red-500">
                        <Activity size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-wide">{alert.type}</div>
                        <div className="text-[11px] text-gray-500 font-bold mt-1 line-clamp-2">{alert.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Audit Panel */}
              <div className="bg-[#0A0D18] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                  <ShieldCheck size={20} className="text-blue-500" /> Manual Session Audit
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Classification Override</label>
                    <select
                      value={reviewForm.classification}
                      onChange={(e) => setReviewForm({ ...reviewForm, classification: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-bold"
                    >
                      <option value="Genuine">Genuine Account</option>
                      <option value="Suspicious">Suspicious / High Risk</option>
                      <option value="Review Needed">Manual Review Required</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Recruiter Internal Notes</label>
                    <textarea
                      value={reviewForm.notes}
                      onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })}
                      placeholder="Add comments on candidate behavior..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-medium h-32 resize-none"
                    ></textarea>
                  </div>
                  <button
                    onClick={handleUpdateReview}
                    disabled={isUpdating}
                    className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                  >
                    {isUpdating ? 'Saving...' : 'Confirm Audit Decision'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Code & Execution */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-[#0A0D18] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <FileCode2 className="text-blue-500" size={20} />
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Submitted Solution</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                      {session.testCasesPassed} / {session.totalTestCases} Tests Passed
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <pre className="p-6 bg-[#020817] rounded-3xl border border-white/5 overflow-x-auto custom-scrollbar font-mono text-sm text-gray-300 leading-relaxed">
                    <code>{session.finalCode || '// No code submitted'}</code>
                  </pre>
                </div>
              </div>

              <div className="bg-[#0A0D18] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                  <Terminal size={20} className="text-emerald-500" /> ML Telemetry Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <Zap className="text-yellow-500 mb-3" size={24} />
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Keystroke Dynamics</div>
                    <div className="text-2xl font-black text-white">{(mlPrediction?.features?.typing_speed * 60)?.toFixed(1) || 0} <span className="text-[10px] text-gray-600">CPM</span></div>
                  </div>
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <MousePointer2 className="text-blue-500 mb-3" size={24} />
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Tab Switches</div>
                    <div className="text-2xl font-black text-white">{mlPrediction?.features?.focus_loss_count || 0} <span className="text-[10px] text-gray-600">Events</span></div>
                  </div>
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <Cpu className="text-emerald-500 mb-3" size={24} />
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Copy-Paste Meta</div>
                    <div className="text-2xl font-black text-white">{mlPrediction?.features?.paste_ratio ? (mlPrediction.features.paste_ratio * 100).toFixed(1) : 0} <span className="text-[10px] text-gray-600">% Pasted</span></div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0A0D18] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <BarChart3 size={20} className="text-purple-500" /> Evaluation History
                  </h3>
                  <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1 hover:text-blue-400">
                    View Archive <Clock size={12} />
                  </button>
                </div>

                <div className="space-y-4">
                  {history.length === 0 ? (
                    <p className="text-gray-600 text-sm font-medium">No previous assessments found for this candidate.</p>
                  ) : history.map((h) => (
                    <div key={h._id} className="group flex items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-all">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500 text-xl border border-blue-500/10 group-hover:scale-110 transition-transform">
                        {h.question?.title?.[0]?.toLowerCase() || 'e'}
                      </div>

                      <div className="flex-1">
                        <div className="font-black text-white uppercase tracking-tight text-lg mb-1">{h.question?.title || 'EXAM'}</div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500">
                          <span className="flex items-center gap-1"><Clock size={10} /> {new Date(h.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Code2 size={10} /> {h.language}</span>
                        </div>
                      </div>

                      <div className="text-center px-6 border-x border-white/5">
                        <div className={`text-xl font-black ${h.authenticityScore >= 70 ? 'text-emerald-400' : h.authenticityScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {h.authenticityScore || '—'}
                        </div>
                        <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Auth Score</div>
                      </div>

                      <div className="text-center px-6">
                        <div className="text-xl font-black text-blue-500">
                          {h.testCasesPassed || 0}/{h.totalTestCases || 0}
                        </div>
                        <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Logic Passed</div>
                      </div>

                      <button
                        onClick={() => handleDownloadReport(h._id)}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-blue-600 hover:border-blue-500 transition-all ml-4"
                      >
                        <FileCode2 size={14} /> Intel
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
