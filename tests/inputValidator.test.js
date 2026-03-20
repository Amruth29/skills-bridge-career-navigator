const { SkillsValidator, RoleValidator } = require("../src/validators");
const { SkillValidationError, RoleValidationError } = require("../src/exceptions");

describe("SkillsValidator", () => {
	test("accepts valid comma-separated skills and trims spaces", () => {
		const result = SkillsValidator.validate("JavaScript, React , Node.js");
		expect(result).toEqual(["JavaScript", "React", "Node.js"]);
	});

	test("rejects empty skills input", () => {
		expect(() => SkillsValidator.validate("   ")).toThrow(SkillValidationError);
	});

	test("rejects numeric-only skills input", () => {
		expect(() => SkillsValidator.validate("12345, 678")).toThrow(SkillValidationError);
	});

	test("rejects invalid characters", () => {
		expect(() => SkillsValidator.validate("React,@Next")).toThrow(SkillValidationError);
	});

	test("rejects too many skills", () => {
		const skills = Array.from({ length: 21 }, (_, i) => `Skill${i}`).join(",");
		expect(() => SkillsValidator.validate(skills)).toThrow(SkillValidationError);
	});

	test("rejects skill longer than 50 chars", () => {
		const longSkill = "A".repeat(51);
		expect(() => SkillsValidator.validate(`React,${longSkill}`)).toThrow(SkillValidationError);
	});

	test("edge: ignores empty tokens between commas", () => {
		const result = SkillsValidator.validate("JavaScript,,React,  ,Node.js");
		expect(result).toEqual(["JavaScript", "React", "Node.js"]);
	});
});

describe("RoleValidator", () => {
	const jobs = [
		{ role: "Backend Developer" },
		{ role: "Frontend Developer" }
	];

	test("accepts valid role with case-insensitive match", () => {
		const result = RoleValidator.validate("backend developer", jobs);
		expect(result).toBe("Backend Developer");
	});

	test("rejects empty role", () => {
		expect(() => RoleValidator.validate("   ", jobs)).toThrow(RoleValidationError);
	});

	test("rejects role longer than max length", () => {
		const longRole = "A".repeat(51);
		expect(() => RoleValidator.validate(longRole, jobs)).toThrow(RoleValidationError);
	});

	test("rejects unknown role and returns available list", () => {
		expect(() => RoleValidator.validate("DevRel Engineer", jobs)).toThrow(RoleValidationError);
		try {
			RoleValidator.validate("DevRel Engineer", jobs);
		} catch (err) {
			expect(err.message).toContain("Available roles");
			expect(err.message).toContain("Backend Developer");
		}
	});
});

