const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  const keys = {
    MONGO_URI: !!process.env.MONGO_URI,
    REDIS_URL: !!process.env.REDIS_URL,
    OPEN_PAGERANK_API_KEY: !!process.env.OPEN_PAGERANK_API_KEY,
    SERPAPI_KEY: !!process.env.SERPAPI_KEY,
    PAGESPEED_API_KEY: !!process.env.PAGESPEED_API_KEY,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    MICROSOFT_CLIENT_ID: !!process.env.MICROSOFT_CLIENT_ID,
  };
  res.json({ ok: true, providersConfigured: keys });
});

module.exports = router;