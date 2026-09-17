import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  HeartHandshake,
  Mail,
  Lock,
  User,
  Shield,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const LoginScreen: React.FC = () => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('parent');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email.trim(), password);
      } else {
        if (!displayName.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }
        await signUpWithEmail(
          email.trim(),
          password,
          displayName.trim(),
          selectedRole,
          'family-routine-home'
        );
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle(selectedRole);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err.message || 'Google sign-in was interrupted. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (targetRole: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      const demoEmail = targetRole === 'child' ? 'child@family.app' : 'parent@family.app';
      const demoPassword = 'Password123!';
      const demoName = targetRole === 'child' ? 'Child' : 'Parent';

      try {
        await signInWithEmail(demoEmail, demoPassword);
      } catch {
        await signUpWithEmail(demoEmail, demoPassword, demoName, targetRole, 'family-routine-home');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9f6] flex flex-col items-center justify-center p-4 sm:p-6 text-[#27382b]">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Emblem */}
        <div className="w-12 h-12 rounded-2xl bg-[#eef5eb] border border-[#d6e5d2] text-emerald-900 flex items-center justify-center shadow-xs mb-4">
          <HeartHandshake className="w-6 h-6" />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Family Routine
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1.5 leading-relaxed">
            Please sign in to access your daily schedule, tasks, and routines.
          </p>
        </div>

        {/* Minimalist Card */}
        <div className="w-full bg-white rounded-3xl p-6 shadow-xs border border-[#e2ece0] flex flex-col gap-4">
          {/* Google Sign In Button */}
          <button
            type="button"
            id="login-google-btn"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs sm:text-sm font-semibold rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-2xs active:scale-[0.99] disabled:opacity-50"
          >
            <GoogleIcon className="w-4 h-4" />
            <span>Continue with Google</span>
          </button>

          {/* Subtle Divider */}
          <div className="flex items-center gap-2.5">
            <div className="h-px bg-stone-100 flex-1" />
            <span className="text-[11px] text-stone-400 font-medium uppercase tracking-wider">
              or with email
            </span>
            <div className="h-px bg-stone-100 flex-1" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <>
                {/* Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-stone-600">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah or Alex"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 bg-[#fbfdfb] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-800 focus:border-emerald-800 transition-all"
                    />
                  </div>
                </div>

                {/* Role Choice */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-stone-600">
                    Your Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('parent')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        selectedRole === 'parent'
                          ? 'bg-[#edf5ea] border-emerald-800 text-emerald-950 ring-1 ring-emerald-800/30'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 text-emerald-800" />
                      <span>Parent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('child')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        selectedRole === 'child'
                          ? 'bg-[#edf5ea] border-emerald-800 text-emerald-950 ring-1 ring-emerald-800/30'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
                      <span>Child</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-stone-600">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 bg-[#fbfdfb] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-800 focus:border-emerald-800 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-stone-600">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 bg-[#fbfdfb] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-800 focus:border-emerald-800 transition-all"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="w-full mt-1 py-2.5 px-4 bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              {!loading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="pt-2 border-t border-stone-100 text-center">
            {mode === 'signin' ? (
              <p className="text-xs text-stone-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  id="switch-to-signup-btn"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="text-emerald-900 font-semibold hover:underline"
                >
                  Create one
                </button>
              </p>
            ) : (
              <p className="text-xs text-stone-500">
                Already have an account?{' '}
                <button
                  type="button"
                  id="switch-to-signin-btn"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="text-emerald-900 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Quick Testing Links */}
        <div className="mt-4 flex items-center gap-3 text-xs text-stone-400">
          <span>Quick Demo:</span>
          <button
            type="button"
            onClick={() => handleQuickDemo('parent')}
            className="hover:text-emerald-900 underline font-medium"
          >
            Parent View
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleQuickDemo('child')}
            className="hover:text-emerald-900 underline font-medium"
          >
            Child View
          </button>
        </div>
      </div>
    </div>
  );
};
