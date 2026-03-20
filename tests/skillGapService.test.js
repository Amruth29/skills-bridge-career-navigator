const { findSkillGap } = require("../src/services/skillGapService");

describe("skillGapService.findSkillGap", () => {
	test("returns missing skills from categorized required skills", () => {
		const userSkills = ["JavaScript", "React"];
		const required = {
			core: ["JavaScript", "React", "TypeScript"],
			tools: ["Git", "Webpack"]
		};

		expect(findSkillGap(userSkills, required)).toEqual(["TypeScript", "Git", "Webpack"]);
	});

	test("is case-insensitive when comparing skills", () => {
		const userSkills = ["javascript", "REACT", "git"];
		const required = {
			core: ["JavaScript", "React"],
			tools: ["Git", "Docker"]
		};

		expect(findSkillGap(userSkills, required)).toEqual(["Docker"]);
	});

	test("supports backward-compatible flat required skills array", () => {
		const userSkills = ["Node.js"];
		const required = ["Node.js", "Express", "MongoDB"];

		expect(findSkillGap(userSkills, required)).toEqual(["Express", "MongoDB"]);
	});

	test("edge: ignores non-array category values", () => {
		const userSkills = ["A"];
		const required = {
			core: ["A", "B"],
			misc: "invalid",
			another: null
		};

		expect(findSkillGap(userSkills, required)).toEqual(["B"]);
	});

	test("returns empty array when required categories are empty", () => {
		expect(findSkillGap(["JavaScript"], {})).toEqual([]);
	});
});

