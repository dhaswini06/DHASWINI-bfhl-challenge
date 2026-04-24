'use strict';

const express = require('express');
const cors = require('cors');
const { processData } = require('./graph');

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));

// ── Identity — fill in your details ────────────────────────────────────────
const IDENTITY = {
  userId: process.env.USER_ID || 'johndoe_17091999',
  emailId: process.env.EMAIL_ID || 'john.doe@college.edu',
  rollNumber: process.env.ROLL_NUMBER || '21CS1001'
};

// ── Routes ──────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.post('/bfhl', (req, res) => {
  const { data } = req.body || {};

  if (!Array.isArray(data)) {
    return res.status(400).json({
      error: 'Request body must be { "data": [...] } where data is an array of strings.'
    });
  }

  // Coerce all items to strings (defensive)
  const input = data.map(item => String(item ?? ''));

  try {
    const result = processData(input, IDENTITY);
    return res.json(result);
  } catch (err) {
    console.error('[/bfhl] processing error:', err);
    return res.status(500).json({ error: 'Internal server error during processing.' });
  }
});

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found. Only POST /bfhl is available.' });
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[bfhl] server listening on http://localhost:${PORT}`);
});

module.exports = app; // for testing