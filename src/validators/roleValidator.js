const RoleValidationError = require("../exceptions/RoleValidationError");

const MAX_ROLE_LENGTH = 50;

class RoleValidator {
  /**
   * Validates the role input and checks if it exists in available roles
   * @param {string} roleInput - Role name from user
   * @param {Array} jobs - Array of available jobs
   * @returns {string} Matched role name from jobs
   * @throws {RoleValidationError} If validation fails
   */
  static validate(roleInput, jobs) {
    // Check for empty input
    if (!roleInput || roleInput.trim().length === 0) {
      throw new RoleValidationError("❌ Role cannot be empty. Please select a valid role.");
    }

    // Check role length
    if (roleInput.trim().length > MAX_ROLE_LENGTH) {
      throw new RoleValidationError(
        `❌ Role name is too long (${roleInput.trim().length}/${MAX_ROLE_LENGTH}). Please shorten it.`
      );
    }

    // Case-insensitive role matching
    const matchedJob = jobs.find((job) => job.role.toLowerCase() === roleInput.trim().toLowerCase());

    if (!matchedJob) {
      const availableRoles = jobs.map((job) => job.role).join(", ");
      throw new RoleValidationError(
        `❌ Role '${roleInput}' not found. Available roles:\n${availableRoles}`
      );
    }

    return matchedJob.role;
  }
}

module.exports = RoleValidator;
