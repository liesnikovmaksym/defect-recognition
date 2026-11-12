import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styles from './CumulativeChart.module.scss';

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border-strong)',
  borderRadius: 8,
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
};

export function CumulativeChart({ values }) {
  const step = 256 / values.length;
  const data = values.map((value, k) => ({ upTo: Math.round((k + 1) * step) - 1, value }));

  return (
    <figure className={styles.figure}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="upTo"
            type="number"
            domain={[0, 255]}
            ticks={[0, 64, 128, 192, 255]}
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            stroke="var(--border-strong)"
          />
          <YAxis
            width={36}
            domain={[0, 1]}
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            stroke="var(--border-strong)"
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(upTo) => `Яскравість ≤ ${upTo}`}
            formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Частка пікселів']}
          />
          <Area
            type="stepAfter"
            dataKey="value"
            stroke="var(--accent-ink)"
            strokeWidth={2}
            fill="var(--accent-ink)"
            fillOpacity={0.12}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <figcaption>
        Кумулятивна гістограма: частка пікселів з яскравістю ≤ k (вісь X — яскравість 0–255, {values.length} бінів)
      </figcaption>
    </figure>
  );
}
