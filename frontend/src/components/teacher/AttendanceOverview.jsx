import { ResponsiveContainer, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, Bar } from 'recharts';
import { LayoutDashboard } from 'lucide-react';

const AttendanceChart = ({ data }) => {
  if (!data.length) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-4 text-center">
        <LayoutDashboard className="mb-3 h-8 w-8 text-[var(--color-text-muted)]" />
        <p className="text-sm font-medium text-[var(--color-text)]">No attendance records yet</p>
        <p className="mt-1 max-w-xs text-xs text-[var(--color-text-muted)]">Attendance submitted through the existing Class Connect roster will appear here.</p>
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full animate-slide-up">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 12, left: -18, bottom: 52 }}>
          <CartesianGrid stroke="#252A38" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#252A38' }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={52}
          />
          <YAxis
            allowDecimals={false}
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1D24',
              border: '1px solid #252A38',
              borderRadius: 10,
              color: '#FFFFFF',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
            }}
            cursor={{ fill: 'rgba(20, 184, 166, 0.08)' }}
          />
          <Bar dataKey="Present" name="Present" fill="#14B8A6" radius={[6, 6, 0, 0]} maxBarSize={34} />
          <Bar dataKey="Absent" name="Absent" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const AttendanceOverview = ({ data, presentCount, absentCount, overallAttendance }) => {
  return (
    <div className="xl:col-span-2">
      <div className="h-full">
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[var(--color-text)]">Attendance Overview</h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Present and absent records across your courses</p>
              </div>
            </div>
          </div>
          <div className="mb-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 p-3.5 animate-scale-in">
              <p className="text-[11px] text-[var(--color-text-muted)]">Present</p>
              <p className="mt-1 text-xl font-bold text-[var(--color-success)]">{presentCount}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 p-3.5 animate-scale-in" style={{ animationDelay: '60ms' }}>
              <p className="text-[11px] text-[var(--color-text-muted)]">Absent</p>
              <p className="mt-1 text-xl font-bold text-[var(--color-danger)]">{absentCount}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-3.5 animate-scale-in" style={{ animationDelay: '120ms' }}>
              <p className="text-[11px] text-[var(--color-text-muted)]">Attendance</p>
              <p className="mt-1 text-xl font-bold text-[var(--color-primary)]">{overallAttendance}%</p>
            </div>
          </div>
          <AttendanceChart data={data} />
        </div>
      </div>
    </div>
  );
};

export default AttendanceOverview;