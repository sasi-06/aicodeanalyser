import { Keyboard, Copy, Clock, Terminal, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TelemetryStats({ stats = {} }) {
  const items = [
    { label: 'Keystrokes', value: stats.totalKeystrokes ?? 0, icon: Keyboard, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Pastes', value: stats.totalPasteCount ?? 0, icon: Copy, color: stats.totalPasteCount > 2 ? 'text-red-500' : 'text-yellow-500', bg: stats.totalPasteCount > 2 ? 'bg-red-500/10' : 'bg-yellow-500/10' },
    { label: 'Compiles', value: stats.compilationCount ?? 0, icon: Terminal, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Avg Pause', value: stats.averagePause ? `${(stats.averagePause / 1000).toFixed(1)}s` : '0s', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Tab Switches', value: stats.totalTabSwitches ?? 0, icon: Eye, color: stats.totalTabSwitches > 2 ? 'text-rose-500' : 'text-slate-400', bg: stats.totalTabSwitches > 2 ? 'bg-rose-500/10' : 'bg-white/5' },
  ];

  return (
    <div className="flex items-center gap-4">
      {items.map(({ label, value, icon: Icon, color, bg }) => (
        <motion.div 
          key={label}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl transition-all hover:bg-white/[0.05]"
        >
          <div className={`p-2 rounded-lg ${bg} ${color}`}>
            <Icon size={14} />
          </div>

          <div>
            <div className="text-sm font-black text-white leading-none">{value}</div>

            <div className="text-[9px] font-bold text-white/60 uppercase tracking-widest mt-1.5">
              {label}
            </div>

          </div>
        </motion.div>
      ))}
    </div>
  );
}