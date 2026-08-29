import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap, Mail, Lock, Eye, EyeOff,
  AlertCircle, ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const shapeColorMap = {
  primary: 'bg-primary/10',
  secondary: 'bg-secondary/10',
  accent: 'bg-accent/10',
  success: 'bg-success/10',
};

const floatingShapes = [
  { x: 5, y: 10, size: 80, delay: 0, color: 'primary' },
  { x: 85, y: 5, size: 120, delay: 1, color: 'secondary' },
  { x: 15, y: 70, size: 60, delay: 2, color: 'accent' },
  { x: 75, y: 80, size: 100, delay: 3, color: 'primary' },
  { x: 50, y: 30, size: 40, delay: 1.5, color: 'success' },
];

const roleOptions = [
  { value: 'admin', label: 'Administrator' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'student', label: 'Student' },
  { value: 'accountant', label: 'Accountant' },
];

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

// Default landing route for each role after a successful login.
const roleHome = {
  admin: '/admin',
  faculty: '/faculty',
  student: '/student',
  accountant: '/accountant',
};

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
              'floating-shape rounded-full animate-float',
              shapeColorMap[shape.color] || 'bg-primary/10'
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
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
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
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="select-themed"
                  disabled={loading}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className={`rounded-2xl border p-4 ${roleInfo[selectedRole].color}`}>
                <h3 className="text-base font-semibold mb-1">{roleInfo[selectedRole].title}</h3>
                <p className="text-sm">{roleInfo[selectedRole].description}</p>
              </div>

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((prev) => ({ ...prev, email: '' })); }}
                placeholder="admin@college.edu"
                leftIcon={<Mail className="w-5 h-5" />}
                error={errors.email}
                autoComplete="email"
                disabled={loading}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((prev) => ({ ...prev, password: '' })); }}
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
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-text-secondary mb-3">
                Quick demo login
              </p>
              <div className="grid grid-cols-2 gap-2">
                {roleOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDemoLogin(option.value)}
                    disabled={loading}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-xs text-text-secondary/60">
            <p>© 2024 RapidStrik University. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;