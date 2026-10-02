import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Lock, Mail, ArrowRight, ShieldCheck, Users, Briefcase } from 'lucide-react';

const DEMO_USERS = [
  {
    role: 'Admin',
    name: 'Bhaskar Jyoti Baruah',
    email: 'admin@assamtech.in',
    password: 'admin123',
    desc: 'Chief Administrator: organization-wide access & reporting lines',
    color: 'bg-purple-50 hover:bg-purple-100/80 border-purple-200 text-purple-950',
    badge: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    role: 'Manager',
    name: 'Gitashree Saikia',
    email: 'gitashree.mgr@assamtech.in',
    password: 'password123',
    desc: 'Department Head: manages Tech Leads and downline staff',
    color: 'bg-blue-50 hover:bg-blue-100/80 border-blue-200 text-blue-950',
    badge: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    role: 'Team Lead',
    name: 'Kaushik Hazarika',
    email: 'kaushik.lead@assamtech.in',
    password: 'password123',
    desc: 'Reports to Gitashree; supervises Ananya & Debabrata',
    color: 'bg-sky-50 hover:bg-sky-100/80 border-sky-200 text-sky-950',
    badge: 'bg-sky-100 text-sky-800 border-sky-200'
  },
  {
    role: 'Employee',
    name: 'Ananya Phukan',
    email: 'ananya.dev@assamtech.in',
    password: 'password123',
    desc: 'Senior Developer: clock in/out, view personal attendance',
    color: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-950',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }
];

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Branding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center shadow-sm text-white mb-2.5">
            <Clock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Attendance Portal</h1>
          <p className="text-xs text-slate-500 mt-1">
            Hierarchical Attendance System &bull; College Project (Assam)
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@assamtech.in"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 text-xs bg-rose-50 border border-rose-200 text-rose-600 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Quick Demo Accounts (Click to Fill)
            </p>
            <div className="space-y-2">
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleQuickLogin(demo)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${demo.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">{demo.name}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${demo.badge}`}>{demo.role}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">{demo.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Computer Science Student Project &bull; Assam, India
        </p>
      </div>
    </div>
  );
};

export default Login;
