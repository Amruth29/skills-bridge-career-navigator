// Central export for all custom exceptions
module.exports = {
  ValidationError: require("./ValidationError"),
  SkillValidationError: require("./SkillValidationError"),
  RoleValidationError: require("./RoleValidationError"),
  AnalysisError: require("./AnalysisError")
};
