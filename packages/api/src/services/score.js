// Basic scoring utility to combine provider results into SEO/rank/social/overall
// All scores normalized to 0..100

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

// Convert PageSpeed normalized into 0..100
function scoreFromPageSpeed(ps) {
  if (!ps || ps.performance == null) return null;
  // performance already 0..100
  // Apply mild penalty for poor CLS/TBT if available
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

// Convert Open PageRank (0..10) to 0..100
function scoreFromOpenPageRank(opr) {
  if (!opr || typeof opr.rank !== 'number') return null;
  return clamp(opr.rank * 10);
}

// Convert SERP rank (1..50) to 0..100 where 1 is best
function scoreFromSerpRank(rank) {
  if (rank == null) return null;
  // Invert scale: 1 -> 100, 50 -> 2, null -> null
  const s = 100 - ((rank - 1) * (98 / 49));
  return clamp(s);
}

function computeScores({ pageSpeed, openPageRank, serp }) {
  const seo = scoreFromPageSpeed(pageSpeed?.normalized);
  const rank = scoreFromSerpRank(serp?.normalized?.rank);
  const domainRank = scoreFromOpenPageRank(openPageRank?.normalized);

  // Social will be added later; placeholder null
  const social = null;

  // Overall: weighted average of available scores
  const parts = [];
  if (seo != null) parts.push({ w: 0.4, s: seo });
  if (rank != null) parts.push({ w: 0.4, s: rank });
  if (domainRank != null) parts.push({ w: 0.2, s: domainRank });

  let overall = null;
  if (parts.length) {
    const totalW = parts.reduce((a, b) => a + b.w, 0);
    overall = clamp(parts.reduce((a, b) => a + b.s * b.w, 0) / totalW);
  }

  return {
    seo: seo ?? null,
    rank: rank ?? null,
    domainRank: domainRank ?? null,
    social,
    overall,
  };
}

module.exports = {
  scoreFromPageSpeed,
  scoreFromOpenPageRank,
  scoreFromSerpRank,
  computeScores,
};