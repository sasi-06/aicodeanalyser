import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { AlertTriangle, Coffee, Eye, Copy, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_ICONS = {
  large_paste: Copy,
  excessive_idle: Coffee,
  tab_switch: Eye,
  focus_loss: Eye,
  instant_solution: AlertTriangle,
  suspicious_pattern: AlertTriangle,
  rapid_compile: Clock,
};

const SEVERITY_COLORS = { high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--text-muted)' };

export default function RecruiterAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/recruiter/alerts')
      .then(({ data }) => setAlerts(data))
      .catch(() => toast.error('Failed to load alerts'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.severity === filter);

  return (
    <div className="layout">
      <Navbar />
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '4px' }}>Suspicious Alerts</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Real-time behavioral anomalies detected during coding sessions</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'high', 'medium', 'low'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'} style={{ textTransform: 'capitalize' }}>{f}</button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'High Severity', count: alerts.filter(a => a.severity === 'high').length, color: 'var(--red)' },
            { label: 'Medium Severity', count: alerts.filter(a => a.severity === 'medium').length, color: 'var(--yellow)' },
            { label: 'Total Alerts', count: alerts.length, color: 'var(--blue)' },
          ].map(({ label, count, color }) => (
            <div key={label} className="card" style={{ textAlign: 'center', borderColor: `${color}30` }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{count}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Alert feed */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '12px' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <AlertTriangle size={40} style={{ margin: '0 auto 12px' }} />
            <p>No alerts found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((a) => {
              const Icon = TYPE_ICONS[a.type] || AlertTriangle;
              const color = SEVERITY_COLORS[a.severity];
              return (
                <div key={a._id} style={{ background: 'var(--bg-card)', border: `1px solid ${color}30`, borderLeft: `4px solid ${color}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{a.message}</span>
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '100px', background: `${color}15`, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.severity}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span>Candidate: <b style={{ color: 'var(--text-secondary)' }}>{a.candidate?.name || 'N/A'}</b></span>
                      <span>Type: <b style={{ color: 'var(--text-secondary)', textTransform: 'replace' }}>{a.type?.replace(/_/g, ' ')}</b></span>
                      <span>{new Date(a.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
