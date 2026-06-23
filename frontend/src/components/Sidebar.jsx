import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  Code2,
  ClipboardList,
  Users,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Zap,
  BookOpen,
  LogOut,
  Brain
} from 'lucide-react';
import { logout } from '../store/authSlice';

const candidateLinks = [
  { to: '/candidate', label: 'Overview', icon: LayoutDashboard },
  { to: '/candidate/assessment', label: 'Challenge Lab', icon: Zap },
  { to: '/candidate/history', label: 'Evaluation History', icon: BookOpen },
];

const recruiterLinks = [
  { to: '/recruiter', label: 'Intelligence', icon: Brain },
  { to: '/recruiter/sessions', label: 'Active Sessions', icon: ClipboardList },
  { to: '/recruiter/candidates', label: 'Talent Pool', icon: Users },
  { to: '/recruiter/alerts', label: 'Risk Monitor', icon: AlertTriangle },
  { to: '/recruiter/questions', label: 'Question Bank', icon: FileText },
];

export default function Sidebar() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const links = user?.role === 'recruiter' || user?.role === 'admin' ? recruiterLinks : candidateLinks;

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-[#080B14] border-r border-white/5 flex flex-col z-40 hidden md:flex">
      {/* Logo */}
      <div className="px-5 pt-7 pb-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Code2 size={16} className="text-white" />
          </div>
          <span className="text-sm font-black tracking-tighter text-white uppercase">
            CodeAnalyser
          </span>
        </div>
        <div className="text-[9px] font-bold uppercase tracking-[0.35em] text-gray-600 mt-2.5 pl-10">
          {user?.role} Edition
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/recruiter' || to === '/candidate'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-150 group
              ${isActive
                ? 'bg-blue-600/10 text-blue-400'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'}
            `}
          >
            <Icon size={15} className="shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Card */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2.5 px-3 py-3 rounded-2xl bg-white/[0.03] border border-white/5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center font-black text-xs text-blue-400 shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-black text-white truncate">{user?.name}</div>
            <div className="text-[9px] font-bold text-emerald-500 flex items-center gap-1 uppercase tracking-wider">
              <ShieldCheck size={9} /> Verified
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-300 hover:text-red-400 transition-colors p-1"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
