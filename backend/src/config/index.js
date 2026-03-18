require("dotenv").config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",

  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || "MediReach",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  passwordReset: {
    secret: process.env.PASSWORD_RESET_SECRET,
    expiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || "1h",
  },

  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM || "MediReach <noreply@medireach.com>",
  },

  // ── IME Pay ───────────────────────────────────────────────────────────
  imepay: {
    merchantId: process.env.IMEPAY_MERCHANT_ID || "TEST_MERCHANT",
    secret: process.env.IMEPAY_SECRET || "test_secret",
    paymentUrl:
      process.env.IMEPAY_PAYMENT_URL ||
      "https://payment.imepay.com.np/web/payment",
  },

  // ── Google OAuth 2.0 ──────────────────────────────────────────────
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  },

  // ── Apple Sign-In ─────────────────────────────────────────────────
  apple: {
    clientId: process.env.APPLE_CLIENT_ID || "",
    teamId: process.env.APPLE_TEAM_ID || "",
    keyId: process.env.APPLE_KEY_ID || "",
    privateKey: (process.env.APPLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  },

  // ── Google Gemini AI (MediBot) ────────────────────────────────────
  geminiApiKey: process.env.GEMINI_API_KEY || "",
};
