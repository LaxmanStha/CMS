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
  '#F59E0B', // amber (primary)
  '#2563EB', // blue (secondary)
  '#10B981', // emerald
  '#38BDF8', // sky
  '#8B5CF6', // violet
  '#EF4444', // red
  '#FB9F1C', // amber-alt
  '#64748B', // slate
];

const AXIS_COLOR = '#64748B';
const GRID_COLOR = 'rgba(30, 41, 61, 0.5)';

const tooltipStyle = {
  backgroundColor: '#111827',
  border: '1px solid rgba(245, 158, 11, 0.15)',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
  color: '#F8FAFC',
  fontFamily: 'Inter, sans-serif',
  fontSize: '13px',
  borderRadius: '12px',
  padding: '12px 16px',
};

const EmptyState = ({ dark }) => (
  <div className="flex items-center justify-center h-full text-center">
    <div className="flex flex-col items-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] mb-4">
        <span className="text-2xl opacity-40">📊</span>
      </div>
      <p className="text-sm text-text-tertiary">No data available yet</p>
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
  <div className={`rounded-2xl bg-[#151C2C] border border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.35)] overflow-hidden ${className}`}>
    <div className="px-6 py-5 border-b border-white/[0.06]">
      <h5 className="font-display text-base font-semibold text-text-primary">{title}</h5>
      {subtitle && (
        <span className="text-xs text-text-tertiary mt-1 block">{subtitle}</span>
      )}
    </div>
    <div className="p-6">
      <div className="h-[300px] w-full">{children}</div>
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
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(56,189,248,0.06)' }} />
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
          stroke="#151C2C"
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
            fill="#F8FAFC"
            style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}
          >
            {centerLabel}
          </text>
        )}
      </PieChart>
    </ResponsiveContainer>
  );
};

