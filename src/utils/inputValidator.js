const INVALID_SKILL_PATTERN = /^[0-9\s,]*$/; // Only numbers/spaces/commas
const VALID_SKILL_PATTERN = /^[a-zA-Z0-9+#\.\s\-\(\)&/]*$/; // Alphanumeric, common tech chars
const MAX_SKILL_LENGTH = 50;
const MAX_SKILLS_COUNT = 20;
const MAX_ROLE_LENGTH = 50;

function validateSkillsInput(skillsInput) {
  // Check if input is provided
  if (!skillsInput || typeof skillsInput !== 'string') {
    throw new Error("Skills input is required");
  }

  const trimmedInput = skillsInput.trim();

  // Check if empty after trimming
  if (trimmedInput.length === 0) {
    throw new Error("Skills cannot be empty. Please enter at least one skill.");
  }

  // Check if input is only numbers/spaces/commas (invalid)
  if (INVALID_SKILL_PATTERN.test(trimmedInput)) {
    throw new Error("Skills must contain actual skill names, not just numbers.");
  }

  // Split and validate each skill
  const skills = trimmedInput.split(",").map(s => s.trim()).filter(s => s.length > 0);

  if (skills.length === 0) {
    throw new Error("Please enter at least one valid skill.");
  }

  if (skills.length > MAX_SKILLS_COUNT) {
    throw new Error(`Maximum ${MAX_SKILLS_COUNT} skills allowed. You entered ${skills.length}.`);
  }

  // Validate each skill
  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];

    if (skill.length === 0) {
      throw new Error("Skills cannot contain empty values. Please remove extra commas.");
    }

    if (skill.length > MAX_SKILL_LENGTH) {
      throw new Error(`Skill "${skill}" is too long (max ${MAX_SKILL_LENGTH} characters).`);
    }

    if (!VALID_SKILL_PATTERN.test(skill)) {
      throw new Error(`Skill "${skill}" contains invalid characters. Use letters, numbers, +, #, ., -, (, ), &, or /.`);
    }
  }

  return skills;
}

function validateRoleInput(roleInput, availableRoles) {
  // Check if input is provided
  if (!roleInput || typeof roleInput !== 'string') {
    throw new Error("Role input is required");
  }

  const trimmedRole = roleInput.trim();

  // Check if empty after trimming
  if (trimmedRole.length === 0) {
    throw new Error("Role cannot be empty. Please enter a valid role.");
  }

  // Check role length
  if (trimmedRole.length > MAX_ROLE_LENGTH) {
    throw new Error(`Role is too long (max ${MAX_ROLE_LENGTH} characters).`);
  }

  // Validate against available roles
  const roleExists = availableRoles.some(
    job => job.role.toLowerCase() === trimmedRole.toLowerCase()
  );

  if (!roleExists) {
    const roleList = availableRoles.map(job => job.role).join(", ");
    throw new Error(`"${trimmedRole}" is not a valid role.\n\nAvailable roles:\n${roleList}`);
  }

  return trimmedRole;
}

function validateInput(skills, role, availableRoles) {
  // Validate skills
  if (!skills || skills.length === 0) {
    throw new Error("Skills cannot be empty");
  }

  // Validate role
  if (!role || role.trim() === "") {
    throw new Error("Role is required");
  }

  // Validate role exists (if availableRoles provided)
  if (availableRoles && Array.isArray(availableRoles)) {
    const roleExists = availableRoles.some(
      job => job.role.toLowerCase() === role.toLowerCase()
    );

    if (!roleExists) {
      throw new Error("Role not found");
    }
  }
}

module.exports = { validateInput, validateSkillsInput, validateRoleInput };