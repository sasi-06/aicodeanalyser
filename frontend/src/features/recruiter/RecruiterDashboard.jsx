import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, BarChart3, AlertTriangle, Search, ChevronRight, Plus, Clock,
  FileText, ShieldCheck, MoreVertical, Filter, RefreshCw, Mail, Zap,
  CheckCircle2, Download, Brain, TrendingUp, Database, RotateCcw, Sparkles
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';


const MOCK_STATS = [
  { name: 'Total Assessments', value: '1,284', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { name: 'Active Sessions', value: '42', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { name: 'Average Trust Score', value: '88%', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { name: 'Suspicious Alerts', value: '12', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
];

const CHART_DATA_TREND = [
  { name: 'Mon', completion: 40 },
  { name: 'Tue', completion: 30 },
  { name: 'Wed', completion: 65 },
  { name: 'Thu', completion: 45 },
  { name: 'Fri', completion: 90 },
];

export default function RecruiterDashboard() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardData, setDashboardData] = useState({ stats: {}, recentSessions: [] });
  const [modelStats, setModelStats] = useState(null);
  const [isRetraining, setIsRetraining] = useState(false);

  const handleDownloadReport = async (sessionId) => {
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

  const handleRetrain = async (forceWithSynthetic = false) => {
    setIsRetraining(true);
    try {
      const { data } = await api.post('/recruiter/retrain', { forceWithSynthetic, syntheticBoost: 500 });
      toast.success(`✅ Model retrained! Accuracy: ${data.accuracy}% (${data.real_samples} real + ${data.synthetic_samples} synthetic samples)`);
      // Refresh model stats
      const statsRes = await api.get('/recruiter/model-stats');
      setModelStats(statsRes.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Retrain failed';
      if (msg.includes('No labeled training data')) {
        toast('No labeled data yet. Using synthetic data only...', { icon: '⚠️' });
        handleRetrain(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsRetraining(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [candRes, sessRes, dashRes, statsRes] = await Promise.all([
          api.get('/recruiter/candidates'),
          api.get('/recruiter/sessions'),
          api.get('/recruiter/dashboard'),
          api.get('/recruiter/model-stats'),
        ]);
        setCandidates(candRes.data || []);
        setSessions(sessRes.data.sessions || []);
        setDashboardData(dashRes.data);
        setModelStats(statsRes.data);
      } catch (err) {
        toast.error('Failed to synchronize dashboard intelligence');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);


  const safeSessions = Array.isArray(sessions) ? sessions : [];

  const filteredSessions = safeSessions.filter(s =>
    s?.candidate?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s?.question?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020817] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-60">
        <Navbar />

        <main className="p-8 pt-24">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl font-black text-white tracking-tighter">
                Assessment Overview
              </motion.h1>
              <p className="text-gray-500 font-medium">Real-time intelligence and candidate performance metrics.</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold hover:bg-white/10 transition-all flex items-center gap-2">
                <RefreshCw size={16} /> Sync Data
              </button>
              <button onClick={() => navigate('/recruiter/questions')} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20">
                <Plus size={18} /> Create Challenge
              </button>
            </div>
          </header>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { name: 'Total Assessments', value: dashboardData.stats.totalAssessments || 0, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { name: 'Active Sessions', value: dashboardData.stats.activeSessions || 0, icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
              { name: 'Average Trust Score', value: (dashboardData.avgAuthenticityScore || 0) + '%', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { name: 'Suspicious Alerts', value: dashboardData.stats.suspicious || 0, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.03] border border-white/10 p-6 rounded-[2rem] hover:bg-white/[0.05] transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon size={22} />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{stat.name}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-white tracking-tight flex items-center gap-2">
                  <BarChart3 className="text-blue-500" size={20} /> Recruitment Velocity
                </h3>
                <select className="bg-transparent border-none text-gray-500 text-xs font-black uppercase tracking-widest outline-none cursor-pointer">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CHART_DATA_TREND}>
                    <defs>
                      <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #ffffff10', color: '#fff' }}
                      itemStyle={{ color: '#3b82f6' }}
                    />
                    <Area type="monotone" dataKey="completion" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorComp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity Mini-Feed */}
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem]">
              <h3 className="font-bold text-white tracking-tight mb-8">Real-time Insights</h3>
              <div className="space-y-6">
                {safeSessions.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full mt-2 ${s.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'}`} />
                      {i !== 4 && <div className="w-px h-full bg-white/5 my-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="text-xs font-bold text-white mb-0.5">{s.candidate?.name || 'Anonymous Cand.'}</div>
                      <div className="text-[11px] text-gray-500 font-medium">Started <span className="text-blue-400">"{s.question?.title}"</span> assessment</div>
                      <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── AI MODEL HEALTH ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-[#0D0F1E] to-[#0A0D18] border border-purple-500/20 rounded-[2.5rem] p-8 mb-10 shadow-2xl"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Brain className="text-purple-400" size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">AI Model Intelligence</h3>
                  <p className="text-gray-500 text-sm font-medium">Self-learning engine powered by recruiter feedback</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest ${
                  modelStats?.mlService?.model_loaded
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    modelStats?.mlService?.model_loaded ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                  }`} />
                  {modelStats?.mlService?.model_loaded ? 'Model Online' : 'Model Offline'}
                </div>
                <button
                  onClick={() => handleRetrain()}
                  disabled={isRetraining}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-purple-500/20"
                >
                  {isRetraining
                    ? <><RotateCcw size={14} className="animate-spin" /> Retraining...</>
                    : <><Sparkles size={14} /> Retrain Model</>
                  }
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                {
                  icon: Database,
                  label: 'Training Samples',
                  value: modelStats?.trainingData?.total ?? '—',
                  sub: `${modelStats?.trainingData?.genuine || 0} Genuine · ${modelStats?.trainingData?.suspicious || 0} Suspicious`,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10 border-blue-500/20',
                },
                {
                  icon: TrendingUp,
                  label: 'Model Accuracy',
                  value: modelStats?.mlService?.accuracy ? `${modelStats.mlService.accuracy}%` : `${modelStats?.trainingData?.modelAccuracyOnRealData || 0}%`,
                  sub: 'On labeled real data',
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/10 border-emerald-500/20',
                },
                {
                  icon: Brain,
                  label: 'Model Type',
                  value: modelStats?.mlService?.model_type?.replace('Classifier', '') || 'GradientBoosting',
                  sub: `${modelStats?.mlService?.feature_count || 11} features`,
                  color: 'text-purple-400',
                  bg: 'bg-purple-500/10 border-purple-500/20',
                },
                {
                  icon: Clock,
                  label: 'Last Retrained',
                  value: modelStats?.mlService?.last_trained
                    ? new Date(modelStats.mlService.last_trained).toLocaleDateString()
                    : 'Never',
                  sub: modelStats?.mlService?.last_trained
                    ? new Date(modelStats.mlService.last_trained).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Retrain to improve accuracy',
                  color: 'text-yellow-400',
                  bg: 'bg-yellow-500/10 border-yellow-500/20',
                },
              ].map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className={`p-5 rounded-2xl border ${m.bg} flex flex-col gap-3`}
                >
                  <m.icon className={m.color} size={20} />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{m.label}</div>
                    <div className={`text-xl font-black ${m.color}`}>{m.value}</div>
                    <div className="text-[10px] text-gray-600 mt-0.5">{m.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {modelStats?.trainingData?.total === 0 && (
              <div className="mt-6 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl flex items-center gap-3">
                <AlertTriangle size={16} className="text-yellow-500 shrink-0" />
                <p className="text-yellow-400 text-sm font-medium">
                  No real training data yet. <span className="font-black">Review and confirm sessions</span> to build your training dataset, then click Retrain Model.
                </p>
              </div>
            )}
          </motion.div>

          {/* Detailed Table Section */}
          <div className="bg-[#0A0D18] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
              <h3 className="text-xl font-black text-white tracking-tighter">Candidate Evaluation Center</h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidates..."
                    className="pl-12 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/30 transition-all w-64"
                  />
                </div>
                <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-500 hover:text-white transition-all"><Filter size={18} /></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Candidate / ID</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Status / Activity</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">TrustScore™</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">ML CLASSIFICATION</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [1, 2, 3].map(i => <tr key={i}><td className="px-8 py-6"><div className="h-4 w-48 bg-white/5 animate-pulse rounded" /></td></tr>)
                  ) : filteredSessions.map((row) => (
                    <tr key={row._id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center font-black text-blue-400 border border-blue-500/10">
                            {row.candidate?.name?.[0]?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{row.candidate?.name || 'Anonymous'}</div>
                            <div className="text-xs text-gray-500 font-medium">{row.candidate?.email || 'no-email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'completed' || row.status === 'submitted' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-blue-500 shadow-[0_0_8px_#3b82f6]'}`} />
                            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{row.status === 'submitted' ? 'READY FOR REVIEW' : row.status}</span>
                          </div>
                          <div className="text-[11px] text-gray-600 font-black tracking-tight">{row.question?.title || 'Unknown Test'}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className={`text-xl font-black ${row.authenticityScore >= 80 ? 'text-emerald-400' :
                            row.authenticityScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                          {row.authenticityScore || '—'}
                        </div>
                        <div className="text-[10px] font-medium text-gray-600 uppercase tracking-widest">Confidence</div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${row.classification === 'Genuine' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            row.classification === 'Suspicious' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              'bg-white/5 text-gray-400 border-white/10'
                          }`}>
                          {row.classification || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {row.status === 'submitted' && (
                            <button
                              onClick={() => handleDownloadReport(row._id)}
                              className="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:border-blue-500/50 transition-all flex items-center gap-2"
                            >
                              <Download size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/recruiter/sessions/${row._id}`)}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-[11px] font-black hover:bg-blue-700 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20"
                          >
                            View Intel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
