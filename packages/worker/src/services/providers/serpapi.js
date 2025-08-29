const axios = require('axios');
const BASE_URL = 'https://serpapi.com/search.json';

async function fetchGoogleRank(keyword, domain, opts = {}) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return { ok: false, error: 'SERPAPI_KEY not set' };
  if (!keyword || !domain) throw new Error('keyword and domain required');
  const params = {
    engine: 'google',
    q: keyword,
    num: 50,
    api_key: apiKey,
    hl: opts.hl || 'en',
    gl: opts.gl || 'us',
  };
  try {
    const { data } = await axios.get(BASE_URL, { params, timeout: 15000 });
    const organic = data?.organic_results || [];
    const idx = organic.findIndex((r) => (r?.displayed_link || '').includes(domain));
    const rank = idx >= 0 ? idx + 1 : null;
    return {
      ok: true,
      raw: data,
      normalized: { keyword, domain, rank },
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { fetchGoogleRank };