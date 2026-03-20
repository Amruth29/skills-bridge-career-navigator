const { generateFallbackRoadmap } = require("../src/services/fallbackRoadmapService");

describe("fallbackRoadmapService.generateFallbackRoadmap", () => {
	test("generates ordered roadmap by level from categorized skills", () => {
		const userSkills = ["JavaScript"];
		const categories = {
			advanced: ["TypeScript"],
			core: ["JavaScript", "Node.js"],
			tools: ["Git"]
		};

		const roadmap = generateFallbackRoadmap(userSkills, categories);
		expect(Array.isArray(roadmap)).toBe(true);
		expect(roadmap[0].skill).toBe("Node.js");
		expect(roadmap[0].level).toBe("Level 1 - Foundation");
		expect(roadmap[1].level).toBe("Level 2 - Practice");
		expect(roadmap[2].level).toBe("Level 4 - Advanced");
	});

	test("returns completion message when no skills are missing", () => {
		const userSkills = ["JavaScript", "Node.js"];
		const categories = {
			core: ["JavaScript", "Node.js"]
		};

		expect(generateFallbackRoadmap(userSkills, categories)).toBe("You already meet all required skills 🎉");
	});

	test("supports backward-compatible missing-skills array mode", () => {
		const roadmap = generateFallbackRoadmap(["HTML", "CSS", "DOM Manipulation", "Responsive Design"]);

		expect(roadmap).toHaveLength(4);
		expect(roadmap[0]).toMatchObject({
			step: 1,
			level: "Level 1 - Foundation",
			category: "general",
			skill: "HTML"
		});
		expect(roadmap[1].level).toBe("Level 2 - Practice");
		expect(roadmap[2].level).toBe("Level 3 - Applied Concepts");
		expect(roadmap[3].level).toBe("Level 4 - Advanced");
	});

	test("plan text is actionable and not empty", () => {
		const userSkills = [];
		const categories = {
			core: ["Node.js"]
		};

		const roadmap = generateFallbackRoadmap(userSkills, categories);
		expect(roadmap[0].plan).toContain("Node.js");
		expect(roadmap[0].plan.length).toBeGreaterThan(20);
	});
});

