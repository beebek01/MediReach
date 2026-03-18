import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import logo from "../../assets/images/logo2.png";

/* ── SVG Icons ─────────────────────────────────────────────────── */
const MailIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-primary"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
      addToast("Reset code sent to your email!");
      // Navigate to reset page with email pre-filled
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 2000);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      addToast(err.message || "Failed to send reset code", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-charcoal text-cream flex-col justify-between p-10">
        <Link to="/" className="inline-block">
          <img
            src={logo}
            alt="MediReach Logo"
            className="h-12 w-auto bg-white p-2 rounded-2xl shadow-sm"
          />
        </Link>
        <div>
          <p className="font-fraunces text-3xl font-semibold leading-snug">
            Forgot your password?
            <br />
            No worries.
          </p>
          <p className="mt-3 text-cream/70 leading-relaxed">
            We'll send a 6-digit code to your email so you can reset your
            password quickly and securely.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-cream/60">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-primary" />
            Secure reset
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-primary" />
            Code expires in 1 hour
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-primary" />
            Check spam folder
          </span>
        </div>
      </div>

      {/* ── Right Panel (form) ─────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-10 lg:p-16 bg-cream">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden mb-6 inline-block">
            <img
              src={logo}
              alt="MediReach Logo"
              className="h-10 w-auto bg-white p-2 rounded-2xl shadow-sm"
            />
          </Link>

          {!sent ? (
            <>
              <div className="mb-6">
                <div className="mb-4">
                  <MailIcon />
                </div>
                <h1 className="font-fraunces text-2xl font-bold text-charcoal">
                  Reset your password
                </h1>
                <p className="mt-1 text-sm text-charcoal/60">
                  Enter your email address and we'll send you a 6-digit code to
                  reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-lg border border-charcoal/20 bg-white px-4 py-2.5 text-charcoal placeholder-charcoal/40 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors disabled:opacity-50"
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-soft-red/5 border border-soft-red/20 px-3 py-2.5">
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
                    <p className="text-sm text-soft-red">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-primary py-2.5 font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && (
                    <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {loading ? "Sending code…" : "Send reset code"}
                </button>
              </form>
            </>
          ) : (
            /* ── Success State ────────────────────────────────────── */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="font-fraunces text-2xl font-bold text-charcoal">
                Code sent!
              </h2>
              <p className="mt-2 text-sm text-charcoal/60">
                We've sent a 6-digit reset code to{" "}
                <strong className="text-charcoal">{email}</strong>.
                <br />
                Redirecting you to enter the code…
              </p>
              <div className="mt-4">
                <span className="inline-block h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-charcoal transition-colors"
            >
              <ArrowLeftIcon />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
