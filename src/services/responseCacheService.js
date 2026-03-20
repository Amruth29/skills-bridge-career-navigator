const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const responseCache = new Map();

function normalizeSkills(skills = []) {
  return [...new Set((skills || []).map(skill => String(skill).trim().toLowerCase()).filter(Boolean))].sort();
}

function buildCacheKey(role, skills) {
  const normalizedRole = String(role || "").trim().toLowerCase();
  const normalizedSkills = normalizeSkills(skills);
  return `${normalizedRole}::${normalizedSkills.join("|")}`;
}

function getCachedRoadmap(role, skills) {
  const key = buildCacheKey(role, skills);
  const cached = responseCache.get(key);

  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expiresAt) {
    responseCache.delete(key);
    return null;
  }

  return cached.value;
}

function setCachedRoadmap(role, skills, value, ttlMs = CACHE_TTL_MS) {
  const key = buildCacheKey(role, skills);
  responseCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

module.exports = {
  getCachedRoadmap,
  setCachedRoadmap,
  buildCacheKey
};
