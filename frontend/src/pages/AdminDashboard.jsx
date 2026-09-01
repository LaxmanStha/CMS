import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Users, GraduationCap, Clock, TrendingUp, BookOpen, Calendar, Award, UserPlus } from "lucide-react";
import api from "@/services/api";
import StatCard from "@/components/ui/StatCard";
import {
  ChartCard,
  BarChartBox,
  PieChartBox,
  CHART_PALETTE,
} from "@/components/charts/Charts";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const monthKey = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ students: 0, faculty: 0, pending: 0 });
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [exams, setExams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [s, f, fe, ex, notifs] = await Promise.all([
          api.get("/students"),
          api.get("/teachers"),
          api.get("/fees"),
          api.get("/exams"),
          api.get("/notifications"),
        ]);
        const studentList = s.data || [];
        setStudents(studentList);
        setStats({
          students: studentList.length,
          faculty: (f.data || []).length,
          pending: studentList.filter((st) => st.status === "pending").length,
        });
        setFees(fe.data || []);
        setExams(ex.data || []);
        setNotifications(notifs.data || []);
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const revenueByMonth = useMemo(() => {
    const buckets = {};
    fees.forEach((fee) => {
      const k = monthKey(fee.paidDate);
      if (!k) return;
      buckets[k] = (buckets[k] || 0) + (Number(fee.paid) || 0);
    });
    return Object.keys(buckets)
      .sort()
      .map((k) => ({
        month: `${MONTH_LABELS[Number(k.split("-")[1]) - 1]} ${k.split("-")[0].slice(2)}`,
        Collected: Math.round(buckets[k]),
      }));
  }, [fees]);

  const studentsByProgram = useMemo(() => {
    const buckets = {};
    students.forEach((s) => {
      const key = s.program || "Unspecified";
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.keys(buckets).map((k) => ({ name: k, value: buckets[k] }));
  }, [students]);

  const examsByType = useMemo(() => {
    const buckets = {};
    exams.forEach((x) => {
      const key = x.type || "Other";
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.keys(buckets).map((k) => ({ type: k, Exams: buckets[k] }));
  }, [exams]);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const recentNotifications = useMemo(
    () => notifications.slice(0, 5),
    [notifications]
  );

  const formatNumber = useCallback(
    (v) => v.toLocaleString(),
    []
  );

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="page-header-title">Admin Dashboard</h1>
            <p className="page-header-subtitle">Welcome back! Here's what's happening at your institution today.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <Calendar className="h-4 w-4" />
            <span>{today}</span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Students"
          value={loading ? 0 : stats.students}
          loading={loading}
          icon={Users}
          iconClass="bg-amber-500/10 text-amber-500"
          format={formatNumber}
          trend="+12%"
          trendLabel=" from last month"
          trendUp={true}
        />
        <StatCard
          title="Total Teachers"
          value={loading ? 0 : stats.faculty}
          loading={loading}
          icon={GraduationCap}
          iconClass="bg-blue-500/10 text-blue-500"
          format={formatNumber}
          trend="+5%"
          trendLabel=" from last month"
          trendUp={true}
        />
        <StatCard
          title="Pending Applications"
          value={loading ? 0 : stats.pending}
          loading={loading}
          icon={Clock}
          iconClass="bg-orange-500/10 text-orange-500"
          format={formatNumber}
          trend="-8%"
          trendLabel=" from last week"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-amber-500/20 transition-all duration-200 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
            <UserPlus className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary">Add Student</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-blue-500/20 transition-all duration-200 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary">New Course</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-emerald-500/20 transition-all duration-200 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
            <Award className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary">Schedule Exam</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-purple-500/20 transition-all duration-200 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary">View Reports</span>
        </button>
      </div>

      <div className="card-premium">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <h5 className="font-display text-base font-semibold text-text-primary">System Notifications</h5>
            {notifications.length > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500/10 px-1.5 text-[10px] font-semibold text-amber-500">
                {notifications.length}
              </span>
            )}
          </div>
        </div>
        <div className="p-5">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.03] mb-3">
                <Calendar className="h-6 w-6 text-text-tertiary" />
              </div>
              <p className="text-sm text-text-secondary">No notifications at this time</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentNotifications.map((notif) => (
                <li key={notif.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{notif.title || notif.message || JSON.stringify(notif)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ChartCard title="Fee Collection" subtitle="Revenue collected per month" className="card-premium">
        <BarChartBox
          data={revenueByMonth}
          xKey="month"
          bars={[{ key: "Collected", color: CHART_PALETTE[2] }]}
        />
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Students by Program" subtitle="Distribution across programs" className="card-premium">
          <PieChartBox
            data={studentsByProgram}
            nameKey="name"
            dataKey="value"
            colors={CHART_PALETTE}
            donut
            centerLabel={`${stats.students} total`}
          />
        </ChartCard>
        <ChartCard title="Exams by Type" subtitle="Scheduled exams grouped by type" className="card-premium">
          <BarChartBox
            data={examsByType}
            xKey="type"
            bars={[{ key: "Exams", color: CHART_PALETTE[3] }]}
          />
        </ChartCard>
      </div>
    </div>
  );
};

export default AdminDashboard;