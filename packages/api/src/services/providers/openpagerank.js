// Open PageRank client (placeholder)
// Docs: https://www.domcop.com/openpagerank/documentation
const axios = require('axios');

const BASE_URL = 'https://openpagerank.com/api/v1.0/getPageRank';

async function fetchOpenPageRank(domainOrUrl) {
  const key = process.env.OPEN_PAGERANK_API_KEY;
  if (!key) return { ok: false, error: 'OPEN_PAGERANK_API_KEY not set' };
  if (!domainOrUrl) throw new Error('domainOrUrl required');
  try {
    const { data } = await axios.get(BASE_URL, {
      params: { domains: domainOrUrl },
      headers: { 'API-OPR': key },
      timeout: 10000,
    });
    const result = data?.response?.[0] || {};
    const score = result?.rank ?? null; // 0..10
    return {
      ok: true,
      raw: data,
      normalized: {
        domain: result?.domain || null,
        rank: typeof score === 'number' ? score : null, // 0..10
      },
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { fetchOpenPageRank };