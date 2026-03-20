jest.mock("../src/services/skillGapService", () => ({
	findSkillGap: jest.fn()
}));

jest.mock("../src/services/aiRoadmapService", () => ({
	generateAIRoadmap: jest.fn()
}));

jest.mock("../src/services/fallbackRoadmapService", () => ({
	generateFallbackRoadmap: jest.fn()
}));

jest.mock("../src/services/responseCacheService", () => ({
	getCachedRoadmap: jest.fn(),
	setCachedRoadmap: jest.fn()
}));

jest.mock("../src/utils/roadmapDiagram", () => ({
	generateRoadmapDiagram: jest.fn(() => ({ ascii: "diagram", steps: [] }))
}));

jest.mock("../src/utils/logger", () => ({
	log: jest.fn()
}));

const { analyzeProfile } = require("../src/controllers/analysisController");
const { findSkillGap } = require("../src/services/skillGapService");
const { generateAIRoadmap } = require("../src/services/aiRoadmapService");
const { generateFallbackRoadmap } = require("../src/services/fallbackRoadmapService");
const { getCachedRoadmap, setCachedRoadmap } = require("../src/services/responseCacheService");
const { AnalysisError } = require("../src/exceptions");

describe("analysisController.analyzeProfile", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("throws AnalysisError for empty skills", async () => {
		await expect(analyzeProfile([], "Backend Developer")).rejects.toThrow(AnalysisError);
	});

	test("throws AnalysisError for empty role", async () => {
		await expect(analyzeProfile(["JavaScript"], "")).rejects.toThrow(AnalysisError);
	});

	test("throws AnalysisError for unknown role", async () => {
		await expect(analyzeProfile(["JavaScript"], "Unknown Role")).rejects.toThrow("Role not found");
	});

	test("returns cached roadmap when cache hit occurs", async () => {
		getCachedRoadmap.mockReturnValue([{ step: 1, skill: "Node.js", plan: "cached" }]);
		findSkillGap.mockReturnValue(["Node.js"]);

		const result = await analyzeProfile(["JavaScript"], "Backend Developer");

		expect(result.roadmapSource).toBe("cache");
		expect(result.roadmapMessage).toContain("Loaded cached roadmap");
		expect(generateAIRoadmap).not.toHaveBeenCalled();
	});

	test("returns AI roadmap when AI generation succeeds", async () => {
		getCachedRoadmap.mockReturnValue(null);
		findSkillGap.mockReturnValue(["Node.js", "Express"]);
		generateAIRoadmap.mockResolvedValue([{ step: 1, skill: "Node.js", plan: "AI plan" }]);

		const result = await analyzeProfile(["JavaScript"], "Backend Developer");

		expect(result.roadmapSource).toBe("ai");
		expect(result.roadmapMessage).toContain("Generated using Gemini AI");
		expect(setCachedRoadmap).toHaveBeenCalled();
	});

	test("falls back when AI generation fails", async () => {
		getCachedRoadmap.mockReturnValue(null);
		findSkillGap.mockReturnValue(["Node.js"]);
		generateAIRoadmap.mockRejectedValue(new Error("Quota exceeded after 3 retries"));
		generateFallbackRoadmap.mockReturnValue([{ step: 1, skill: "Node.js", plan: "fallback plan" }]);

		const result = await analyzeProfile(["JavaScript"], "Backend Developer");

		expect(result.roadmapSource).toBe("fallback");
		expect(result.roadmapMessage).toContain("Fallback used");
		expect(generateFallbackRoadmap).toHaveBeenCalled();
		expect(setCachedRoadmap).toHaveBeenCalled();
	});
});

