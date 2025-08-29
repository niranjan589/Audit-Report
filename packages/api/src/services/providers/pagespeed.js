// Google PageSpeed Insights client (placeholder)
// Docs: https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed
const axios = require('axios');

const BASE_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

async function fetchPageSpeed(url, strategy = 'mobile') {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!url) throw new Error('url required');
  const params = { url, strategy };
  if (apiKey) params.key = apiKey;
  try {
    const { data } = await axios.get(BASE_URL, { params, timeout: 15000 });
    // Return minimal normalized structure
    const lighthouse = data?.lighthouseResult || {};
    const categories = lighthouse?.categories || {};
    const perfScore = categories.performance?.score ?? null; // 0..1
    const metrics = lighthouse?.audits || {};
    return {
      ok: true,
      raw: data,
      normalized: {
        performance: perfScore !== null ? Math.round(perfScore * 100) : null, // 0..100
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