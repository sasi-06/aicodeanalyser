import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  UserCircle,
  Code2,
  ArrowRight,
  Loader,
  CheckCircle2,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { login } from '../../store/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'candidate'
  });
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && user) {
      navigate(user.role === 'recruiter' ? '/recruiter' : '/candidate');
    }
  }, [token, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password } = formData;
    if (!name || !email || !password) return toast.error('Please fill all required fields');

    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/register', formData);
      dispatch(login(data));
      toast.success(`Welcome to CodeAnalyser.AI, ${data.user.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[140px] translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[140px] -translate-x-1/2 translate-y-1/2" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Code2 className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black text-white tracking-tighter uppercase">CodeAnalyser<span className="text-blue-500">.AI</span></span>
          </Link>
          <h2 className="text-4xl font-black text-white tracking-tight">Create Account</h2>
          <p className="text-gray-500 font-medium mt-2">Join the world's most advanced dev assessment platform</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[3rem] backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={17} />
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Marius Dan"
                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all font-medium text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Work Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={17} />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="marius@company.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all font-medium text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Secret Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={17} />
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Account Role</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'candidate' })}
                  className={`flex flex-col items-center justify-center p-5 rounded-3xl border transition-all ${formData.role === 'candidate'
                      ? 'bg-blue-600/10 border-blue-500/50 text-white'
                      : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                    }`}
                >
                  <GraduationCap size={24} className={formData.role === 'candidate' ? 'text-blue-500' : 'text-gray-500'} />
                  <span className="text-sm font-bold mt-2">Candidate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'recruiter' })}
                  className={`flex flex-col items-center justify-center p-5 rounded-3xl border transition-all ${formData.role === 'recruiter'
                      ? 'bg-purple-600/10 border-purple-500/50 text-white'
                      : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                    }`}
                >
                  <Briefcase size={24} className={formData.role === 'recruiter' ? 'text-purple-500' : 'text-gray-500'} />
                  <span className="text-sm font-bold mt-2">Recruiter</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 mt-4"
            >
              {isLoading ? <Loader className="spin" size={20} /> : <><CheckCircle2 size={20} /> Deploy Account</>}
            </button>
          </form>

          <div className="mt-8 text-center text-[11px] text-gray-600 font-bold uppercase tracking-widest px-8 leading-relaxed">
            By joining, you agree to our <a href="#" className="text-gray-400 hover:text-white">Security Protocol</a> and <a href="#" className="text-gray-400 hover:text-white">Confidentiality Terms</a>.
          </div>
        </div>

        <p className="text-center mt-8 text-gray-500 font-medium">
          Already verified? <Link to="/login" className="text-white font-black hover:text-blue-500 transition-colors ml-1">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
