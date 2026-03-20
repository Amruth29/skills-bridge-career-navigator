const ResumeParser = require('../services/resumeParser');
const JobDescriptionAnalyzer = require('../services/jobDescriptionAnalyzer');
const CertificationsAnalyzer = require('../services/certificationsAnalyzer');
const { findSkillGap } = require('../services/skillGapService');
const { generateAIRoadmap } = require('../services/aiRoadmapService');
const { generateFallbackRoadmap } = require('../services/fallbackRoadmapService');

/**
 * Resume Analysis Controller
 * Handles resume upload, gap analysis, and certification recommendations
 */

class ResumeAnalysisController {
  /**
   * Analyze resume against job requirements
   * @param {string} resumePath - Path to resume file
   * @param {string} jobRole - Target job role
   * @returns {Object} Analysis result
   */
  static async analyzeResumeForRole(resumePath, jobRole) {
    const debugTrace = [];
    
    try {
      // Step 1: Parse resume
      debugTrace.push('[Resume] Parsing resume file...');
      const parseResult = await ResumeParser.parseResume(resumePath);
      
      if (!parseResult.success) {
        return {
          success: false,
          error: parseResult.error,
          debugTrace
        };
      }

      debugTrace.push(`[Resume] ✓ Found ${parseResult.skills.length} skills`);
      debugTrace.push(`[Resume] ✓ Found ${parseResult.certifications.length} certifications`);

      const extractedSkills = parseResult.skills;
      const extractedCertifications = parseResult.certifications;

      // Step 2: Analyze gap against job description
      debugTrace.push(`[Gap Analysis] Comparing against ${jobRole}...`);
      const gapAnalysis = JobDescriptionAnalyzer.analyzeGap(extractedSkills, jobRole);

      if (!gapAnalysis.success) {
        return {
          success: false,
          error: gapAnalysis.error,
          availableJobs: gapAnalysis.availableJobs,
          debugTrace
        };
      }

      debugTrace.push(`[Gap Analysis] ✓ Coverage: ${gapAnalysis.coveragePercentage}%`);
      debugTrace.push(`[Gap Analysis] ✓ Missing ${gapAnalysis.missingRequired.length} required skills`);

      // Step 3: Recommend certifications
      debugTrace.push('[Certifications] Analyzing certification gaps...');
      const certRecommendations = CertificationsAnalyzer.recommendCertifications(
        gapAnalysis.missingRequired,
        extractedCertifications,
        jobRole
      );

      debugTrace.push(`[Certifications] ✓ Found ${certRecommendations.recommended.length} recommendations`);

      // Step 4: Generate learning roadmap for missing skills
      debugTrace.push('[Roadmap] Generating personalized roadmap...');
      let roadmapResult;
      try {
        roadmapResult = await generateAIRoadmap(gapAnalysis.missingRequired, debugTrace);
      } catch (error) {
        debugTrace.push(`[Roadmap] AI failed: ${error.message}`);
        roadmapResult = generateFallbackRoadmap(gapAnalysis.missingRequired);
      }

      return {
        success: true,
        resumeAnalysis: {
          source: parseResult.source,
          extractedSkills,
          extractedCertifications
        },
        gapAnalysis: {
          jobTitle: gapAnalysis.jobTitle,
          jobLevel: gapAnalysis.jobLevel,
          skillsCovered: gapAnalysis.skillsCovered,
          totalRequired: gapAnalysis.totalRequired,
          coveragePercentage: gapAnalysis.coveragePercentage,
          readinessScore: gapAnalysis.readinessScore,
          recommendation: gapAnalysis.recommendation,
          missingRequired: gapAnalysis.missingRequired,
          missingNiceToHave: gapAnalysis.missingNiceToHave
        },
        certifications: {
          current: extractedCertifications,
          recommended: certRecommendations.recommended,
          skillSpecific: certRecommendations.skill_specific,
          roleSpecific: certRecommendations.role_specific
        },
        roadmap: roadmapResult,
        debugTrace
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        debugTrace
      };
    }
  }

  /**
   * Get available job roles for analysis
   */
  static getAvailableRoles() {
    return JobDescriptionAnalyzer.getAvailableJobs();
  }

  /**
   * Get job description details
   */
  static getJobDescription(jobTitle) {
    return JobDescriptionAnalyzer.getJobDescription(jobTitle);
  }
}

module.exports = ResumeAnalysisController;
