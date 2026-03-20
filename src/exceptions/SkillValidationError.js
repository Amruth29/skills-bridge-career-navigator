const ValidationError = require("./ValidationError");

class SkillValidationError extends ValidationError {
  constructor(message) {
    super(message, "SKILL_VALIDATION_ERROR");
    this.name = "SkillValidationError";
  }
}

module.exports = SkillValidationError;
