const mongoose = require('mongoose');

async function connectIfConfigured() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log('[api] MONGO_URI not set; skipping DB connection');
    return;
  }
  try {
    await mongoose.connect(uri, { autoIndex: true });
    console.log('[api] Connected to MongoDB');
  } catch (err) {
    console.error('[api] MongoDB connection error:', err.message);
  }
}

module.exports = { connectIfConfigured };