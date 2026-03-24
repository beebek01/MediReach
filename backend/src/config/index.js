require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  serverUrl: process.env.SERVER_URL || `http://localhost:${parseInt(process.env.PORT, 10) || 4000}`,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'medireach',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  passwordReset: {
    secret: process.env.PASSWORD_RESET_SECRET,
    expiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '1h',
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM || 'MediReach <noreply@medireach.com>',
  },

  // ── eSewa ────────────────────────────────────────────────────────────
  esewa: {
    mock: process.env.ESEWA_MOCK === 'true',
    productCode: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
    successPath: process.env.ESEWA_SUCCESS_PATH || '/api/payments/esewa/success',
    failurePath: process.env.ESEWA_FAILURE_PATH || '/api/payments/esewa/failure',
    secretKey: process.env.ESEWA_SECRET_KEY || '8g7h39H6Bh7973GF',
    initiateUrl: process.env.ESEWA_INITIATE_URL || 'https://uat.esewa.com.np/epay/main',
    verifyUrl: process.env.ESEWA_VERIFY_URL || 'https://uat.esewa.com.np/api/epay/transaction/status/',
  },

  // ── Google OAuth 2.0 ──────────────────────────────────────────────
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },

  // ── Apple Sign-In ─────────────────────────────────────────────────
  apple: {
    clientId: process.env.APPLE_CLIENT_ID || '',
    teamId: process.env.APPLE_TEAM_ID || '',
    keyId: process.env.APPLE_KEY_ID || '',
    privateKey: (process.env.APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },

  // ── Google Gemini AI (MediBot) ────────────────────────────────────
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};
