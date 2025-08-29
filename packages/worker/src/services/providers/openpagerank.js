const axios = require('axios');
const BASE_URL = 'https://openpagerank.com/api/v1.0/getPageRank';

function normalizeDomain(input) {
  if (!input) return input;
  try {
    const u = new URL(input);
    return (u.hostname || '').replace(/^www\./, '');
  } catch (_) {
    return String(input)
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0];
  }
}

// Fetch Open PageRank rank for a domain or URL
async function fetchOpenPageRank(domainOrUrl) {
  const key = process.env.OPEN_PAGERANK_API_KEY;
  if (!key) return { ok: false, error: 'OPEN_PAGERANK_API_KEY not set' };
  if (!domainOrUrl) throw new Error('domainOrUrl required');

  const domain = normalizeDomain(domainOrUrl);

  try {
    const { data } = await axios.get(BASE_URL, {
      params: { domains: domain },
      headers: { 'API-OPR': key },
      timeout: 15000,
    });
    const result = data?.response?.[0] || {};
    const score = result?.rank ?? null; // 0..10
    return {
      ok: true,
      raw: data,
      normalized: {
        domain: result?.domain || domain,
        rank: typeof score === 'number' ? score : null,
      },
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { fetchOpenPageRank };