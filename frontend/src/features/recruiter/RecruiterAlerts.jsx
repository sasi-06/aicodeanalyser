import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ShieldAlert,
  Trash2,
  BellRing,
  ChevronRight,
  Clock,
  User,
  ExternalLink,
  CheckCircle2,
  Filter,
  RefreshCw,
  Search,
  ArrowUpRight
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function RecruiterAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/recruiter/alerts');
      setAlerts(data);
    } catch (err) {
      toast.error('Identity protocol synchronization failed');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAlert = async (id) => {
    try {
      // Assuming a delete endpoint exists or just filtering locally for demo
      setAlerts(prev => prev.filter(a => a._id !== id));
      toast.success('Alert dismissed from secure feed');
    } catch (err) {
      toast.error('Control protocol failure');
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-60">
        <Navbar />

        <main className="p-8 pt-24 max-w-[1200px] mx-auto w-full">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Risk Terminal</h1>
              <p className="text-gray-500 font-medium">Monitoring anomalous behavioral patterns and security violations across all nodes.</p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={loadAlerts} className="p-3 rounded-2xl bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-all"><RefreshCw size={18} /></button>
              <button className="px-6 py-3 bg-red-600 text-white font-black rounded-2xl flex items-center gap-2 hover:bg-red-700 transition-all shadow-xl shadow-red-500/20">
                <ShieldAlert size={18} /> Clear All Records
              </button>
            </div>
          </header>

          <div className="space-y-4">
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 w-full bg-white/5 animate-pulse rounded-[2rem]" />)
            ) : alerts.length === 0 ? (
              <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                <CheckCircle2 className="mx-auto text-emerald-500/20 mb-6" size={64} />
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Systems Secure</h3>
                <p className="text-gray-500 font-medium mt-2">No suspicious behavioral patterns detected in recent nodes.</p>
              </div>
            ) : (
              <AnimatePresence>
                {alerts.map((alert, index) => (
                  <motion.div
                    key={alert._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#0A0D18] border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-8 group hover:border-red-500/30 transition-all shadow-2xl"
                  >
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 border transition-all ${alert.type === 'anti-cheat' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                      }`}>
                      <BellRing size={28} className="group-hover:scale-110 transition-transform" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${alert.level === 'critical' ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-500'
                          }`}>
                          {alert.level || 'INCIDENT'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-600 font-mono uppercase tracking-widest flex items-center gap-1.5 border-l border-white/10 pl-3">
                          <Clock size={12} /> {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-white tracking-tight uppercase group-hover:text-red-500 transition-colors">{alert.message || 'Security Violation Detected'}</h4>
                      <div className="mt-3 flex items-center gap-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                          <User size={14} className="text-blue-500" /> {alert.candidate?.name || 'Candidate ID: ' + alert.candidate?._id}
                        </div>
                        <button
                          onClick={() => navigate(`/recruiter/sessions/${alert.session?._id || alert.session}`)}
                          className="text-xs font-black text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-all uppercase tracking-widest"
                        >
                          Inspect Node <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => deleteAlert(alert._id)}
                        className="p-3 rounded-xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button
                        onClick={() => deleteAlert(alert._id)}
                        className="p-3 rounded-xl bg-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/5 transition-all border border-white/5"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
