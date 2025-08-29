const axios = require('axios');
const BASE_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

async function fetchPageSpeed(url, strategy = 'mobile') {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!url) throw new Error('url required');
  const params = { url, strategy };
  if (apiKey) params.key = apiKey;
  try {
    // Increase timeout: some sites are heavy and lighthouse can take longer
    const { data } = await axios.get(BASE_URL, { params, timeout: 30000 });
    const lighthouse = data?.lighthouseResult || {};
    const categories = lighthouse?.categories || {};
    const perfScore = categories.performance?.score ?? null; // 0..1
    const metrics = lighthouse?.audits || {};
    return {
      ok: true,
      raw: data,
      normalized: {
        performance: perfScore !== null ? Math.round(perfScore * 100) : null,
        fcpMs: metrics['first-contentful-paint']?.numericValue ?? null,
        lcpMs: metrics['largest-contentful-paint']?.numericValue ?? null,
        tbtMs: metrics['total-blocking-time']?.numericValue ?? null,
        cls: metrics['cumulative-layout-shift']?.numericValue ?? null,
      },
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { fetchPageSpeed };