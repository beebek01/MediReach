import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from '../../context/ToastContext';
import ProgressBar from "../../components/ui/ProgressBar";
import logo from '../../assets/images/logo.png';
import authVideo from '../../assets/videos/new-video.mp4';

const STEPS = [
  { id: 1, title: "Personal Info", fields: ["name", "email", "password"] },
  { id: 2, title: "Contact Details", fields: ["phone", "address"] },
  { id: 3, title: "Verification", fields: [] },
];

/* ── SVG Icons ─────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.11 4.45-3.74 4.25z" />
  </svg>
);

const EyeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || "";

/* Hide OAuth when credentials are missing or still placeholders */
const isOAuthConfigured =
  (GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes("_here")) ||
  (APPLE_CLIENT_ID && !APPLE_CLIENT_ID.includes("_here"));

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState("");
  const { register, loginWithGoogle, loginWithApple } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  const redirectAfterAuth = useCallback(
    (userRole) => {
      const base =
        userRole === "pharmacist"
          ? "/pharmacist"
          : userRole === "admin"
            ? "/admin"
            : "/customer";
      navigate(base, { replace: true });
    },
    [navigate],
  );

  /* ── Google Identity Services ─────────────────────────────────── */
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        setErrors({});
        setOauthLoading("google");
        const result = await loginWithGoogle(response.credential);
        setOauthLoading("");
        if (result.success) {
          addToast('Signed up with Google successfully');
          redirectAfterAuth(result.user.role);
        } else {
          setErrors({ submit: result.error || 'Google sign-up failed' });
          addToast(result.error || 'Google sign-up failed', 'error');
        }
      },
    });

    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        shape: "rectangular",
        theme: "outline",
        size: "large",
        width: googleBtnRef.current.offsetWidth,
        text: "signup_with",
        logo_alignment: "center",
      });
    }
  }, [loginWithGoogle, redirectAfterAuth]);

  /* ── Apple Sign-In ─────────────────────────────────────────────── */
  const handleAppleSignIn = async () => {
    setErrors({});
    setOauthLoading("apple");
    try {
      if (!window.AppleID) throw new Error("Apple Sign-In is not available");
      window.AppleID.auth.init({
        clientId: import.meta.env.VITE_APPLE_CLIENT_ID || "",
        scope: "name email",
        redirectURI: window.location.origin + "/register",
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      const result = await loginWithApple({
        idToken: response.authorization.id_token,
        authorizationCode: response.authorization.code,
        fullName: response.user
          ? {
              givenName: response.user.name?.firstName,
              familyName: response.user.name?.lastName,
            }
          : undefined,
      });
      if (result.success) {
        addToast('Signed up with Apple successfully');
        redirectAfterAuth(result.user.role);
      } else {
        setErrors({ submit: result.error || 'Apple sign-up failed' });
        addToast(result.error || 'Apple sign-up failed', 'error');
      }
    } catch (err) {
      if (err?.error !== 'popup_closed_by_user') {
        setErrors({ submit: err.message || 'Apple sign-up failed' });
        addToast(err.message || 'Apple sign-up failed', 'error');
      }
    } finally {
      setOauthLoading("");
    }
  };

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.name.trim()) e.name = "Name is required";
      if (!form.email.trim()) e.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        e.email = "Invalid email";
      if (!form.password) e.password = "Password is required";
      else if (form.password.length < 8) e.password = "At least 8 characters";
    }
    if (step === 2) {
      if (!form.phone.trim()) e.phone = "Phone is required";
      if (!form.address.trim()) e.address = "Address is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = async () => {
    if (!validate()) return;
    if (step < 3) setStep(step + 1);
    else {
      setLoading(true);
      try {
        const result = await register(form);
        if (result.success) {
          addToast('Account created successfully! Welcome to MediReach.');
          navigate('/customer');
        } else {
          setErrors({ submit: result.error });
          addToast(result.error || 'Registration failed', 'error');
        }
      } catch {
        setErrors({ submit: 'Registration failed. Please try again.' });
        addToast('Registration failed. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const prev = () => setStep(Math.max(1, step - 1));

  const isDisabled = loading || !!oauthLoading;

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ──────────────────────────────────────────── */}
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
        <div className="relative z-10 flex-1 flex flex-col justify-end pb-12">
          <p className="font-fraunces text-4xl font-bold leading-tight drop-shadow-lg">
            Create your account
          </p>
          <p className="mt-4 text-cream/90 text-lg leading-relaxed font-light drop-shadow-md">
            Join Nepal's trusted online pharmacy.
          </p>

          <div className="mt-8 space-y-4">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-3 transition-opacity ${step >= s.id ? "opacity-100" : "opacity-50"}`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    step > s.id
                      ? "border-primary bg-primary text-white"
                      : step === s.id
                        ? "border-primary bg-primary/40 text-white backdrop-blur-sm"
                        : "border-cream/50 bg-black/20 backdrop-blur-sm"
                  }`}
                >
                  {step > s.id ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    s.id
                  )}
                </div>
                <span className="font-medium drop-shadow-md">{s.title}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-8 text-sm text-cream/90 relative z-10 font-medium pt-4 border-t border-white/10">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-primary shadow-sm" />
            Free account
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-primary shadow-sm" />
            No credit card required
          </span>
        </div>
      </div>

      {/* ── Right Panel (form) ─────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-4 sm:p-8 lg:p-12 bg-gradient-to-br from-cream to-white relative overflow-hidden">
        {/* Soft decorative background blurs for the light side */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-secondary/10 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-pulse-slow pointer-events-none" style={{ animationDelay: "2s" }} />

        <div className="max-w-xl w-full mx-auto relative z-10 bg-white/70 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-white rounded-[2rem] p-8 sm:p-10 transition-all duration-500 hover:shadow-[0_8px_50px_rgba(0,0,0,0.06)]">
          {/* Mobile logo */}
          <Link
            to="/"
            className="lg:hidden mb-6 -mt-1 flex justify-center w-full"
          >
            <img src={logo} alt="MediReach Logo" className="h-12 sm:h-14 w-auto" />
          </Link>

          <div className="text-center lg:text-left mb-6">
            <h1 className="font-fraunces text-3xl font-bold text-charcoal tracking-tight">
              Register
            </h1>
            <p className="mt-2 text-sm text-charcoal/60">
              Create your MediReach account
            </p>
          </div>

          {/* ── OAuth (only on step 1 & credentials configured) ──── */}
          {step === 1 && isOAuthConfigured && (
            <>
              <div className="space-y-3">
                {GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes("_here") ? (
                  <div ref={googleBtnRef} className="w-full min-h-[44px]" />
                ) : null}

                {APPLE_CLIENT_ID && !APPLE_CLIENT_ID.includes("_here") && (
                  <button
                    type="button"
                    onClick={handleAppleSignIn}
                    disabled={isDisabled}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-charcoal/10 bg-white/50 backdrop-blur-sm py-3 px-4 text-sm font-medium text-charcoal hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
                  >
                    {oauthLoading === "apple" ? (
                      <span className="inline-block h-5 w-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" />
                    ) : (
                      <AppleIcon />
                    )}
                    Sign up with Apple
                  </button>
                )}
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-charcoal/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-cream px-4 text-xs text-charcoal/40 uppercase tracking-wider">
                    or register with email
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Progress bar (visible on all steps) */}
          <ProgressBar
            value={step}
            max={3}
            showLabel={false}
            className={step === 1 ? "" : "mt-4"}
          />

          {/* ── Step 1: Personal Info ──────────────────────────── */}
          {step === 1 && (
            <div className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-charcoal mb-1.5 pl-1">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    disabled={isDisabled}
                    className="w-full rounded-xl border border-charcoal/10 bg-white/70 px-4 py-3 text-charcoal placeholder-charcoal/40 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300 disabled:opacity-50 shadow-inner"
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="text-sm text-soft-red mt-1 pl-1">{errors.name}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-charcoal mb-1.5 pl-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    disabled={isDisabled}
                    className="w-full rounded-xl border border-charcoal/10 bg-white/70 px-4 py-3 text-charcoal placeholder-charcoal/40 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300 disabled:opacity-50 shadow-inner"
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-soft-red mt-1 pl-1">{errors.email}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-charcoal mb-1.5 pl-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, password: e.target.value }))
                      }
                      disabled={isDisabled}
                      className="w-full rounded-xl border border-charcoal/10 bg-white/70 px-4 py-3 pr-11 text-charcoal placeholder-charcoal/40 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300 disabled:opacity-50 shadow-inner"
                      placeholder="Min. 8 characters"
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
                  {errors.password && (
                    <p className="text-sm text-soft-red mt-1 pl-1">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Contact Details ───────────────────────── */}
          {step === 2 && (
            <div className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5 pl-1">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/50 font-medium">+977</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    disabled={isDisabled}
                    className="w-full rounded-xl border border-charcoal/10 bg-white/70 pl-16 pr-4 py-3 text-charcoal placeholder-charcoal/40 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300 disabled:opacity-50 shadow-inner"
                    placeholder="98xxxxxxxx"
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-soft-red mt-1 pl-1">{errors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5 pl-1">
                  Delivery Address
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  rows={3}
                  disabled={isDisabled}
                  className="w-full rounded-xl border border-charcoal/10 bg-white/70 px-4 py-3 text-charcoal placeholder-charcoal/40 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all duration-300 disabled:opacity-50 shadow-inner"
                  placeholder="Street, City, District"
                />
                {errors.address && (
                  <p className="text-sm text-soft-red mt-1 pl-1">{errors.address}</p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Review ────────────────────────────────── */}
          {step === 3 && (
            <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="font-fraunces font-medium text-charcoal">
                Review your details
              </p>
              <div className="mt-3 space-y-1.5 text-sm text-charcoal/70">
                <p>
                  <span className="font-medium text-charcoal">Name:</span>{" "}
                  {form.name}
                </p>
                <p>
                  <span className="font-medium text-charcoal">Email:</span>{" "}
                  {form.email}
                </p>
                <p>
                  <span className="font-medium text-charcoal">Phone:</span>{" "}
                  {form.phone}
                </p>
                <p>
                  <span className="font-medium text-charcoal">Address:</span>{" "}
                  {form.address}
                </p>
              </div>
              <p className="text-sm text-charcoal/60 mt-3">
                Click "Create account" to complete registration.
              </p>
            </div>
          )}

          {/* Submit error */}
          {errors.submit && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-soft-red/5 border border-soft-red/20 px-3 py-2.5">
              <svg
                className="w-4 h-4 text-soft-red mt-0.5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-soft-red">{errors.submit}</p>
            </div>
          )}

          {/* ── Navigation Buttons ────────────────────────────── */}
          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={prev}
                disabled={isDisabled}
                className="rounded-xl border border-charcoal/20 px-6 py-3 font-medium text-charcoal hover:bg-charcoal/5 transition-colors disabled:opacity-50"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              disabled={isDisabled}
              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 font-medium text-white shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {step < 3
                ? "Continue"
                : loading
                  ? "Creating account…"
                  : "Create account"}
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-charcoal/60">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
