import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Search,
  Download,
  ShieldCheck,
  AlertCircle,
  Clock,
  Code2,
  Calendar,
  ChevronRight,
  User,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function RecruiterSessions() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ status: '', classification: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, [page, filter]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const { status, classification } = filter;
      const { data } = await api.get('/recruiter/sessions', {
        params: { page, limit: 10, status, classification }
      });
      setSessions(data.sessions);
      setTotalPages(data.pages);
    } catch (err) {
      toast.error('Failed to load session history');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-60">
        <Navbar />

        <main className="p-8 pt-24 max-w-[1400px] mx-auto w-full">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Session Intel</h1>
              <p className="text-gray-500 font-medium">Full historical audit of all active and completed candidate assessments.</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Search session IDs or candidates..."
                  className="pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/30 w-72 transition-all"
                />
              </div>
              <button className="px-6 py-3 bg-white/5 border border-white/10 text-gray-400 font-bold rounded-2xl flex items-center gap-2 hover:bg-white/10 hover:text-white transition-all">
                <Download size={18} /> Export CSV
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-4 custom-scrollbar">
              {['All Statuses', 'completed', 'in_progress', 'submitted'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter({ ...filter, status: s === 'All Statuses' ? '' : s })}
                  className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${(filter.status === s || (s === 'All Statuses' && filter.status === '')) ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'
                    }`}
                >
                  {s}
                </button>
              ))}
              <div className="h-4 w-px bg-white/10 mx-2" />
              {['All Rankings', 'Genuine', 'Suspicious', 'Review Needed'].map(r => (
                <button
                  key={r}
                  onClick={() => setFilter({ ...filter, classification: r === 'All Rankings' ? '' : r })}
                  className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${(filter.classification === r || (r === 'All Rankings' && filter.classification === '')) ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="bg-[#0A0D18] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Resource / Session</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Environment</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Score</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Rank</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      [1, 2, 3, 4, 5].map(i => <tr key={i}><td colSpan="5" className="px-8 py-8"><div className="h-4 w-full bg-white/5 animate-pulse rounded-full" /></td></tr>)
                    ) : sessions.map((s) => (
                      <tr key={s._id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-all group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/10">
                              <ClipboardList size={20} />
                            </div>
                            <div>
                              <div className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                                {s.candidate?.name || 'Anonymous'} <span className="text-[10px] text-gray-600 font-bold font-mono">#{s._id.slice(-6)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-gray-500 font-bold">
                                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(s.createdAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1 text-emerald-500/60"><ShieldCheck size={12} /> {s.status}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="inline-flex h-10 px-4 items-center gap-2 rounded-xl bg-white/5 border border-white/5 text-[11px] font-black text-gray-400">
                            <Code2 size={14} className="text-blue-500" /> {(s.language || 'py').toUpperCase()}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className={`text-xl font-black ${(s.authenticityScore || 0) >= 80 ? 'text-emerald-400' :
                              (s.authenticityScore || 0) >= 50 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {s.authenticityScore || '—'}
                          </div>
                          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">TrustValue™</div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.classification === 'Genuine' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              s.classification === 'Suspicious' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-white/5 text-gray-500 border-white/5'
                            }`}>
                            {s.classification || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-500 hover:text-white transition-all shadow-lg"
                              onClick={async () => {
                                try {
                                  const response = await api.get(`/sessions/${s._id}/report`, { responseType: 'blob' });
                                  const url = window.URL.createObjectURL(new Blob([response.data]));
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.setAttribute('download', `report_${s._id}.pdf`);
                                  document.body.appendChild(link);
                                  link.click();
                                  link.remove();
                                } catch (err) {
                                  toast.error('Failed to download report');
                                }
                              }}
                            >
                              <Download size={16} />
                            </button>
                            <button
                              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                              onClick={() => navigate(`/recruiter/sessions/${s._id}`)}
                            >
                              Analyze
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-8 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="text-xs font-bold text-gray-500">Showing page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span></div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 text-gray-400 disabled:opacity-20 hover:text-white transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 text-gray-400 disabled:opacity-20 hover:text-white transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
