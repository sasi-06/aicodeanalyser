export default function ScoreRing({ score, size = 120 }) {
  const getColor = () => {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getLabel = () => {
    if (score >= 80) return 'Genuine';
    if (score >= 50) return 'Review';
    return 'Suspicious';
  };

  const color = getColor();
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '2px'
        }}>
          <span style={{ fontSize: size * 0.22, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: size * 0.1, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>/ 100</span>
        </div>
      </div>
      <span style={{
        fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em',
        color, textTransform: 'uppercase', padding: '3px 10px',
        background: `${color}18`, borderRadius: '100px', border: `1px solid ${color}40`
      }}>
        {getLabel()}
      </span>
    </div>
  );
}
