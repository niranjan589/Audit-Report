// Minimal Express API scaffold with placeholder in-memory store
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectIfConfigured } = require('./db/connection');

const auditsRouter = require('./routes/audits');
const healthRouter = require('./routes/health');
const providersDemoRouter = require('./routes/providers-demo');

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB if MONGO_URI is provided (non-blocking for local dev)
connectIfConfigured();

app.get('/', (req, res) => res.json({ ok: true, service: 'api', version: '0.1.0' }));
app.use('/api/audits', auditsRouter);
app.use('/api/providers/health', healthRouter);
app.use('/api/providers-demo', providersDemoRouter);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});