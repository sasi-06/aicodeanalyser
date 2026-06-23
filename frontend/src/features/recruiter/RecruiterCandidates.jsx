import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  MoreVertical,
  Mail,
  Send,
  CheckCircle2,
  Plus,
  Filter,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Zap,
  Loader,
  X,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { Button, Badge, Card } from '../../common/components';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function RecruiterCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]); // Multiple questions
  const [questionSearch, setQuestionSearch] = useState(''); // Search for questions
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmiting, setIsSubmiting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [candRes, questRes] = await Promise.all([
          api.get('/recruiter/candidates'),
          api.get('/questions')
        ]);
        setCandidates(Array.isArray(candRes.data) ? candRes.data : []);
        // Accepts both array and { questions: [...] }
        setQuestions(Array.isArray(questRes.data?.questions) ? questRes.data.questions : (Array.isArray(questRes.data) ? questRes.data : []));
      } catch (err) {
        toast.error('Identity protocol synchronization failed');
        setCandidates([]);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const toggleCandidate = (id) => {
    setSelectedCandidates(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleQuestion = (id) => {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (selectedQuestions.length === 0 || selectedCandidates.length === 0) {
      return toast.error('Select candidates and at least one target challenge');
    }

    setIsSubmiting(true);
    try {
      await api.post('/recruiter/assessments', {
        title: `Technical Challenge - ${new Date().toLocaleDateString()}`,
        candidateIds: selectedCandidates,
        questionIds: selectedQuestions,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
      });
      toast.success(`Deployment successful: ${selectedCandidates.length} candidates notified.`);
      setIsAssigning(false);
      setSelectedCandidates([]);
      setSelectedQuestions([]);
    } catch (err) {
      toast.error('Assignment protocol error');
    } finally {
      setIsSubmiting(false);
    }
  };

  const filteredQuestions = questions.filter(q =>
    q.title.toLowerCase().includes(questionSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020817] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-60">
        <Navbar />

        <main className="p-8 pt-24 max-w-[1400px] mx-auto w-full">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Talent Pool</h1>
              <p className="text-gray-500 font-medium">Verify, monitor, and assign assessments to registered candidates.</p>
            </div>

            <div className="flex items-center gap-4">
              {selectedCandidates.length > 0 && (
                <motion.button
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => setIsAssigning(true)}
                  className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
                >
                  <Zap size={18} /> Deploy Labs ({selectedCandidates.length})
                </motion.button>
              )}
            </div>
          </header>

          <div className="bg-[#0A0D18] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="text-gray-500" size={18} />
                  <span className="text-sm font-black text-white uppercase tracking-tight">{candidates.length} Registered</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-yellow-500/50" size={18} />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Global Watchlist Active</span>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  placeholder="Search identities..."
                  className="pl-12 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/30 w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="px-8 py-5 w-12">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.length === candidates.length && candidates.length > 0}
                        onChange={(e) => setSelectedCandidates(e.target.checked ? candidates.map(c => c._id) : [])}
                        className="w-4 h-4 rounded-md border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500/20"
                      />
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Identity Protocol</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Verification Status</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Joined</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [1, 2, 3].map(i => <tr key={i}><td colSpan="5" className="px-8 py-6"><div className="h-4 w-full bg-white/5 animate-pulse rounded" /></td></tr>)
                  ) : candidates.map((cand) => (
                    <tr key={cand._id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors group">
                      <td className="px-8 py-6">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(cand._id)}
                          onChange={() => toggleCandidate(cand._id)}
                          className="w-4 h-4 rounded-md border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                        />
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500 border border-blue-500/10">
                            {cand.name[0]}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-blue-500 transition-colors uppercase tracking-tight">{cand.name}</div>
                            <div className="text-xs text-gray-500 font-medium">{cand.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Security Clearance</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="text-xs font-bold text-gray-500 flex items-center justify-center gap-2">
                          <Calendar size={14} /> {new Date(cand.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="p-2.5 rounded-xl bg-white/5 text-gray-500 hover:text-white transition-all"><MoreVertical size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Assignment Overlay */}
        <AnimatePresence>
          {isAssigning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAssigning(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-2xl bg-[#0B0F1A] border border-white/10 rounded-[3rem] p-10 relative shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600" />

                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-3xl font-black text-white tracking-tighter mb-2">Lab Deployment</h3>
                    <p className="text-gray-500 font-medium">Assign one or more challenges to {selectedCandidates.length} Selected Candidates.</p>
                  </div>
                  <button onClick={() => setIsAssigning(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="text-gray-500" /></button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Select Challenges ({selectedQuestions.length})</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input
                          type="text"
                          value={questionSearch}
                          onChange={(e) => setQuestionSearch(e.target.value)}
                          placeholder="Filter by name..."
                          className="pl-10 pr-4 py-1.5 bg-white/5 border border-white/5 rounded-lg text-xs text-white outline-none focus:border-blue-500/30 w-48 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                      {filteredQuestions.map(q => (
                        <div
                          key={q._id}
                          onClick={() => toggleQuestion(q._id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${selectedQuestions.includes(q._id) ? 'bg-blue-600/10 border-blue-500/50' : 'bg-white/5 border-white/5 hover:border-white/10'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-colors ${selectedQuestions.includes(q._id) ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-500 group-hover:text-gray-300'}`}>
                              {q.title[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-[13px] font-bold ${selectedQuestions.includes(q._id) ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>{q.title}</span>
                              <span className={`text-[9px] font-bold uppercase ${q.difficulty === 'Easy' ? 'text-emerald-500' : q.difficulty === 'Medium' ? 'text-yellow-500' : 'text-red-500'}`}>{q.difficulty}</span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedQuestions.includes(q._id) ? 'bg-blue-600 border-blue-500' : 'border-white/10'}`}>
                            {selectedQuestions.includes(q._id) && <CheckCircle2 size={12} color="#fff" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex gap-4">
                    <div className="flex-1">
                      <Button
                        variant="primary"
                        size="xl"
                        onClick={handleAssign}
                        disabled={selectedQuestions.length === 0 || isSubmiting}
                        className="w-full flex items-center justify-center gap-2 shadow-2xl shadow-blue-500/20"
                      >
                        {isSubmiting ? <Loader className="spin" size={20} /> : <><Zap size={20} /> Deploy Technical Labs</>}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
