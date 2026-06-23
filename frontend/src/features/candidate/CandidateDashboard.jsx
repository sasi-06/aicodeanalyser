import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Code2,
  Zap,
  Award,
  Clock,
  ChevronRight,
  BookOpen,
  ShieldCheck,
  TrendingUp,
  History,
  Info,
  PlayCircle,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const MOCK_ACTIVITY = [
  { name: '10/04', score: 85 },
  { name: '11/04', score: 92 },
  { name: '12/04', score: 88 },
  { name: '13/04', score: 95 },
  { name: '14/04', score: 91 },
];

export default function CandidateDashboard() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [recentSessions, setRecentSessions] = useState([]);
  const [stats, setStats] = useState({
    assessmentsCompleted: 0,
    avgAuthenticity: 0,
    topLanguage: 'Python',
    ranking: 'Pro'
  });

  useEffect(() => {
    api.get('/sessions/my').then(({ data }) => {
      setRecentSessions(data);
      if (data.length > 0) {
        const avg = Math.round(data.reduce((acc, s) => acc + (s.authenticityScore || 0), 0) / data.length);
        setStats(prev => ({ ...prev, assessmentsCompleted: data.length, avgAuthenticity: avg }));
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#020817] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64">
        <Navbar />

        <main className="p-8 pt-24 max-w-[1200px] mx-auto w-full">
          <header className="mb-12">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-4xl font-black text-white tracking-tighter mb-2 drop-shadow-md">Welcome back, {user?.name?.split(' ')[0]}</h1>
              <p className="text-gray-500 font-medium tracking-tight">Your evaluation arena is ready. Keep building your trust profile.</p>
            </motion.div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="md:col-span-2 bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><TrendingUp size={20} /></div>
                  <span className="text-sm font-black text-white uppercase tracking-widest">Authenticity Progression</span>
                </div>
                <div className="flex-1 w-full min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <AreaChart data={MOCK_ACTIVITY}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" hide />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #ffffff10' }} />
                      <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl shadow-blue-500/20">
              <div>
                <div className="p-3 bg-white/10 rounded-2xl w-fit mb-6"><Zap size={24} /></div>
                <h3 className="text-2xl font-black tracking-tight leading-tight">Ready for your next challenge?</h3>
              </div>
              <div>
                <p className="text-blue-100/70 text-sm font-medium mb-6">Take a new technical assessment to improve your score and visibility to recruiters.</p>
                <button
                  onClick={() => navigate('/candidate/assessment')}
                  className="w-full py-4 bg-white text-blue-600 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all uppercase tracking-widest text-xs"
                >
                  Start Lab <PlayCircle size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Completed', val: stats.assessmentsCompleted, icon: Award, color: 'text-emerald-500' },
              { label: 'Avg Authenticity', val: stats.avgAuthenticity + '%', icon: ShieldCheck, color: 'text-blue-500' },
              { label: 'Primary Language', val: stats.topLanguage, icon: Code2, color: 'text-purple-500' },
              { label: 'Skill Ranking', val: stats.ranking, icon: TrendingUp, color: 'text-yellow-500' },
            ].map((s, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/10 p-6 rounded-[2rem] text-center">
                <div className={`p-3 w-fit mx-auto mb-4 rounded-2xl bg-white/5 ${s.color}`}>
                  <s.icon size={20} />
                </div>
                <div className="text-2xl font-black text-white">{s.val}</div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-[#0A0D18] border border-white/10 rounded-[3rem] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-black text-white tracking-tighter">Evaluation History</h3>
              <button className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                View Archive <History size={14} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {recentSessions.length === 0 ? (
                <div className="py-20 text-center text-gray-500 font-medium">
                  No previous sessions found. Start your first assessment to see results here.
                </div>
              ) : recentSessions.map((s, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-all group">
                  <div className="flex items-center gap-6 mb-4 md:mb-0">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center font-black text-blue-500 group-hover:scale-110 transition-transform">
                      {s.question?.title?.[0] || 'C'}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white uppercase tracking-tight">{s.question?.title || 'Unknown Test'}</div>
                      <div className="text-xs text-gray-500 font-medium flex items-center gap-3">
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(s.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Code2 size={12} /> {s.language || 'Python'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className={`text-lg font-black ${s.authenticityScore >= 80 ? 'text-emerald-500' : 'text-yellow-500'}`}>
                        {s.authenticityScore || '—'}
                      </div>
                      <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Auth Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-blue-500">{s.testCasesPassed}/{s.totalTestCases}</div>
                      <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Logic Passed</div>
                    </div>
                    <button className="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                      <FileText size={14} /> Intel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
