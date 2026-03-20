function extractStepsFromText(roadmapText) {
  const lines = String(roadmapText || "")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const numberedLines = lines
    .map(line => line.replace(/^[-*]\s+/, ""))
    .filter(line => /^\d+[\).:-]?\s+/.test(line));

  if (numberedLines.length > 0) {
    return numberedLines.map((line, index) => {
      const text = line.replace(/^\d+[\).:-]?\s+/, "").trim();
      return {
        step: index + 1,
        label: text || `Step ${index + 1}`
      };
    });
  }

  return lines.slice(0, 12).map((line, index) => ({
    step: index + 1,
    label: line
  }));
}

function normalizeRoadmapSteps(roadmap) {
  if (Array.isArray(roadmap)) {
    return roadmap.map((item, index) => ({
      step: item.step || index + 1,
      label: item.skill ? `${item.level || "Step"}: ${item.skill}` : item.plan || `Step ${index + 1}`
    }));
  }

  if (typeof roadmap === "string") {
    if (roadmap.toLowerCase().includes("already meet all required skills")) {
      return [{ step: 1, label: "All required skills achieved" }];
    }

    return extractStepsFromText(roadmap);
  }

  return [];
}

function buildAsciiFlowchart(steps) {
  if (!steps || steps.length === 0) {
    return "[No roadmap steps available]";
  }

  return steps
    .map((step, index) => {
      const line = `[${index + 1}] ${step.label}`;
      return index === steps.length - 1 ? line : `${line}\n   |\n   v`;
    })
    .join("\n");
}

function generateRoadmapDiagram(roadmap) {
  const steps = normalizeRoadmapSteps(roadmap);

  return {
    steps,
    ascii: buildAsciiFlowchart(steps)
  };
}

module.exports = {
  generateRoadmapDiagram
};
