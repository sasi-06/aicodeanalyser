import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock,
  Mail,
  ArrowRight,
  Code2,
  ShieldCheck,
  Loader,
  Eye,
  EyeOff,
  Globe
} from 'lucide-react';
import { login } from '../../store/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && user) {
      navigate(user.role === 'recruiter' ? '/recruiter' : '/candidate');
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter all credentials');

    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      dispatch(login(data));
      toast.success(`Welcome back, ${data.user.name}!`, {
  style: {
    background: "#020817",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.1)"
  }
});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Code2 className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase">CodeAnalyser<span className="text-blue-500">.AI</span></span>
          </Link>
          <h2 className="text-3xl font-black text-white tracking-tight">Enterprise Login</h2>
          <p className="text-gray-500 font-medium mt-2">Access your assessment dashboard</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Secure Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500/20" />
                <span className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors font-medium">Remember me</span>
              </label>
              <a href="#" className="text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors">Forgot PWD?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 disabled:opacity-50"
            >
              {isLoading ? <Loader className="spin" size={20} /> : <><ShieldCheck size={20} /> Sign In to Platform</>}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="text-center text-sm text-gray-500 font-medium mb-6">Or continue with enterprise SSO</div>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all font-bold text-sm">
                <Code2 size={18} /> GitHub
              </button>
              <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all font-bold text-sm">
                <Globe size={18} /> Microsoft
              </button>
            </div>
          </div>
        </div>

        <p className="text-center mt-10 text-gray-500 font-medium">
          New to the enterprise? <Link to="/register" className="text-white font-black hover:text-blue-500 transition-colors ml-1">Create Account</Link>
        </p>
      </motion.div>
    </div>
  );
}
