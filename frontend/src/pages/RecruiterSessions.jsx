import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { FileText, Download, Eye, Filter, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RecruiterSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', classification: '' });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.status) params.set('status', filter.status);
    if (filter.classification) params.set('classification', filter.classification);
    api.get(`/recruiter/sessions?${params}`)
      .then(({ data }) => setSessions(data.sessions || []))
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, [filter]);

  const getBadge = (label) => {
    if (label === 'Genuine') return 'badge badge-genuine';
    if (label === 'Suspicious') return 'badge badge-suspicious';
    return 'badge badge-review';
  };

  return (
    <div className="layout">
      <Navbar />
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '4px' }}>All Sessions</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Complete history of all interview assessments</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select className="form-input" style={{ width: 'auto' }} value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <option value="">All Status</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="evaluated">Evaluated</option>
            </select>
            <select className="form-input" style={{ width: 'auto' }} value={filter.classification} onChange={(e) => setFilter({ ...filter, classification: e.target.value })}>
              <option value="">All Classifications</option>
              <option value="Genuine">Genuine</option>
              <option value="Review Needed">Review Needed</option>
              <option value="Suspicious">Suspicious</option>
            </select>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '48px' }} />)}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Question</th>
                    <th>Language</th>
                    <th>Auth Score</th>
                    <th>Tests</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.candidate?.name || 'N/A'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.candidate?.email}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{s.question?.title || '—'}</td>
                      <td><span className="badge badge-info">{s.language?.toUpperCase()}</span></td>
                      <td>
                        {s.authenticityScore != null ? (
                          <span className={getBadge(s.classification)}>
                            {s.authenticityScore} — {s.classification}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.testCasesPassed ?? 0}/{s.totalTestCases ?? 0}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.duration ? `${Math.floor(s.duration/60)}m ${s.duration%60}s` : '—'}</td>
                      <td>
                        <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '100px', background: s.status === 'in_progress' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: s.status === 'in_progress' ? 'var(--green)' : 'var(--text-muted)', fontWeight: 600 }}>
                          {s.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={11} />{new Date(s.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td>
                        {s.reportGenerated && (
                                          <button
                  className="btn btn-ghost btn-sm"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch(`${import.meta.env.VITE_API_URL}/sessions/${s._id}/report`, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      if (!res.ok) throw new Error('Failed to download');
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `report_${s._id}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (e) {
                      toast.error('Download failed');
                    }
                  }}
                >
                  <Download size={13} />
                </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No sessions found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
