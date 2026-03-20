const SkillValidationError = require("../exceptions/SkillValidationError");

const VALID_SKILL_PATTERN = /^[a-zA-Z0-9+#\.\s\-\(\)&/]*$/; // Alphanumeric, common tech chars (after splitting)
const INVALID_SKILL_PATTERN = /[^a-zA-Z0-9+#\.\s\-\(\)&/,]/g; // Characters outside allowed set (includes comma for raw input)
const MAX_SKILL_LENGTH = 50;
const MAX_SKILLS_COUNT = 20;

class SkillsValidator {
  /**
   * Validates the entire skills input string
   * @param {string} skillsInput - Comma-separated skills from user
   * @returns {string[]} Array of validated, trimmed skills
   * @throws {SkillValidationError} If validation fails
   */
  static validate(skillsInput) {
    // Check for empty input
    if (!skillsInput || skillsInput.trim().length === 0) {
      throw new SkillValidationError("❌ Skills cannot be empty. Please enter at least one skill.");
    }

    // Check if input contains only numbers and spaces/commas
    if (/^[0-9\s,]*$/.test(skillsInput.trim())) {
      throw new SkillValidationError(
        "❌ Skills cannot be only numbers. Please enter skill names like 'JavaScript,React,Node.js'."
      );
    }

    // Check for invalid characters (before splitting to get original string)
    const invalidChars = skillsInput.match(INVALID_SKILL_PATTERN);
    if (invalidChars && invalidChars.length > 0) {
      const uniqueInvalidChars = [...new Set(invalidChars)].filter(c => c !== ',');
      if (uniqueInvalidChars.length > 0) {
        throw new SkillValidationError(
          `❌ Invalid characters found: ${uniqueInvalidChars.join(", ")}. Use letters, numbers, spaces, +, #, -, ., /, (, ), & only.`
        );
      }
    }

    // Split and clean skills
    const skills = skillsInput
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);

    // Check skill count
    if (skills.length > MAX_SKILLS_COUNT) {
      throw new SkillValidationError(
        `❌ Too many skills (${skills.length}). Maximum allowed: ${MAX_SKILLS_COUNT} skills.`
      );
    }

    // Check individual skill lengths
    const tooLongSkills = skills.filter((skill) => skill.length > MAX_SKILL_LENGTH);
    if (tooLongSkills.length > 0) {
      throw new SkillValidationError(
        `❌ Skill '${tooLongSkills[0]}' is too long (${tooLongSkills[0].length}/${MAX_SKILL_LENGTH}). Please shorten it.`
      );
    }

    // Validate each skill format
    for (const skill of skills) {
      if (!VALID_SKILL_PATTERN.test(skill)) {
        throw new SkillValidationError(
          `❌ Skill '${skill}' contains invalid characters. Use letters, numbers, spaces, +, #, -, ., /, (, ), & only.`
        );
      }
    }

    return skills;
  }
}

module.exports = SkillsValidator;


