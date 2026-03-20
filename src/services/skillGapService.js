// Flatten nested skill categories into a single array
function flattenSkills(skillCategoriesObject) {
  const allSkills = [];
  
  // If it's an array, return as-is (backward compatibility)
  if (Array.isArray(skillCategoriesObject)) {
    return skillCategoriesObject;
  }
  
  // If it's an object with categories, flatten all values
  if (typeof skillCategoriesObject === 'object' && skillCategoriesObject !== null) {
    Object.values(skillCategoriesObject).forEach(categorySkills => {
      if (Array.isArray(categorySkills)) {
        allSkills.push(...categorySkills);
      }
    });
  }
  
  return allSkills;
}

function findSkillGap(userSkills, requiredSkillCategories) {
  // Flatten the skill categories into a single array
  const flatRequiredSkills = flattenSkills(requiredSkillCategories);
  
  // Convert user skills to lowercase for case-insensitive comparison
  const userSkillsLower = userSkills.map(s => s.toLowerCase());
  
  // Find skills that are required but user doesn't have
  return flatRequiredSkills.filter(
    skill => !userSkillsLower.includes(skill.toLowerCase())
  );
}

module.exports = { findSkillGap };