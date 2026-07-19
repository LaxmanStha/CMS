import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Mail, Lock, Eye, EyeOff, 
  AlertCircle, CheckCircle, Loader2, ArrowRight,
  Building2, Users, BookOpen, Award, TrendingUp,
  Sparkles, Zap, Shield, Globe
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const floatingShapes = [
  { x: 5, y: 10, size: 80, delay: 0, color: 'primary' },
  { x: 85, y: 5, size: 120, delay: 1, color: 'secondary' },
  { x: 15, y: 70, size: 60, delay: 2, color: 'accent' },
  { x: 75, y: 80, size: 100, delay: 3, color: 'primary' },
  { x: 50, y: 30, size: 40, delay: 1.5, color: 'success' },
];

const features = [
  { icon: Users, title: 'Student Management', desc: 'Complete student lifecycle from enrollment to graduation' },
  { icon: Building2, title: 'Faculty Portal', desc: 'Dedicated tools for professors and teaching staff' },
  { icon: BookOpen, title: 'Course Catalog', desc: 'Comprehensive course and curriculum management' },
  { icon: Award, title: 'Examinations', desc: 'Automated exam scheduling and grading system' },
  { icon: TrendingUp, title: 'Analytics', desc: 'Real-time insights with beautiful dashboards' },
  { icon: Globe, title: 'Multi-Campus', desc: 'Manage multiple campuses from one platform' },
];

const Login = () => {
  const { login } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('admin');
  const [email, setEmail] = useState('admin@college.edu');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formAnim, setFormAnim] = useState('hidden');
  const formRef = useRef(null);

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'faculty', label: 'Faculty' },
    { value: 'student', label: 'Student' },
    { value: 'accountant', label: 'Accountant' },
  ];

  // Derive the role from the email so the server can't log you in as the
  // wrong role (e.g. admin@college.edu must always be an admin).
  const roleFromEmail = (value) => {
    const u = (value || '').toLowerCase();
    if (u.includes('admin')) return 'admin';
    if (u.includes('faculty')) return 'faculty';
    if (u.includes('accountant')) return 'accountant';
    if (u.includes('student')) return 'student';
    return null;
  };

  // Default landing route for each role after a successful login.
  const roleHome = {
    admin: '/dashboard',
    faculty: '/dashboard',
    student: '/dashboard',
    accountant: '/dashboard',
  };

  const roleInfo = {
    admin: {
      title: 'Admin Panel',
      description: 'Manage users, courses, reports, and institutional settings.',
      color: 'bg-red-500/10 text-red-700 border-red-200',
    },
    faculty: {
      title: 'Faculty Panel',
      description: 'View teaching schedule, grade students, and manage attendance.',
      color: 'bg-blue-500/10 text-blue-700 border-blue-200',
    },
    student: {
      title: 'Student Panel',
      description: 'Check courses, grades, attendance, and fees information.',
      color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
    },
    accountant: {
      title: 'Accountant Panel',
      description: 'Handle fee collection, invoices, payments, and financial reports.',
      color: 'bg-amber-500/10 text-amber-700 border-amber-200',
    },
  };

  useEffect(() => {
    const timer = setTimeout(() => setFormAnim('visible'), 300);
    return () => clearTimeout(timer);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
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
      toastSuccess(`Welcome back, ${routedRole.charAt(0).toUpperCase() + routedRole.slice(1)}! Redirecting...`);
      setTimeout(() => navigate(roleHome[routedRole] || '/student'), 800);
    } catch (err) {
      toastError('Invalid credentials. Please try again.');
      setErrors({ form: err?.message || 'Invalid email or password' });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setSelectedRole(role);
    const demoEmail = `${role}@college.edu`;
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    try {
      await login(demoEmail, 'password123', roleFromEmail(demoEmail) || role);
      toastSuccess(`Logged in as ${role}!`);
      setTimeout(() => navigate(roleHome[role] || '/student'), 800);
    } catch (err) {
      toastError('Demo login failed');
      setErrors({ form: err?.message || 'Demo login failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="floating-shapes absolute inset-0 pointer-events-none">
        {floatingShapes.map((shape, i) => (
          <div
            key={i}
            className={cn(
              'floating-shape rounded-full opacity-10 animate-float',
              `bg-${shape.color}-500`,
              shape.color === 'accent' && 'bg-accent/10'
            )}
            style={{
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              width: `${shape.size}px`,
              height: `${shape.size}px`,
              animationDelay: `${shape.delay}s`,
              animationDuration: `${6 + shape.delay}s`,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Link to="/login" className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <span className="font-bold text-2xl text-text-primary">RapidStrik</span>
            </Link>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Login to Your Portal</h1>
            <p className="text-text-secondary">Select your role and sign in to continue.</p>
          </div>

          <div 
            ref={formRef}
            className={cn(
              'glass rounded-2xl p-8 shadow-xl animate-fade-in',
              formAnim === 'visible' ? 'animate-slide-up' : 'opacity-0 translate-y-4'
            )}
            style={{ animationDelay: '400ms' }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Select role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setSelectedRole(newRole);
                      setEmail(`${newRole}@college.edu`);
                      setPassword('password123');
                    }}
                    className="input w-full"
                    disabled={loading}
                  >
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className={`rounded-3xl border p-4 ${roleInfo[selectedRole].color}`}>
                  <h3 className="text-lg font-semibold mb-2">{roleInfo[selectedRole].title}</h3>
                  <p className="text-sm text-current">{roleInfo[selectedRole].description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDemoLogin(selectedRole)}
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-primary text-white font-medium transition hover:bg-primary-dark disabled:opacity-50"
                >
                  Continue as {roleOptions.find(opt => opt.value === selectedRole)?.label}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: '' })); }}
                  placeholder="admin@college.edu"
                  leftIcon={<Mail className="w-5 h-5" />}
                  error={errors.email}
                  autoComplete="email"
                  disabled={loading}
                  className="group"
                />
              </div>

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: '' })); }}
                  placeholder="Enter your password"
                  leftIcon={<Lock className="w-5 h-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-text-secondary hover:text-text-primary transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  error={errors.password}
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              {errors.form && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 text-danger text-sm animate-shake">
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
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 focus:ring-2"
                  />
                  <span className="text-sm text-text-secondary">Remember me</span>
                </label>
                <a href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full py-3.5 text-base"
                loading={loading}
                fullWidth
              >
                {loading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-text-secondary mb-4">
                Or continue with
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="btn btn-outline btn-ghost justify-center gap-2" disabled={loading}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  <span>Google</span>
                </button>
                <button type="button" className="btn btn-outline btn-ghost justify-center gap-2" disabled={loading}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.807 1.305 3.49.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.402 1.02.003 2.04.138 3 .403 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .318.21.69.825.577C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  <span>GitHub</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-xs text-text-secondary/60">
          <p>© 2024 RapidStrik University. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
