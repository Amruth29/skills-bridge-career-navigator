const jobs = require("../../data/jobs.json");
const { findSkillGap } = require("../services/skillGapService");
const { generateAIRoadmap } = require("../services/aiRoadmapService");
const { generateFallbackRoadmap } = require("../services/fallbackRoadmapService");
const { getCachedRoadmap, setCachedRoadmap } = require("../services/responseCacheService");
const { generateRoadmapDiagram } = require("../utils/roadmapDiagram");
const { AnalysisError } = require("../exceptions");
const { log } = require("../utils/logger");

const FALLBACK_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

async function analyzeProfile(userSkills, role) {
  const debugTrace = [];

  // Validate inputs
  if (!userSkills || userSkills.length === 0) {
    throw new AnalysisError("User skills cannot be empty");
  }

  if (!role || role.trim().length === 0) {
    throw new AnalysisError("Role cannot be empty");
  }

  const job = jobs.find(j => j.role.toLowerCase() === role.toLowerCase());

  if (!job) {
    throw new AnalysisError("Role not found");
  }

  const missingSkills = findSkillGap(userSkills, job.skillCategories);

  const cachedRoadmap = getCachedRoadmap(role, userSkills);
  if (cachedRoadmap) {
    log("Cache hit: using stored roadmap (Gemini not called)");
    debugTrace.push("[Flow] Cache hit: returned cached roadmap");
    const roadmapDiagram = generateRoadmapDiagram(cachedRoadmap);

    return {
      missingSkills,
      roadmap: cachedRoadmap,
      roadmapSource: "cache",
      roadmapMessage: "Loaded cached roadmap for this role + skills",
      roadmapDiagram,
      debugTrace
    };
  }

  log("Cache miss: attempting Gemini API roadmap generation");
  debugTrace.push("[Flow] Cache miss: calling Gemini service");

  let roadmap;
  let roadmapSource = "ai";
  let roadmapMessage = "Generated using Gemini AI";

  try {
    roadmap = await generateAIRoadmap(missingSkills, debugTrace);
    setCachedRoadmap(role, userSkills, roadmap);
    debugTrace.push("[Flow] AI roadmap generated and cached");
  } catch (error) {
    roadmap = generateFallbackRoadmap(userSkills, job.skillCategories);
    setCachedRoadmap(role, userSkills, roadmap, FALLBACK_CACHE_TTL_MS);
    roadmapSource = "fallback";
    roadmapMessage = `Fallback used: ${error.message}`;
    debugTrace.push(`[Flow] Fallback roadmap used: ${error.message}`);
  }

  const roadmapDiagram = generateRoadmapDiagram(roadmap);

  return {
    missingSkills,
    roadmap,
    roadmapSource,
    roadmapMessage,
    roadmapDiagram,
    debugTrace
  };
}

module.exports = { analyzeProfile };