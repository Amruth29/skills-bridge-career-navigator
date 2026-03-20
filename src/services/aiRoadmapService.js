const { GEMINI_API_KEY, hasGeminiKey, AI_ENABLED } = require("../config/envConfig");

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Retry configuration for API calls
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_WAIT_ON_429_MS = 30000;
const LEVEL_ORDER = ["Foundation", "Practice", "Applied", "Advanced"];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to collect debug messages during API execution
function addDebug(debugTrace, message) {
  if (Array.isArray(debugTrace)) {
    debugTrace.push(message);
  }
}

// Parse duration strings from API retry headers (e.g., "3s", "500ms")
function parseRetryDelayToMs(retryDelay) {
  if (!retryDelay) {
    return null;
  }

  const value = String(retryDelay).trim().toLowerCase();

  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  const match = value.match(/^([0-9]*\.?[0-9]+)\s*(ms|s|m)$/);
  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (Number.isNaN(amount) || amount < 0) {
    return null;
  }

  if (unit === "ms") {
    return Math.ceil(amount);
  }

  if (unit === "s") {
    return Math.ceil(amount * 1000);
  }

  return Math.ceil(amount * 60 * 1000);
}

// Normalize level names to standardized format
function normalizeLevel(level, stepIndex = 0) {
  const value = String(level || "").toLowerCase();

  if (value.includes("foundation") || value.includes("beginner")) {
    return "Level 1 - Foundation";
  }

  if (value.includes("practice") || value.includes("intermediate")) {
    return "Level 2 - Practice";
  }

  if (value.includes("applied") || value.includes("project") || value.includes("real")) {
    return "Level 3 - Applied Concepts";
  }

  if (value.includes("advanced") || value.includes("expert")) {
    return "Level 4 - Advanced";
  }

  // Fallback: estimate level based on step position
  const fallback = Math.min(4, Math.max(1, Math.floor(stepIndex / 2) + 1));
  return [
    "Level 1 - Foundation",
    "Level 2 - Practice",
    "Level 3 - Applied Concepts",
    "Level 4 - Advanced"
  ][fallback - 1];
}

// Extract JSON from markdown code blocks or raw JSON in text
function extractJsonText(rawText) {
  const text = String(rawText || "").trim();
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1);
  }

  return text;
}

// Attempt to parse JSON with multiple format variations
function safeJsonParse(text) {
  const raw = String(text || "").trim();
  if (!raw) {
    return null;
  }

  const candidates = [
    raw,
    raw.replace(/,\s*([}\]])/g, "$1"),
    raw
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .replace(/,\s*([}\]])/g, "$1")
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try next variant
    }
  }

  return null;
}

// Extract one sentence/summary from potentially messy AI response text
function firstSentence(text) {
  const value = String(text || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!value) {
    return "";
  }

  if (/^[\[{]/.test(value) || value.toLowerCase().includes("json")) {
    return "";
  }

  const match = value.match(/^(.{20,220}?[.!?])\s/);
  return (match?.[1] || value.slice(0, 180)).trim();
}

// Normalize skill names for consistent mapping
function normalizeSkillKey(skill) {
  return String(skill || "").trim().toLowerCase();
}

// Extract and build a map of skills to their learning plans from API response
function mapPlansFromModelResult(parsed) {
  const values = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.plans)
      ? parsed.plans
      : Array.isArray(parsed?.items)
        ? parsed.items
        : [];

  const planMap = new Map();

  for (const item of values) {
    const skill = item?.skill || item?.name || item?.topic;
    const plan = item?.plan || item?.action || item?.guidance;

    if (!skill || !plan) {
      continue;
    }

    planMap.set(normalizeSkillKey(skill), String(plan).trim());
  }

  return planMap;
}

// Try to parse skills and their plans from plain text format (skill: plan)
function mapPlansFromPlainText(text, missingSkills) {
  const lines = String(text || "")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const planMap = new Map();

  for (const line of lines) {
    const normalized = line.replace(/^[-*•]\s+/, "").replace(/^\d+[\).:-]?\s+/, "").trim();
    const splitIdx = normalized.indexOf(":");
    if (splitIdx <= 0) {
      continue;
    }

    const maybeSkill = normalized.slice(0, splitIdx).trim();
    const maybePlan = normalized.slice(splitIdx + 1).trim();
    if (!maybeSkill || !maybePlan) {
      continue;
    }

    planMap.set(normalizeSkillKey(maybeSkill), maybePlan);
  }

  if (planMap.size === 0) {
    return planMap;
  }

  // Keep only the skills we requested
  const filtered = new Map();
  for (const skill of missingSkills) {
    const value = planMap.get(normalizeSkillKey(skill));
    if (value) {
      filtered.set(normalizeSkillKey(skill), value);
    }
  }

  return filtered;
}

// Map skill index to learning level for progression
function levelByIndex(index, total) {
  const ratio = total <= 1 ? 0 : index / (total - 1);
  if (ratio <= 0.25) {
    return "Level 1 - Foundation";
  }
  if (ratio <= 0.55) {
    return "Level 2 - Practice";
  }
  if (ratio <= 0.85) {
    return "Level 3 - Applied Concepts";
  }
  return "Level 4 - Advanced";
}

function levelPlanVariant(level, index) {
  const variants = {
    "Level 1 - Foundation": [
      "Begin with fundamentals and finish two targeted practice exercises.",
      "Focus on core building blocks, then recreate a minimal end-to-end example."
    ],
    "Level 2 - Practice": [
      "Implement one realistic feature and improve it after a short review cycle.",
      "Solve practical tasks, note recurring mistakes, and refactor once."
    ],
    "Level 3 - Applied Concepts": [
      "Apply this in a project workflow covering build, test, and debugging steps.",
      "Integrate this into a complete flow and document the trade-offs you made."
    ],
    "Level 4 - Advanced": [
      "Optimize for edge cases, performance, and reliability in production scenarios.",
      "Compare advanced implementation approaches and justify your final design decisions."
    ]
  };

  const options = variants[level] || variants["Level 2 - Practice"];
  return options[index % options.length];
}

function genericPlanForSkill(skill, level, index) {
  const intros = [
    `Build confidence in ${skill} by`,
    `Strengthen your ${skill} workflow by`,
    `Improve practical ${skill} usage by`,
    `Push ${skill} to production-readiness by`
  ];

  const levelAction = levelPlanVariant(level, index).replace(/\.$/, "");
  const intro = intros[index % intros.length];

  return `${intro} ${levelAction.toLowerCase()}.`;
}

// Parse structured roadmap data from AI response text
function parseRoadmapFromAiText(aiText, missingSkills) {
  const jsonText = extractJsonText(aiText);
  let parsed = safeJsonParse(jsonText);

  if (!Array.isArray(parsed)) {
    const candidates = parsed?.roadmap || parsed?.steps || parsed?.items;
    if (Array.isArray(candidates)) {
      parsed = candidates;
    }
  }

  // If no JSON array found, try to parse plain text format
  if (!Array.isArray(parsed) || parsed.length === 0) {
    const lines = String(aiText || "")
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);

    let activeLevel = "";
    const parsedLines = [];

    for (const line of lines) {
      const heading = line.replace(/[*_`:#\-]/g, "").trim();
      if (/^(foundation|practice|applied|advanced)$/i.test(heading)) {
        activeLevel = heading;
        continue;
      }

      const numbered = line.replace(/^\d+[\).:-]?\s+/, "").trim();
      const bulleted = numbered.replace(/^[-*•]\s+/, "").trim();
      if (!bulleted) {
        continue;
      }

      if (bulleted.length < 6) {
        continue;
      }

      parsedLines.push({ text: bulleted, levelHint: activeLevel });
    }

    if (parsedLines.length < 4) {
      return null;
    }

    return parsedLines.map((lineObj, index) => {
      const clean = lineObj.text;
      const parts = clean.split("|").map(p => p.trim()).filter(Boolean);
      const guessedSkill = missingSkills.find(skill => clean.toLowerCase().includes(String(skill).toLowerCase()));

      return {
        step: index + 1,
        level: normalizeLevel(parts[0] || lineObj.levelHint, index),
        category: "ai-guided",
        skill: parts[1] || guessedSkill || missingSkills[index] || `Skill ${index + 1}`,
        plan: parts[2] || clean
      };
    });
  }

  // Convert parsed JSON objects to roadmap format
  const maxItems = Math.min(parsed.length, Math.max(6, missingSkills.length));
  const normalized = parsed.slice(0, maxItems).map((item, index) => {
    const skill = String(item?.skill || item?.topic || item?.name || missingSkills[index] || `Skill ${index + 1}`).trim();
    const level = normalizeLevel(item?.level, index);
    const plan = String(item?.plan || item?.action || item?.task || `Practice ${skill} with guided projects.`).trim();

    return {
      step: index + 1,
      level,
      category: "ai-guided",
      skill,
      plan
    };
  });

  return normalized.length >= 4 ? normalized : null;
}

// Build roadmap using seed text when new API calls fail
function buildSeedGuidedRoadmap(missingSkills, seedText) {
  const seedPlan = firstSentence(seedText);
  const fallbackSeed = seedPlan || "Use focused practice, mini projects, and revision checkpoints to build interview-ready depth.";

  const levelVariants = {
    "Level 1 - Foundation": [
      "Start with fundamentals and complete two short guided exercises.",
      "Cover core concepts first, then rebuild a minimal working example from scratch."
    ],
    "Level 2 - Practice": [
      "Apply this in a mini feature and refactor once after testing.",
      "Practice with one realistic task and document the mistakes you fixed."
    ],
    "Level 3 - Applied Concepts": [
      "Use this in an end-to-end workflow and explain key trade-offs.",
      "Integrate this into a project flow with testing, debugging, and iteration."
    ],
    "Level 4 - Advanced": [
      "Optimize edge cases, performance, and security for production readiness.",
      "Compare two implementation approaches and justify your final design choice."
    ]
  };

  const pickVariant = (level, index) => {
    const options = levelVariants[level] || levelVariants["Level 2 - Practice"];
    return options[index % options.length];
  };

  return missingSkills.map((skill, index) => {
    const level = levelByIndex(index, missingSkills.length);
    const levelStyle = pickVariant(level, index);

    return {
      step: index + 1,
      level,
      category: "ai-guided",
      skill,
      plan: `${skill}: ${fallbackSeed} ${levelStyle}`
    };
  });
}

// Generate roadmap using template patterns when API fails
function buildAiTemplateRoadmap(missingSkills) {
  const skillHints = {
    "node.js": "Build a small REST service with modular routing and async error handling",
    express: "Create middleware for validation, auth checks, and centralized error handling",
    mongodb: "Model collections, add indexes, and implement CRUD with aggregation",
    postgresql: "Design relational schema and write joins, constraints, and pagination queries",
    "rest api": "Define resource-oriented routes, status codes, and request/response contracts",
    authentication: "Implement JWT/session auth, password hashing, and role-based access",
    "system design basics": "Draw service boundaries, data flow, and scaling bottlenecks for the feature",
    git: "Use branching, clean commit messages, and pull-request workflow on a mini project",
    docker: "Containerize the app with multi-stage builds and environment-based configs"
  };

  const levelStyles = {
    "Level 1 - Foundation": [
      "Study the core concepts and implement two short hands-on exercises.",
      "Follow official docs, then reproduce a minimal working example from scratch."
    ],
    "Level 2 - Practice": [
      "Build one feature-focused mini project and refactor it after code review.",
      "Solve practical tasks, track errors, and document fixes in learning notes."
    ],
    "Level 3 - Applied Concepts": [
      "Integrate this in an end-to-end flow (build, test, debug, deploy) with clear trade-offs.",
      "Use this in a realistic workflow and prepare interview-ready explanations with examples."
    ],
    "Level 4 - Advanced": [
      "Optimize for performance, security, and edge cases; compare at least two approaches.",
      "Design production-grade implementation, add monitoring, and benchmark improvements."
    ]
  };

  const pick = (arr, index) => arr[index % arr.length];

  return missingSkills.map((skill, index) => {
    const level = levelByIndex(index, missingSkills.length);
    const normalized = String(skill || "").trim().toLowerCase();
    const hint = skillHints[normalized] || `Complete a focused practical task around ${skill}`;
    const style = pick(levelStyles[level] || levelStyles["Level 2 - Practice"], index);

    return {
      step: index + 1,
      level,
      category: "ai-guided",
      skill,
      plan: `${hint}. ${style}`
    };
  });
}

// Build a structured roadmap when API call doesn't return properly formatted response
async function buildAIGuidedRoadmapFromMissingSkills(missingSkills, debugTrace = null, seedText = "") {
  // Try to reuse response from the first API call before making new ones
  const seedParsed = parseRoadmapFromAiText(seedText, missingSkills);
  if (Array.isArray(seedParsed) && seedParsed.length > 0) {
    addDebug(debugTrace, `[AI] Reused first response to build ${seedParsed.length} steps`);
    return seedParsed;
  }

  const seedPlainMap = mapPlansFromPlainText(seedText, missingSkills);
  if (seedPlainMap.size > 0) {
    addDebug(debugTrace, `[AI] Reused plain-text plans from first response (${seedPlainMap.size} skills)`);
    return missingSkills.map((skill, index) => ({
      step: index + 1,
      level: levelByIndex(index, missingSkills.length),
      category: "ai-guided",
      skill,
      plan: seedPlainMap.get(normalizeSkillKey(skill)) || `${skill}: Build project-based practice and recap key concepts.`
    }));
  }

  // Request structured plans in JSON format
  const planPrompt = `Create a skill learning plan in JSON for these skills: ${missingSkills.join(", ")}.
Return ONLY JSON array with objects: {"skill":"...","plan":"..."}.
Each plan must be practical and concise in 1-2 lines.`;

  let raw;

  try {
    raw = await generateGeminiContent(planPrompt, 0, debugTrace);
  } catch {
    return null;
  }

  const cleaned = extractJsonText(raw);
  let parsed = safeJsonParse(cleaned);

  const planMap = mapPlansFromModelResult(parsed);
  if (planMap.size === 0) {
    addDebug(debugTrace, "[AI] JSON parse failed, trying plain-text format");
    try {
      const plainPrompt = `For these skills: ${missingSkills.join(", ")}, return one line per skill in this exact format:\n<skill>: <1-2 line practical plan>\nNo extra text.`;
      const plainText = await generateGeminiContent(plainPrompt, 0, debugTrace);
      const plainMap = mapPlansFromPlainText(plainText, missingSkills);
      if (plainMap.size > 0) {
        parsed = null;
        return missingSkills.map((skill, index) => ({
          step: index + 1,
          level: levelByIndex(index, missingSkills.length),
          category: "ai-guided",
          skill,
          plan: plainMap.get(normalizeSkillKey(skill)) || `${skill}: Build project-based practice and recap key concepts.`
        }));
      }
    } catch {
      const seeded = buildSeedGuidedRoadmap(missingSkills, seedText);
      return seeded;
    }

    const seeded = buildSeedGuidedRoadmap(missingSkills, seedText);
    return seeded;
  }

  // Get plans for any remaining skills not covered
  const remainingSkills = missingSkills.filter(skill => !planMap.has(normalizeSkillKey(skill)));
  if (remainingSkills.length > 0) {
    addDebug(debugTrace, `[AI] Missing plans for ${remainingSkills.length} skills. Requesting again.`);
    try {
      const remainingPrompt = `Generate plans for these skills as JSON array [{"skill":"...","plan":"..."}] only: ${remainingSkills.join(", ")}.`;
      const remainingRaw = await generateGeminiContent(remainingPrompt, 0, debugTrace);
      const remainingParsed = safeJsonParse(extractJsonText(remainingRaw));
      const remainingMap = mapPlansFromModelResult(remainingParsed);
      for (const [key, value] of remainingMap.entries()) {
        planMap.set(key, value);
      }
    } catch {
      // Best effort - continue with what we have
    }

    // If still missing skills, try one more per-skill approach
    const stillMissing = missingSkills.filter(skill => !planMap.has(normalizeSkillKey(skill)));
    if (stillMissing.length > 0) {
      addDebug(debugTrace, `[AI] Still missing ${stillMissing.length} plans. Generating individually.`);
      for (const skill of stillMissing) {
        try {
          const singlePrompt = `Give a concise 1-2 line practical learning plan for ${skill}. No headings.`;
          const singleText = await generateGeminiContent(singlePrompt, 0, debugTrace);
          const singlePlan = firstSentence(singleText) || String(singleText || "").trim();
          if (singlePlan) {
            planMap.set(normalizeSkillKey(skill), singlePlan);
          }
        } catch {
          // Best effort - move on
        }
      }
    }
  }

  // Build final roadmap with collected plans
  const roadmap = missingSkills.map((skill, index) => {
    const level = levelByIndex(index, missingSkills.length);
    const existingPlan = planMap.get(normalizeSkillKey(skill));
    const fallbackPlan = genericPlanForSkill(skill, level, index);

    return {
      step: index + 1,
      level,
      category: "ai-guided",
      skill,
      plan: existingPlan || fallbackPlan
    };
  });

  // If any plans are empty, fall back to seed roadmap
  if (roadmap.some(item => !String(item.plan || "").trim())) {
    const seeded = buildSeedGuidedRoadmap(missingSkills, seedText || raw);
    return seeded;
  }

  return roadmap;
}

// Call Gemini API with retry logic and rate-limit handling
async function generateGeminiContent(prompt, retryCount = 0, debugTrace = null) {
  if (!AI_ENABLED) {
    throw new Error("AI_DISABLED");
  }

  if (!hasGeminiKey) {
    throw new Error("MISSING_GEMINI_KEY");
  }

  const attemptNumber = retryCount + 1;
  const totalAttempts = MAX_RETRIES + 1;
  const attemptMessage = `[AI] Attempt ${attemptNumber}/${totalAttempts} - Calling API`;
  console.log(attemptMessage);
  addDebug(debugTrace, attemptMessage);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 320,
          temperature: 0.3
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      let parsedError;

      try {
        parsedError = await response.json();
      } catch {
        parsedError = null;
      }

      const status = response.status;
      const apiMessage = parsedError?.error?.message || response.statusText || "API request failed";
      const retryDelay = parsedError?.error?.details?.[0]?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo" 
        ? parsedError?.error?.details?.[0]?.retryDelay 
        : null;

      // Handle rate limiting with exponential backoff
      if ((status === 429 || apiMessage.toLowerCase().includes("resource_exhausted")) && retryCount < MAX_RETRIES) {
        const parsedRetryDelayMs = parseRetryDelayToMs(retryDelay);
        const fallbackBackoff = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        const jitter = Math.floor(Math.random() * 300);
        const waitTime = Math.min(parsedRetryDelayMs || fallbackBackoff + jitter, MAX_WAIT_ON_429_MS);
        const retryMessage = `[Retry ${retryCount + 1}/${MAX_RETRIES}] Rate limited. Waiting ${Math.ceil(waitTime)}ms...`;
        console.log(retryMessage);
        addDebug(debugTrace, retryMessage);
        await delay(waitTime);
        return generateGeminiContent(prompt, retryCount + 1, debugTrace);
      }

      throw new Error(`HTTP_${status}:${apiMessage}`);
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts
      .map(part => part?.text)
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!text) {
      if (retryCount < MAX_RETRIES) {
        const retryWait = 800 * (retryCount + 1);
        const emptyRetryMessage = `[Retry ${retryCount + 1}/${MAX_RETRIES}] Empty response. Waiting ${retryWait}ms...`;
        console.log(emptyRetryMessage);
        addDebug(debugTrace, emptyRetryMessage);
        await delay(retryWait);
        return generateGeminiContent(prompt, retryCount + 1, debugTrace);
      }

      throw new Error("Empty API response");
    }

    addDebug(debugTrace, "[AI] Response received successfully");

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

// Main entry point: generate complete roadmap for missing skills
async function generateAIRoadmap(missingSkills, debugTrace = null) {
  if (!missingSkills || missingSkills.length === 0) {
    addDebug(debugTrace, "[AI] No missing skills. Skipping API call");
    return "You already meet all required skills 🎉";
  }

  try {
    const skillsList = missingSkills.join(", ");
    const prompt = `Create a roadmap for these missing skills: ${skillsList}.
Return ONLY a JSON array.
Each item must have: level, skill, plan.
Use level order: ${LEVEL_ORDER.join(" -> ")}.
Give concise actionable plans.`;

    const aiText = await generateGeminiContent(prompt, 0, debugTrace);
    const parsedRoadmap = parseRoadmapFromAiText(aiText, missingSkills);

    if (!parsedRoadmap) {
      addDebug(debugTrace, "[AI] Response format invalid");
      const hybridRoadmap = await buildAIGuidedRoadmapFromMissingSkills(missingSkills, debugTrace, aiText);
      if (Array.isArray(hybridRoadmap) && hybridRoadmap.length > 0) {
        addDebug(debugTrace, `[AI] Built ${hybridRoadmap.length} steps from unstructured response`);
        return hybridRoadmap;
      }
      addDebug(debugTrace, "[AI] Using local template roadmap");
      return buildAiTemplateRoadmap(missingSkills);
    }

    addDebug(debugTrace, `[AI] Parsed ${parsedRoadmap.length} roadmap steps`);

    return parsedRoadmap;

  } catch (error) {
    const message = String(error.message || "");
    addDebug(debugTrace, `[AI] Error: ${message}`);

    if (message.includes("AI_DISABLED")) {
      throw new Error("AI temporarily disabled by config");
    }

    if (message.includes("MISSING_GEMINI_KEY")) {
      throw new Error("Gemini API key is missing");
    }

    if (message.includes("HTTP_429") || message.toLowerCase().includes("resource_exhausted") || message.toLowerCase().includes("quota")) {
      throw new Error(`Quota exceeded after ${MAX_RETRIES} retries`);
    }

    if (message.includes("HTTP_401") || message.includes("HTTP_403")) {
      throw new Error("Gemini authentication failed");
    }

    if (message.includes("INVALID_AI_FORMAT")) {
      throw new Error("AI response format invalid");
    }

    if (message.toLowerCase().includes("aborted")) {
      throw new Error("Gemini request timed out");
    }

    throw new Error("AI service failed");
  }
}

module.exports = { generateAIRoadmap };
