const mongoose = require('mongoose');

async function connectIfConfigured() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log('[worker] MONGO_URI not set; skipping DB connection');
    return false;
  }
  try {
    await mongoose.connect(uri, { autoIndex: true });
    console.log('[worker] Connected to MongoDB');
    return true;
  } catch (err) {
    console.error('[worker] MongoDB connection error:', err.message);
    return false;
  }
}

module.exports = { connectIfConfigured };