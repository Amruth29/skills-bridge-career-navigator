const CATEGORY_LEVEL_HINTS = {
  core: 1,
  frontend: 1,
  backend: 1,
  languages: 1,
  database: 1,
  databases: 1,
  platforms: 1,
  crossplatform: 1,
  native: 1,

  tools: 2,
  scripting: 2,
  cloud: 2,
  visualization: 2,
  analytics: 2,
  cicd: 2,
  containerization: 2,
  ml: 2,
  deeplearning: 2,
  automation: 2,

  concepts: 3,
  architecture: 3,
  administration: 3,
  security: 3,
  design: 3,
  infrastructure: 3,
  process: 3,
  analysis: 3,

  advanced: 4
};

function getLevelLabel(level) {
  const labels = {
    1: "Level 1 - Foundation",
    2: "Level 2 - Practice",
    3: "Level 3 - Applied Concepts",
    4: "Level 4 - Advanced"
  };

  return labels[level] || "Level 2 - Practice";
}

const CATEGORY_ACTIONS = {
  core: "cover syntax + fundamentals",
  frontend: "build UI components and state flows",
  backend: "design endpoints and business logic",
  database: "model data and practice queries",
  databases: "model data and practice queries",
  tools: "use tooling in daily workflow",
  cloud: "deploy and monitor a small service",
  cicd: "set up build/test/deploy pipelines",
  containerization: "containerize and run local stacks",
  architecture: "design scalable module boundaries",
  security: "apply auth, validation, and secure defaults",
  ml: "train/evaluate simple models",
  deeplearning: "implement and tune neural workflows"
};

function pickByHash(skill, options) {
  const source = String(skill || "");
  const hash = [...source].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return options[hash % options.length];
}

function buildPlanSentences(skill, level, category) {
  const action = CATEGORY_ACTIONS[category] || "apply the skill in practical tasks";

  if (level === 1) {
    return [
      `Study ${skill} from official docs/course notes and ${action}.`,
      `Finish 2-3 focused exercises and write a short recap of key concepts.`
    ];
  }

  if (level === 2) {
    const first = pickByHash(skill, [
      `Build a mini project using ${skill} and ${action}.`,
      `Practice ${skill} through guided labs and implement one real feature.`
    ]);

    return [
      first,
      `Track mistakes, refactor once, and keep reusable snippets for revision.`
    ];
  }

  if (level === 3) {
    return [
      `Use ${skill} in an end-to-end workflow (build, test, debug, and deploy).`,
      `Document trade-offs and decisions so you can explain your approach in interviews.`
    ];
  }

  return [
    `Deep dive into advanced ${skill} patterns, performance, and edge cases.`,
    `Benchmark your solution and publish one production-style implementation.`
  ];
}

function getPlanByLevel(skill, level, category) {
  return buildPlanSentences(skill, level, category).join(" ");
}

function getProgressiveLevel(totalSteps, stepIndex) {
  if (totalSteps <= 1) {
    return 2;
  }

  if (totalSteps === 2) {
    return stepIndex === 0 ? 1 : 2;
  }

  if (totalSteps === 3) {
    return stepIndex + 1;
  }

  const ratio = stepIndex / (totalSteps - 1);
  if (ratio <= 0.25) {
    return 1;
  }
  if (ratio <= 0.55) {
    return 2;
  }
  if (ratio <= 0.85) {
    return 3;
  }
  return 4;
}

function buildOrderedMissingSkills(userSkills, skillCategories) {
  const userSkillsLower = new Set(userSkills.map(skill => skill.toLowerCase()));
  const steps = [];

  for (const [category, skills] of Object.entries(skillCategories || {})) {
    if (!Array.isArray(skills)) {
      continue;
    }

    const level = CATEGORY_LEVEL_HINTS[category] || 2;

    for (const skill of skills) {
      if (!userSkillsLower.has(String(skill).toLowerCase())) {
        steps.push({ category, skill, level });
      }
    }
  }

  return steps.sort((a, b) => {
    if (a.level !== b.level) {
      return a.level - b.level;
    }

    return a.category.localeCompare(b.category);
  });
}

function generateFallbackRoadmap(userSkillsOrMissingSkills, skillCategories) {
  if (Array.isArray(userSkillsOrMissingSkills) && !skillCategories) {
    const totalSteps = userSkillsOrMissingSkills.length;

    return userSkillsOrMissingSkills.map((skill, index) => {
      const level = getProgressiveLevel(totalSteps, index);

      return {
      step: index + 1,
      level: getLevelLabel(level),
      category: "general",
      skill,
      plan: getPlanByLevel(skill, level, "general")
      };
    });
  }

  const orderedMissingSkills = buildOrderedMissingSkills(userSkillsOrMissingSkills || [], skillCategories || {});

  if (orderedMissingSkills.length === 0) {
    return "You already meet all required skills 🎉";
  }

  return orderedMissingSkills.map((item, index) => ({
    step: index + 1,
    level: getLevelLabel(item.level),
    category: item.category,
    skill: item.skill,
    plan: getPlanByLevel(item.skill, item.level, item.category)
  }));
}

module.exports = { generateFallbackRoadmap };