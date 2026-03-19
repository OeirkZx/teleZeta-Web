// [TeleZeta] StatCard Component
// Kartu statistik dengan emoji, label, dan value besar
'use client';

interface StatCardProps {
  emoji: string;
  label: string;
  value: string | number;
  delay?: number;
  trend?: { value: string; positive: boolean };
}

export default function StatCard({ emoji, label, value, delay = 0, trend }: StatCardProps) {
  return (
    <div
      className="card animate-fadeUp"
      style={{
        padding: '20px',
        animationDelay: `${delay * 0.05}s`,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</div>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          fontWeight: 500,
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p className="stat-value">{value}</p>
      {trend && (
        <p
          style={{
            fontSize: 12,
            color: trend.positive ? 'var(--success)' : 'var(--danger)',
            fontWeight: 500,
            marginTop: 4,
          }}
        >
          {trend.positive ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </div>
  );
}
