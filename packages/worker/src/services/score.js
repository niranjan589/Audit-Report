function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function scoreFromPageSpeed(ps) {
  if (!ps || ps.performance == null) return null;
  let s = ps.performance;
  if (typeof ps.cls === 'number') {
    if (ps.cls > 0.25) s -= 10;
    else if (ps.cls > 0.1) s -= 5;
  }
  if (typeof ps.tbtMs === 'number') {
    if (ps.tbtMs > 600) s -= 10;
    else if (ps.tbtMs > 300) s -= 5;
  }
  return clamp(s);
}

function scoreFromOpenPageRank(opr) {
  if (!opr || typeof opr.rank !== 'number') return null;
  return clamp(opr.rank * 10);
}

function scoreFromSerpRank(rank) {
  if (rank == null) return null;
  const s = 100 - ((rank - 1) * (98 / 49));
  return clamp(s);
}

function computeScores({ pageSpeed, openPageRank, serp }) {
  const seo = scoreFromPageSpeed(pageSpeed?.normalized);
  const rank = scoreFromSerpRank(serp?.normalized?.rank);
  const domainRank = scoreFromOpenPageRank(openPageRank?.normalized);
  const social = null;
  const parts = [];
  if (seo != null) parts.push({ w: 0.4, s: seo });
  if (rank != null) parts.push({ w: 0.4, s: rank });
  if (domainRank != null) parts.push({ w: 0.2, s: domainRank });
  let overall = null;
  if (parts.length) {
    const totalW = parts.reduce((a, b) => a + b.w, 0);
    overall = clamp(parts.reduce((a, b) => a + b.s * b.w, 0) / totalW);
  }
  return { seo: seo ?? null, rank: rank ?? null, domainRank: domainRank ?? null, social, overall };
}

module.exports = { scoreFromPageSpeed, scoreFromOpenPageRank, scoreFromSerpRank, computeScores };