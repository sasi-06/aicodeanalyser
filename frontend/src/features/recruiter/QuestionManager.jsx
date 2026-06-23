import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  FilePlus,
  Save,
  Settings2,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  Code2,
  ChevronDown,
  Eye,
  EyeOff,
  Search,
  BookOpen,
  Terminal,
  Cpu,
  RefreshCw,
  X,
  ChevronRight
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Button, Card, Badge, Grid, Stack, Heading, Paragraph } from '@/common/components';

export default function QuestionManager() {
  const [questions, setQuestions] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCodeTab, setActiveCodeTab] = useState('python');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Medium',
    tags: '',
    timeLimit: 15,
    memoryLimit: 256,
    languagesSupported: ['python', 'javascript', 'java', 'cpp'],
    starterCode: {
      python: '# Write your solution here\n',
      javascript: '// Write your solution here\n',
      java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n',
      cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    // Write your solution here\n    return 0;\n}\n'
    },
    examples: [
      { input: '', output: '', explanation: '' }
    ],
    testCases: [
      { input: '', expectedOutput: '', isHidden: false }
    ]
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data } = await api.get('/questions');
      // Accepts both array and { questions: [...] }
      setQuestions(Array.isArray(data?.questions) ? data.questions : (Array.isArray(data) ? data : []));
    } catch (err) {
      toast.error('Failed to load repositories');
      setQuestions([]);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return toast.error('Incomplete protocol: Title and Description required');

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      };
      await api.post('/questions', payload);
      toast.success('Challenge deployed to global bank');
      setIsCreating(false);
      loadQuestions();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deployment failure');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteQuestion = async (id) => {
    if (!window.confirm('Wipe this challenge from all records?')) return;
    try {
      await api.delete(`/recruiter/questions/${id}`);
      toast.success('Data purged');
      loadQuestions();
    } catch (err) {
      toast.error('Purge failed');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      difficulty: 'Medium',
      tags: '',
      timeLimit: 15,
      memoryLimit: 256,
      languagesSupported: ['python', 'javascript', 'java', 'cpp'],
      starterCode: {
        python: '# Write your solution here\n',
        javascript: '// Write your solution here\n',
        java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n',
        cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    // Write your solution here\n    return 0;\n}\n'
      },
      examples: [{ input: '', output: '', explanation: '' }],
      testCases: [{ input: '', expectedOutput: '', isHidden: false }]
    });
  };

  const addTestCase = () => {
    setFormData({ ...formData, testCases: [...formData.testCases, { input: '', expectedOutput: '', isHidden: false }] });
  };

  const addExample = () => {
    setFormData({ ...formData, examples: [...formData.examples, { input: '', output: '', explanation: '' }] });
  };

  const filteredQuestions = questions.filter(q =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#020817] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-60">
        <Navbar />

        <main className="p-8 pt-24 max-w-[1400px] mx-auto w-full">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Challenge Bank</h1>
              <Paragraph color="secondary">Architect custom engineering problems for talent verification.</Paragraph>
            </div>

            {!isCreating && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => setIsCreating(true)}
                icon={Plus}
                className="shadow-xl shadow-blue-500/20"
              >
                Engineer New Challenge
              </Button>
            )}
          </header>

          <AnimatePresence mode="wait">
            {isCreating ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-[#0A0D18] border border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />

                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500">
                      <FilePlus size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">Challenge Architect</h3>
                  </div>
                  <button onClick={() => setIsCreating(false)} className="p-2.5 rounded-xl bg-white/5 text-gray-500 hover:text-white transition-all"><X /></button>
                </div>

                <form onSubmit={handleCreateQuestion} className="space-y-10">
                  {/* Core Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Test Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Asynchronous Sequence Processing"
                        className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-blue-500/30 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Rank Level</label>
                      <div className="flex gap-2">
                        {['Easy', 'Medium', 'Hard'].map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setFormData({ ...formData, difficulty: d })}
                            className={`flex-1 py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${formData.difficulty === d ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                              }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Instruction Set</label>
                    <textarea
                      rows="6"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Document the challenge requirements, constraints, and success criteria..."
                      className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-medium outline-none focus:border-blue-500/30 transition-all resize-none"
                    />
                  </div>

                  {/* Performance Limits */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Clock size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Time Budget (min)</span>
                      </div>
                      <input
                        type="number"
                        value={formData.timeLimit}
                        onChange={e => setFormData({ ...formData, timeLimit: e.target.value })}
                        className="w-full px-6 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Cpu size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Memory Peak (MB)</span>
                      </div>
                      <input
                        type="number"
                        value={formData.memoryLimit}
                        onChange={e => setFormData({ ...formData, memoryLimit: e.target.value })}
                        className="w-full px-6 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Database size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Tags (csv)</span>
                      </div>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={e => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="dp, recursion, math"
                        className="w-full px-6 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Examples Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <BookOpen size={18} className="text-blue-500" /> Public Examples
                      </h4>
                      <button type="button" onClick={addExample} className="text-[10px] font-black text-blue-500 hover:text-white transition-colors uppercase tracking-widest">+ Add Example</button>
                    </div>
                    <div className="space-y-4">
                      {formData.examples.map((ex, i) => (
                        <div key={i} className="flex gap-4 items-start animate-slideCheck">
                          <div className="flex-1 grid grid-cols-2 gap-4">
                            <input placeholder="Input" value={ex.input} onChange={e => {
                              const newEx = [...formData.examples]; newEx[i].input = e.target.value; setFormData({ ...formData, examples: newEx });
                            }} className="px-5 py-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white" />
                            <input placeholder="Output" value={ex.output} onChange={e => {
                              const newEx = [...formData.examples]; newEx[i].output = e.target.value; setFormData({ ...formData, examples: newEx });
                            }} className="px-5 py-3 bg-white/5 border border-white/5 rounded-xl text-xs text-emerald-500" />
                          </div>
                          <button type="button" onClick={() => {
                            const newEx = [...formData.examples]; newEx.splice(i, 1); setFormData({ ...formData, examples: newEx });
                          }} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Test Cases Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Terminal size={18} className="text-purple-500" /> Neural Test Grid
                      </h4>
                      <button type="button" onClick={addTestCase} className="text-[10px] font-black text-purple-500 hover:text-white transition-colors uppercase tracking-widest">+ Add Case</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.testCases.map((tc, i) => (
                        <Card key={i} className="p-4 bg-white/[0.01]">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="secondary" size="xs">Case #{i + 1}</Badge>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => {
                                const newTC = [...formData.testCases]; newTC[i].isHidden = !newTC[i].isHidden; setFormData({ ...formData, testCases: newTC });
                              }} className={`px-2 py-1 rounded text-[8px] font-black uppercase ${tc.isHidden ? 'bg-purple-600/20 text-purple-400' : 'bg-blue-600/20 text-blue-400'}`}>
                                {tc.isHidden ? 'Hidden' : 'Public'}
                              </button>
                              <button type="button" className="text-gray-600 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <input placeholder="Raw Input" value={tc.input} onChange={e => {
                              const newTC = [...formData.testCases]; newTC[i].input = e.target.value; setFormData({ ...formData, testCases: newTC });
                            }} className="w-full px-4 py-2 bg-black/20 border border-white/5 rounded-lg text-xs font-mono" />
                            <input placeholder="Verify Output" value={tc.expectedOutput} onChange={e => {
                              const newTC = [...formData.testCases]; newTC[i].expectedOutput = e.target.value; setFormData({ ...formData, testCases: newTC });
                            }} className="w-full px-4 py-2 bg-black/20 border border-white/5 rounded-lg text-xs font-mono text-emerald-500" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Starter Code Section */}
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      {['python', 'javascript', 'java', 'cpp'].map(lang => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setActiveCodeTab(lang)}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${activeCodeTab === lang ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-gray-600 hover:text-gray-400'
                            }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                    <div className="bg-black/60 rounded-2xl border border-white/5 overflow-hidden">
                      <textarea
                        rows="8"
                        value={formData.starterCode[activeCodeTab]}
                        onChange={e => {
                          const newSC = { ...formData.starterCode, [activeCodeTab]: e.target.value };
                          setFormData({ ...formData, starterCode: newSC });
                        }}
                        className="w-full p-6 bg-transparent text-blue-400 font-mono text-sm outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-10 border-t border-white/5">
                    <Button variant="ghost" className="flex-1" size="xl" onClick={() => setIsCreating(false)}>Cancel Design</Button>
                    <Button variant="primary" className="flex-2" size="xl" type="submit" disabled={isLoading} icon={Save}>
                      {isLoading ? 'Processing Neural Upload...' : 'Commit Challenge to Global Bank'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Filters */}
                <div className="flex items-center justify-between mb-8">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Filter Challenges..."
                      className="pl-12 pr-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/30 w-96 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" icon={RefreshCw} onClick={loadQuestions}>Refresh</Button>
                  </div>
                </div>

                <Grid columns={2} gap="lg">
                  {filteredQuestions.map((q) => (
                    <motion.div
                      key={q._id}
                      whileHover={{ y: -5 }}
                      className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] group hover:bg-white/[0.05] transition-all relative overflow-hidden"
                    >
                      <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 transition-all group-hover:opacity-30 ${q.difficulty === 'Easy' ? 'bg-emerald-500' : q.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />

                      <div className="flex justify-between items-start mb-6 relative">
                        <div className="flex gap-2">
                          <Badge variant={q.difficulty?.toLowerCase() === 'hard' ? 'error' : q.difficulty?.toLowerCase() === 'medium' ? 'warning' : 'success'}>
                            {q.difficulty}
                          </Badge>
                          {q.tags?.slice(0, 2).map(t => (
                            <Badge key={t} variant="secondary">{t}</Badge>
                          ))}
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => deleteQuestion(q._id)} className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                        </div>
                      </div>

                      <h4 className="text-2xl font-black text-white mb-4 group-hover:text-blue-500 transition-colors uppercase tracking-tight">{q.title}</h4>
                      <Paragraph variant="sm" className="line-clamp-2 mb-10">{q.description}</Paragraph>

                      <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase">
                            <Database size={14} className="text-gray-700" /> {q.testCases?.length || 0} TestCases
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase">
                            <Clock size={14} className="text-gray-700" /> {q.timeLimit || 15}m
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-500 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:underline">
                          View Intel <ChevronRight size={14} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </Grid>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
