import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Mail, Lock, Eye, EyeOff,
  AlertCircle, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const floatingShapes = [
  { x: 5, y: 10, size: 80, delay: 0 },
  { x: 85, y: 5, size: 120, delay: 1 },
  { x: 15, y: 70, size: 60, delay: 2 },
  { x: 75, y: 80, size: 100, delay: 3 },
  { x: 50, y: 30, size: 40, delay: 1.5 }
];

const roleOptions = [
  { value: "admin", label: "Administrator" },
  { value: "teacher", label: "Teachers" },
  { value: "student", label: "Student" },
  { value: "accountant", label: "Accountant" }
];

const roleInfo = {
  admin: {
    title: "Admin Panel",
    description: "Manage users, courses, reports, and institutional settings.",
  },
  teacher: {
    title: "Faculty Panel",
    description: "View teaching schedule, grade students, and manage attendance.",
  },
  student: {
    title: "Student Panel",
    description: "Check courses, grades, attendance, and fees information.",
  },
  accountant: {
    title: "Accountant Panel",
    description: "Handle fee collection, invoices, payments, and financial reports.",
  },
};

const roleHome = {
  admin: "/admin",
  teacher: "/faculty",
  student: "/student",
  accountant: "/accountant",
};

const roleFromEmail = (value) => {
  const u = (value || "").toLowerCase();
  if (u.includes("admin")) return "admin";
  if (u.includes("faculty") || u.includes("teacher")) return "teacher";
  if (u.includes("accountant")) return "accountant";
  if (u.includes("student")) return "student";
  return null;
};

const Login = () => {
  const { login } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("admin");
  const [email, setEmail] = useState("admin@college.edu");
  const [password, setPassword] = useState("password123");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formAnim, setFormAnim] = useState("hidden");
  const formRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setFormAnim("visible"), 300);
    return () => clearTimeout(timer);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email format";

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const loginRole = roleFromEmail(email) || selectedRole;

    try {
      const result = await login(email, password, loginRole);
      const routedRole = result?.user?.role || loginRole;
      toastSuccess(`Welcome back, ${routedRole.charAt(0).toUpperCase() + routedRole.slice(1)} Redirecting...`);
      setTimeout(() => navigate(roleHome[routedRole] || "/student"), 800);
    } catch (err) {
      toastError("Invalid credentials. Please try again.");
      setErrors({ form: err?.message || "Invalid email or password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col md:flex-row" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="floating-shapes absolute inset-0 pointer-events-none">
        {floatingShapes.map((shape, i) => (
          <div
            key={i}
            className="floating-shape rounded-full animate-float"
            style={{
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              width: `${shape.size}px`,
              height: `${shape.size}px`,
              animationDelay: `${shape.delay}s`,
              animationDuration: `${6 + shape.delay}s`,
              background: `radial-gradient(circle, var(--color-accent-muted) 0%, transparent 70%)`,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/5 via-transparent to-[var(--color-info)]/5" />
      </div>

      <div className="relative z-10 w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-12" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg" style={{ backgroundColor: 'var(--color-accent)', boxShadow: '0 0 30px rgba(102, 252, 241, 0.2)' }}>
            <GraduationCap className="w-10 h-10" style={{ color: 'var(--color-bg-primary)' }} />
          </div>
          <h1 className="font-bold text-3xl mb-3 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>RapidStrik University</h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>Empowering education through seamless digital access for students, faculty, and staff.</p>
        </div>
      </div>

      <div className="relative z-10 w-full md:w-1/2 flex items-center justify-center p-4 md:p-8" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div
          ref={formRef}
          className={cn(
            "w-full max-w-md bg-[var(--color-bg-card)] border rounded-2xl p-8 shadow-[var(--shadow-elevated)] animate-fade-in",
            formAnim === "visible" ? "animate-slide-up" : "opacity-0 translate-y-4"
          )}
          style={{ borderColor: 'var(--color-border)', animationDelay: "400ms" }}
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Welcome back</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Sign in to your portal to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Select role</label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  const newRole = e.target.value;
                  setSelectedRole(newRole);
                  const roleEmail = newRole === "teacher" ? "faculty@college.edu" : `${newRole}@college.edu`;
                  setEmail(roleEmail);
                  setPassword("password123");
                }}
                className="select-themed"
                disabled={loading}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-accent-muted)' }}>
              <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{roleInfo[selectedRole].title}</h3>
              <p className="text-sm" style={{ color: 'var(--color-accent)' }}>{roleInfo[selectedRole].description}</p>
            </div>

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((prev) => ({ ...prev, email: "" })); }}
              placeholder="admin@college.edu"
              leftIcon={<Mail className="w-5 h-5" />}
              error={errors.email}
              autoComplete="email"
              disabled={loading}
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((prev) => ({ ...prev, password: "" })); }}
              placeholder="password123"
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              error={errors.password}
              autoComplete="current-password"
              disabled={loading}
            />

            {errors.form && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: 'rgba(220, 38, 38, 0.15)', borderColor: 'rgba(220, 38, 38, 0.3)', color: 'var(--color-danger)' }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]/20 focus:ring-2"
                />
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Remember me</span>
              </label>
              <a href="/forgot-password" className="text-sm font-medium hover:underline transition-colors" style={{ color: 'var(--color-accent)' }}>
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full py-3.5 text-base"
              loading={loading}
              fullWidth
              icon={<ArrowRight className="w-5 h-5" />}
              iconPosition="right"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-xs z-10" style={{ color: 'var(--color-text-muted)' }}>
        <p>&copy; {new Date().getFullYear()} RapidStrik University. All rights reserved.</p>
      </div>
    </div>
  )
};

export default Login;