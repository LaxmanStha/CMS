import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const CHART_PALETTE = [
  '#2563EB', // blue
  '#0EA5E9', // sky
  '#7C3AED', // violet
  '#F59E0B', // amber
  '#16A34A', // green
  '#F43F5E', // rose
  '#06B6D4', // cyan
  '#64748B', // slate
];

const AXIS_COLOR = 'var(--ds-grey)';
const GRID_COLOR = 'var(--ds-border)';

const tooltipStyle = {
  backgroundColor: 'var(--ds-surface)',
  border: '1px solid var(--ds-border)',
  borderRadius: '12px',
  boxShadow: 'var(--ds-shadow)',
  color: 'var(--ds-navy)',
  fontFamily: 'inherit',
  fontSize: '13px',
};

const EmptyState = ({ dark }) => (
  <div className="d-flex align-items-center justify-content-center h-100 text-center">
    <div>
      <div
        className="mx-auto mb-2"
        style={{ fontSize: 28, opacity: 0.5 }}
      >
        &#9684;
      </div>
      <p className={`small mb-0 ${dark ? 'text-white/60' : 'text-muted'}`}>
        No data available yet.
      </p>
    </div>
  </div>
);

export const ChartCard = ({
  title,
  subtitle,
  children,
  dark = false,
  className = '',
}) => (
  <div className={`card h-100 ${dark ? 'dark-card' : ''} ${className}`}>
    <div className="card-header d-flex flex-column gap-1">
      <h5
        className={`card-title ${dark ? 'text-white' : ''}`}
        style={{ marginBottom: 0 }}
      >
        {title}
      </h5>
      {subtitle && (
        <span className={`small ${dark ? 'text-white/60' : 'text-muted'}`}>
          {subtitle}
        </span>
      )}
    </div>
    <div className="card-body">
      <div className="chart-container">{children}</div>
    </div>
  </div>
);

export const BarChartBox = ({
  data = [],
  xKey,
  bars = [],
  layout = 'horizontal',
  height = 300,
}) => {
  if (!data || data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout={layout === 'horizontal' ? 'horizontal' : 'vertical'}
        margin={{ top: 8, right: 12, left: layout === 'horizontal' ? 0 : -16, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: GRID_COLOR }}
          type={layout === 'horizontal' ? 'category' : 'number'}
        />
        <YAxis
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          type={layout === 'horizontal' ? 'number' : 'category'}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(37,99,235,0.06)' }} />
        <Legend wrapperStyle={{ fontSize: 12, color: AXIS_COLOR }} />
        {bars.map((b, i) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.name || b.key}
            fill={b.color || CHART_PALETTE[i % CHART_PALETTE.length]}
            radius={layout === 'horizontal' ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            stackId={b.stackId}
            maxBarSize={48}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export const LineChartBox = ({
  data = [],
  xKey,
  lines = [],
}) => {
  if (!data || data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: GRID_COLOR }}
        />
        <YAxis
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: AXIS_COLOR }} />
        {lines.map((l, i) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name || l.key}
            stroke={l.color || CHART_PALETTE[i % CHART_PALETTE.length]}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export const AreaChartBox = ({
  data = [],
  xKey,
  areas = [],
}) => {
  if (!data || data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <defs>
          {areas.map((a, i) => {
            const color = a.color || CHART_PALETTE[i % CHART_PALETTE.length];
            return (
              <linearGradient key={a.key} id={`area-grad-${a.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: GRID_COLOR }}
        />
        <YAxis
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: AXIS_COLOR }} />
        {areas.map((a, i) => (
          <Area
            key={a.key}
            type="monotone"
            dataKey={a.key}
            name={a.name || a.key}
            stroke={a.color || CHART_PALETTE[i % CHART_PALETTE.length]}
            strokeWidth={2.5}
            fill={`url(#area-grad-${a.key})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const PieChartBox = ({
  data = [],
  nameKey,
  dataKey,
  colors = CHART_PALETTE,
  donut = false,
  centerLabel,
}) => {
  if (!data || data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={donut ? '58%' : 0}
          outerRadius="82%"
          paddingAngle={2}
          stroke="var(--ds-surface)"
          strokeWidth={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: AXIS_COLOR }} />
        {donut && centerLabel && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--ds-navy)"
            style={{ fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}
          >
            {centerLabel}
          </text>
        )}
      </PieChart>
    </ResponsiveContainer>
  );
};
