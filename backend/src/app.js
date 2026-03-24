const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsers ─────────────────────────────────────────────────────────────
// Chat endpoint needs larger limit for base64 audio/images — must come BEFORE the global parser
app.use('/api/chat', express.json({ limit: '5mb' }));
app.use(express.json({ limit: '10kb' }));        // small payloads only (prevents DoS)
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Serve uploaded files ─────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Global rate limiter ──────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
