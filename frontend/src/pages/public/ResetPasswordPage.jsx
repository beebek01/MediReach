import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import logo from '../../assets/images/logo.png';

/* ── SVG Icons ─────────────────────────────────────────────────── */
const ShieldIcon = () => (
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
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
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

const CODE_LENGTH = 6;

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Step 1: verify code, Step 2: enter new password
  const [step, setStep] = useState(1);

  // Email from the forgot-password page or entered manually
  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus first code input
  useEffect(() => {
    if (step === 1 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  /* ── OTP Input Handlers ────────────────────────────────────── */
  const handleCodeChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    // Backspace: clear current or go to previous
    if (e.key === "Backspace") {
      if (code[index]) {
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newCode = [...code];
        newCode[index - 1] = "";
        setCode(newCode);
      }
      e.preventDefault();
    }
    // Arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    if (!pasted) return;

    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);

    // Focus the next empty field or the last one
    const nextEmpty = newCode.findIndex((c) => !c);
    const focusIndex = nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();
  };

  /* ── Step 1: Verify Code ───────────────────────────────────── */
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");

    const codeString = code.join("");
    if (codeString.length !== CODE_LENGTH) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    try {
      await api.verifyResetCode(email, codeString);
      addToast("Code verified! Set your new password.");
      setStep(2);
    } catch (err) {
      setError(err.message || "Invalid or expired code. Please try again.");
      addToast(err.message || "Invalid or expired code", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Reset Password ────────────────────────────────── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const codeString = code.join("");
    setLoading(true);
    try {
      await api.resetPassword(email, codeString, newPassword);
      setSuccess(true);
      addToast("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
      addToast(err.message || "Failed to reset password", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend Code ───────────────────────────────────────────── */
  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    try {
      await api.forgotPassword(email);
      setCode(Array(CODE_LENGTH).fill(""));
      setResendCooldown(60);
      setError("");
      addToast("New code sent to your email!");
      inputRefs.current[0]?.focus();
    } catch {
      setError("Failed to resend code. Please try again.");
      addToast("Failed to resend code", "error");
    }
  };

  /* ── Password validation requirements ──────────────────────── */
  const pwRequirements = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "Lowercase letter", met: /[a-z]/.test(newPassword) },
    { label: "Number", met: /\d/.test(newPassword) },
    {
      label: "Special character (@$!%*?&#)",
      met: /[@$!%*?&#]/.test(newPassword),
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-charcoal text-cream flex-col justify-between p-10">
        <Link to="/" className="inline-block">
          <img src={logo} alt="MediReach Logo" className="h-12 w-auto" />
        </Link>
        <div>
          <p className="font-fraunces text-3xl font-semibold leading-snug">
            {step === 1 ? "Enter your reset code" : "Choose a new password"}
          </p>
          <p className="mt-3 text-cream/70 leading-relaxed">
            {step === 1
              ? "We sent a 6-digit code to your email. Enter it below to verify your identity."
              : "Create a strong password to keep your account secure."}
          </p>
        </div>
        <div className="flex gap-6 text-sm text-cream/60">
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-cream/30"}`}
            />
            Enter code
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-cream/30"}`}
            />
            New password
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${success ? "bg-primary" : "bg-cream/30"}`}
            />
            Done
          </span>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-10 lg:p-16 bg-cream">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile logo */}
          <Link
            to="/"
            className="lg:hidden mb-6 inline-block"
          >
            <img src={logo} alt="MediReach Logo" className="h-10 w-auto" />
          </Link>

          {success ? (
            /* ── Success ──────────────────────────────────────────── */
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
                Password reset!
              </h2>
              <p className="mt-2 text-sm text-charcoal/60">
                Your password has been reset successfully.
                <br />
                Redirecting you to sign in…
              </p>
              <div className="mt-4">
                <span className="inline-block h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            </div>
          ) : step === 1 ? (
            /* ── Step 1: Enter Code ───────────────────────────────── */
            <>
              <div className="mb-6">
                <div className="mb-4">
                  <ShieldIcon />
                </div>
                <h1 className="font-fraunces text-2xl font-bold text-charcoal">
                  Enter verification code
                </h1>
                <p className="mt-1 text-sm text-charcoal/60">
                  We sent a 6-digit code to{" "}
                  <strong className="text-charcoal">
                    {email || "your email"}
                  </strong>
                  . Enter it below.
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-5">
                {/* Email field - shown if not pre-filled */}
                {!location.state?.email && (
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
                    />
                  </div>
                )}

                {/* OTP Code Inputs */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Verification code
                  </label>
                  <div
                    className="flex gap-2 justify-center"
                    onPaste={handleCodePaste}
                  >
                    {code.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(idx, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                        disabled={loading}
                        className="w-12 h-14 rounded-lg border-2 border-charcoal/20 bg-white text-center text-xl font-bold text-charcoal
                                   focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                      />
                    ))}
                  </div>
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
                  disabled={loading || code.join("").length !== CODE_LENGTH}
                  className="w-full rounded-lg bg-primary py-2.5 font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && (
                    <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {loading ? "Verifying…" : "Verify code"}
                </button>

                {/* Resend */}
                <div className="text-center text-sm text-charcoal/60">
                  Didn't receive the code?{" "}
                  {resendCooldown > 0 ? (
                    <span className="text-charcoal/40">
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-primary font-medium hover:underline"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </form>
            </>
          ) : (
            /* ── Step 2: New Password ─────────────────────────────── */
            <>
              <div className="mb-6">
                <div className="mb-4">
                  <ShieldIcon />
                </div>
                <h1 className="font-fraunces text-2xl font-bold text-charcoal">
                  Set new password
                </h1>
                <p className="mt-1 text-sm text-charcoal/60">
                  Choose a strong new password for your account.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full rounded-lg border border-charcoal/20 bg-white px-4 py-2.5 pr-11 text-charcoal placeholder-charcoal/40 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors disabled:opacity-50"
                      placeholder="Create a strong password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/70 transition-colors"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {/* Password requirements */}
                {newPassword && (
                  <div className="rounded-lg bg-charcoal/[0.03] border border-charcoal/10 px-3 py-2.5">
                    <p className="text-xs font-medium text-charcoal/50 mb-1.5">
                      Password requirements
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {pwRequirements.map((req) => (
                        <span
                          key={req.label}
                          className={`text-xs flex items-center gap-1.5 ${req.met ? "text-green-600" : "text-charcoal/40"}`}
                        >
                          {req.met ? (
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          {req.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Confirm new password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-lg border border-charcoal/20 bg-white px-4 py-2.5 text-charcoal placeholder-charcoal/40 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors disabled:opacity-50"
                    placeholder="Confirm your password"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-soft-red mt-1">
                      Passwords do not match
                    </p>
                  )}
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
                  disabled={
                    loading ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                  className="w-full rounded-lg bg-primary py-2.5 font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && (
                    <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {loading ? "Resetting password…" : "Reset password"}
                </button>
              </form>
            </>
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
