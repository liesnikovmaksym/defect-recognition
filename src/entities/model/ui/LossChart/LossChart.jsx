import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styles from './LossChart.module.scss';

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border-strong)',
  borderRadius: 8,
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
};

export function LossChart({ history, epochs }) {
  if (history.length < 2) return null;

  return (
    <figure className={styles.figure}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={history} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="epoch"
            type="number"
            domain={[0, epochs]}
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            stroke="var(--border-strong)"
          />
          <YAxis
            width={44}
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            stroke="var(--border-strong)"
            tickFormatter={(v) => v.toFixed(2)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(epoch) => `Епоха ${epoch}`}
            formatter={(value) => [Number(value).toFixed(4), 'Помилка']}
          />
          <Line type="monotone" dataKey="error" stroke="var(--accent-ink)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <figcaption>Помилка навчання (вісь X — епохи)</figcaption>
    </figure>
  );
}
