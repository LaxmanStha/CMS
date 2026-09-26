import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Calendar, UserPlus, RotateCcw, RefreshCw, AlertTriangle, Grid, Loader2 } from "lucide-react";
import api from "@/services/api";
import StatCard from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ChartCard,
  BarChartBox,
  PieChartBox,
  CHART_PALETTE,
} from "@/components/charts/Charts";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useApiData } from "@/hooks/useApiData";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const monthKey = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const AdminDashboard = () => {
  const { success } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const { data: students, loading: studentsLoading, error: studentsError } = useApiData('/students');
  const { data: teachers, loading: teachersLoading, error: teachersError } = useApiData('/teachers');
  const { data: fees, loading: feesLoading, error: feesError } = useApiData('/fees');
  const { data: notifications, loading: notificationsLoading } = useApiData('/notifications');
  
  const loading = studentsLoading || teachersLoading || feesLoading;
  const error = studentsError || teachersError || feesError;

  // Timetable generation state
  const [generating, setGenerating] = useState(false);
  const [diffResult, setDiffResult] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [conflicts, setConflicts] = useState(null);
  const [showConflicts, setShowConflicts] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/timetable/generate');
      setDiffResult(res.data);
      setShowDiff(true);
      success(`Timetable ${res.data.status === 'generated' ? 'generated' : 'adjusted'} successfully`);
    } catch (err) {
      success('Generation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleAdjust = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/timetable/adjust');
      setDiffResult(res.data);
      setShowDiff(true);
      success('Timetable adjusted successfully');
    } catch (err) {
      success('Adjust failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleConflicts = async () => {
    try {
      const res = await api.get('/timetable/conflicts');
      setConflicts(res.data);
      setShowConflicts(true);
    } catch (err) {
      success('Failed to load conflicts');
    }
  };

  const stats = useMemo(() => {
    const studentList = students || [];
    const teacherList = teachers || [];
    return {
      students: studentList.length,
      faculty: teacherList.length,
      pending: studentList.filter((st) => st.status === "pending").length,
    };
  }, [students, teachers]);

  const revenueByMonth = useMemo(() => {
    const feeList = fees || [];
    const buckets = {};
    feeList.forEach((fee) => {
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
    const studentList = students || [];
    const buckets = {};
    studentList.forEach((s) => {
      const key = s.program || "Unspecified";
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.keys(buckets).map((k) => ({ name: k, value: buckets[k] }));
  }, [students]);

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
    () => (notifications || []).slice(0, 5),
    [notifications]
  );

  const formatNumber = useCallback(
    (v) => v.toLocaleString(),
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        <Calendar className="h-4 w-4" />
        <span>{today}</span>
      </div>

      {error && (
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220, 38, 38, 0.3)', color: 'var(--color-danger)' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard title="Students by Program" subtitle="Distribution across programs">
            <PieChartBox
              data={studentsByProgram}
              nameKey="name"
              dataKey="value"
              colors={CHART_PALETTE}
              donut
              centerLabel={`${stats.students} total`}
            />
          </ChartCard>
        </div>

        <div className="space-y-4">
          <StatCard
            title="Total Students"
            value={loading ? 0 : stats.students}
            loading={loading}
            format={formatNumber}
            trendUp={true}
          />
          <StatCard
            title="Total Teachers"
            value={loading ? 0 : stats.faculty}
            loading={loading}
            format={formatNumber}
            trendUp={true}
          />
          <StatCard
            title="Pending Applications"
            value={loading ? 0 : stats.pending}
            loading={loading}
            format={formatNumber}
            trendUp={false}
          />
        </div>
      </div>

      <ChartCard title="Fee Collection" subtitle="Revenue collected per month">
        <BarChartBox
          data={revenueByMonth}
          xKey="month"
          bars={[{ key: "Collected", color: CHART_PALETTE[0] }]}
        />
      </ChartCard>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h5 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>System Notifications</h5>
          {notifications && notifications.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(22, 163, 74, 0.15)', color: 'var(--color-success)' }}>
              {notifications.length}
            </span>
          )}
        </div>
        <div>
          {notifications && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No notifications at this time</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentNotifications.map((notif) => (
                <li key={notif.id} className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-[var(--color-bg-secondary)]" style={{ border: '1px solid var(--color-border)' }}>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', color: 'var(--color-success)' }}>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{notif.title || notif.message || JSON.stringify(notif)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;