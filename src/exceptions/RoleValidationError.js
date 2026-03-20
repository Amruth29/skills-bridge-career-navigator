const ValidationError = require("./ValidationError");

class RoleValidationError extends ValidationError {
  constructor(message) {
    super(message, "ROLE_VALIDATION_ERROR");
    this.name = "RoleValidationError";
  }
}

module.exports = RoleValidationError;
