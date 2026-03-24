import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import logo from '../../assets/images/logo.png';
import authVideo from '../../assets/videos/new-video.mp4';

const ROLES = { CUSTOMER: 'customer', PHARMACIST: 'pharmacist', ADMIN: 'admin' };

/* ── SVG Icons ─────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.11 4.45-3.74 4.25z" />
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ── Google Client ID (mirrors backend config) ─────────────────── */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || '';

/* Hide OAuth when credentials are missing or still placeholders */
const isOAuthConfigured =
  (GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('_here')) ||
  (APPLE_CLIENT_ID && !APPLE_CLIENT_ID.includes('_here'));

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState('');
  const { login, loginWithGoogle, loginWithApple } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const googleBtnRef = useRef(null);

  const redirectAfterAuth = useCallback(
    (userRole) => {
      const from = location.state?.from?.pathname;
      const base =
        userRole === ROLES.CUSTOMER
          ? '/customer'
          : userRole === ROLES.PHARMACIST
          ? '/pharmacist'
          : '/admin';
      if (from && (from.startsWith('/customer') || from.startsWith('/pharmacist') || from.startsWith('/admin'))) {
        navigate(from, { replace: true });
      } else {
        navigate(base, { replace: true });
      }
    },
    [location, navigate]
  );

  /* ── Google Identity Services ─────────────────────────────────── */
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        setError('');
        setOauthLoading('google');
        const result = await loginWithGoogle(response.credential);
        setOauthLoading('');
        if (result.success) {
          addToast('Signed in with Google successfully');
          redirectAfterAuth(result.user.role);
        } else {
          setError(result.error || 'Google sign-in failed');
          addToast(result.error || 'Google sign-in failed', 'error');
        }
      },
    });

    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        size: 'large',
        width: googleBtnRef.current.offsetWidth,
        text: 'continue_with',
        logo_alignment: 'center',
      });
    }
  }, [loginWithGoogle, redirectAfterAuth]);

  /* ── Apple Sign-In ─────────────────────────────────────────────── */
  const handleAppleSignIn = async () => {
    setError('');
    setOauthLoading('apple');
    try {
      if (!window.AppleID) {
        throw new Error('Apple Sign-In is not available');
      }
      window.AppleID.auth.init({
        clientId: import.meta.env.VITE_APPLE_CLIENT_ID || '',
        scope: 'name email',
        redirectURI: window.location.origin + '/login',
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      const result = await loginWithApple({
        idToken: response.authorization.id_token,
        authorizationCode: response.authorization.code,
        fullName: response.user
          ? { givenName: response.user.name?.firstName, familyName: response.user.name?.lastName }
          : undefined,
      });
      if (result.success) {
        addToast('Signed in with Apple successfully');
        redirectAfterAuth(result.user.role);
      } else {
        setError(result.error || 'Apple sign-in failed');
        addToast(result.error || 'Apple sign-in failed', 'error');
      }
    } catch (err) {
      if (err?.error !== 'popup_closed_by_user') {
        setError(err.message || 'Apple sign-in failed');
        addToast(err.message || 'Apple sign-in failed', 'error');
      }
    } finally {
      setOauthLoading('');
    }
  };

  /* ── Email/Password Login ──────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        addToast('Login successful! Welcome back.');
        redirectAfterAuth(result.user.role);
      } else {
        setError(result.error || 'Login failed');
        addToast(result.error || 'Login failed', 'error');
      }
    } catch {
      setError('Something went wrong. Please try again.');
      addToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !!oauthLoading;

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-charcoal text-cream flex-col justify-between p-12 relative overflow-hidden">
        {/* Full screen background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
        >
          <source src={authVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent z-0"></div>

        <Link to="/" className="inline-block relative z-10 -mt-2">
          <img src={logo} alt="MediReach Logo" className="h-16 md:h-20 w-auto" />
        </Link>
        <div className="relative z-10 mb-10 flex-1 flex flex-col justify-end">
          <p className="font-fraunces text-4xl font-bold leading-tight drop-shadow-lg">
            Your trusted pharmacy,
            <br />
            one click away.
          </p>
          <p className="mt-4 text-cream/90 text-lg leading-relaxed max-w-md font-light drop-shadow-md">
            Sign in to order medicines, track deliveries, and manage prescriptions — all from one beautifully designed dashboard.
          </p>
        </div>
        <div className="flex gap-8 text-sm text-cream/90 relative z-10 font-medium pt-4 border-t border-white/10">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-primary shadow-sm" />
            Verified medicines
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-primary shadow-sm" />
            Secure payments
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-primary shadow-sm" />
            Fast delivery
          </span>
        </div>
      </div>

      {/* ── Right Panel (form) ─────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-4 sm:p-8 lg:p-12 bg-gradient-to-br from-cream to-white relative overflow-hidden">
        {/* Soft decorative background blurs for the light side */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-secondary/10 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-pulse-slow pointer-events-none" style={{ animationDelay: "2s" }} />

        <div className="max-w-md w-full mx-auto relative z-10 bg-white/70 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-white rounded-[2rem] p-8 sm:p-10 transition-all duration-500 hover:shadow-[0_8px_50px_rgba(0,0,0,0.06)]">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden mb-6 -mt-1 flex justify-center w-full">
            <img src={logo} alt="MediReach Logo" className="h-12 sm:h-14 w-auto" />
          </Link>

          <div className="text-center lg:text-left mb-6">
            <h1 className="font-fraunces text-3xl font-bold text-charcoal tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-charcoal/60">Sign in to continue to MediReach</p>
          </div>

          {/* ── OAuth Buttons (only if credentials configured) ───── */}
          {isOAuthConfigured && (
            <>
              <div className="space-y-3">
                {/* Google - rendered by GIS SDK or fallback button */}
                {GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('_here') ? (
                  <div ref={googleBtnRef} className="w-full min-h-[44px]" />
                ) : null}

                {/* Apple */}
                {APPLE_CLIENT_ID && !APPLE_CLIENT_ID.includes('_here') && (
                  <button
                    type="button"
                    onClick={handleAppleSignIn}
                    disabled={isDisabled}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-charcoal/10 bg-white/50 backdrop-blur-sm py-3 px-4 text-sm font-medium text-charcoal hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
                  >
                    {oauthLoading === 'apple' ? (
                      <span className="inline-block h-5 w-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" />
                    ) : (
                      <AppleIcon />
                    )}
                    Continue with Apple
                  </button>
                )}
              </div>

              {/* ── Divider ──────────────────────────────────────────── */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-charcoal/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-cream px-4 text-xs text-charcoal/40 uppercase tracking-wider">
                    or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ── Email / Password Form ──────────────────────────────── */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5 pl-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isDisabled}
                className="w-full rounded-xl border border-charcoal/10 bg-white/70 px-4 py-3 text-charcoal placeholder-charcoal/40 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300 disabled:opacity-50 shadow-inner"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5 pl-1 pr-1">
                <label className="text-sm font-medium text-charcoal">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary hover:text-primary-dark hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isDisabled}
                  className="w-full rounded-xl border border-charcoal/10 bg-white/70 px-4 py-3 pr-11 text-charcoal placeholder-charcoal/40 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300 disabled:opacity-50 shadow-inner"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/70 transition-colors bg-transparent border-none p-1"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-soft-red/5 border border-soft-red/20 px-3 py-2.5 mt-2">
                <svg className="w-4 h-4 text-soft-red mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-soft-red">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isDisabled}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary py-3 font-medium text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading && (
                <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-charcoal/60">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
