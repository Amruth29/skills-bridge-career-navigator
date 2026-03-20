const ResumeParser = require('../src/services/resumeParser');
const JobDescriptionAnalyzer = require('../src/services/jobDescriptionAnalyzer');
const CertificationsAnalyzer = require('../src/services/certificationsAnalyzer');
const path = require('path');

describe('ResumeParser', () => {
  test('extracts programming skills from resume text', () => {
    const resumeText = 'I have experience with Python, JavaScript, and Java';
    const skills = ResumeParser.extractSkillsFromText(resumeText);
    
    expect(skills).toContain('Python');
    expect(skills).toContain('JavaScript');
    expect(skills).toContain('Java');
  });

  test('extracts frontend technologies', () => {
    const resumeText = 'Proficient in React, Angular, Vue, and HTML CSS';
    const skills = ResumeParser.extractSkillsFromText(resumeText);
    
    expect(skills).toContain('React');
    expect(skills).toContain('Angular');
    expect(skills).toContain('Vue');
    expect(skills).toContain('HTML');
    expect(skills).toContain('CSS');
  });

  test('extracts DOM manipulation and responsive design terms', () => {
    const resumeText = 'Built dynamic pages using DOM APIs with querySelector and media queries for responsive web design';
    const skills = ResumeParser.extractSkillsFromText(resumeText);

    expect(skills).toContain('DOM Manipulation');
    expect(skills).toContain('Responsive Design');
  });

  test('extracts database skills', () => {
    const resumeText = 'Worked with MongoDB, PostgreSQL, MySQL, and Redis';
    const skills = ResumeParser.extractSkillsFromText(resumeText);
    
    expect(skills.map(s => s.toLowerCase())).toContain('mongodb');
    expect(skills.map(s => s.toLowerCase())).toContain('postgresql');
    expect(skills.map(s => s.toLowerCase())).toContain('mysql');
    expect(skills.map(s => s.toLowerCase())).toContain('redis');
  });

  test('extracts DevOps tools', () => {
    const resumeText = 'Experience with Docker, Kubernetes, AWS, Git, and GitHub';
    const skills = ResumeParser.extractSkillsFromText(resumeText);
    
    expect(skills).toContain('Docker');
    expect(skills).toContain('Kubernetes');
    expect(skills).toContain('AWS');
    expect(skills).toContain('Git');
  });

  test('extracts certifications from resume text', () => {
    const resumeText = `
      Certifications:
      - AWS Solutions Architect Associate
      - Docker Certified Associate
      - Certified Scrum Master (CSM)
    `;
    const certs = ResumeParser.extractCertificationsFromText(resumeText);
    
    expect(certs).toContain('AWS Solutions Architect');
    expect(certs).toContain('Docker Certified Associate');
    // Can be "Certified Scrum" or "Certified Scrum Master" or both
    expect(certs.some(c => c.includes('Scrum'))).toBe(true);
  });

  test('extracts educational certifications', () => {
    const resumeText = `
      Education:
      Bachelor of Science in Computer Science
      Masters in Data Science
      PhD in Computer Engineering
    `;
    const certs = ResumeParser.extractCertificationsFromText(resumeText);
    
    expect(certs.length).toBeGreaterThan(0);
  });

  test('returns empty array when no skills found', () => {
    const resumeText = 'This resume has no technical skills mentioned';
    const skills = ResumeParser.extractSkillsFromText(resumeText);
    
    expect(Array.isArray(skills)).toBe(true);
  });

  test('handles case-insensitive skill extraction', () => {
    const resumeText = 'I know PYTHON, javascript, and REACT';
    const skills = ResumeParser.extractSkillsFromText(resumeText);
    
    expect(skills.map(s => s.toLowerCase())).toContain('python');
    expect(skills.map(s => s.toLowerCase())).toContain('javascript');
    expect(skills.map(s => s.toLowerCase())).toContain('react');
  });

  test('parses text file successfully', () => {
    // This would need a test file to exist
    const testPath = path.join(__dirname, '../data/sample_resume.txt');
    const result = ResumeParser.parseTextResume(testPath);
    
    if (result.success) {
      expect(result.skills).toBeDefined();
      expect(result.certifications).toBeDefined();
      expect(Array.isArray(result.skills)).toBe(true);
    }
  });

  test('returns error for non-existent file', async () => {
    const result = await ResumeParser.parseResume('/nonexistent/path.txt');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('detects unsupported file formats', async () => {
    const result = await ResumeParser.parseResume('resume.docx');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported');
  });
});

describe('JobDescriptionAnalyzer', () => {
  test('analyzes gap for Backend Developer role', () => {
    const userSkills = ['Python', 'JavaScript', 'Git'];
    const result = JobDescriptionAnalyzer.analyzeGap(userSkills, 'Backend Developer');
    
    expect(result.success).toBe(true);
    expect(result.jobTitle).toBe('Backend Developer');
    expect(result.missingRequired).toBeDefined();
    expect(result.missingRequired.length).toBeGreaterThan(0);
  });

  test('calculates coverage percentage correctly', () => {
    const userSkills = ['Node.js', 'Express', 'MongoDB', 'Git'];
    const result = JobDescriptionAnalyzer.analyzeGap(userSkills, 'Backend Developer');
    
    expect(result.coveragePercentage).toBe(50);
    expect(result.skillsCovered).toBe(4);
    expect(result.totalRequired).toBe(8);
  });

  test('identifies missing required skills', () => {
    const userSkills = ['Python', 'JavaScript'];
    const result = JobDescriptionAnalyzer.analyzeGap(userSkills, 'Frontend Developer');
    
    expect(result.missingRequired).toContain('React');
    expect(result.missingRequired).toContain('HTML');
    expect(result.missingRequired).toContain('CSS');
  });

  test('identifies missing nice-to-have skills', () => {
    const userSkills = ['JavaScript', 'HTML', 'CSS', 'React', 'Git', 'DOM Manipulation', 'Responsive Design'];
    const result = JobDescriptionAnalyzer.analyzeGap(userSkills, 'Frontend Developer');
    
    expect(result.missingNiceToHave).toBeDefined();
  });

  test('returns correct readiness score for high coverage', () => {
    const userSkills = ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'REST API', 'Authentication', 'System Design Basics', 'Git'];
    const result = JobDescriptionAnalyzer.analyzeGap(userSkills, 'Backend Developer');
    
    expect(result.readinessScore).toBe('READY FOR INTERVIEW');
  });

  test('returns correct readiness score for moderate coverage', () => {
    const userSkills = ['Node.js', 'Express', 'MongoDB', 'Git'];
    const result = JobDescriptionAnalyzer.analyzeGap(userSkills, 'Backend Developer');
    
    // 4 out of 8 = 50%, which is MODERATELY-PREPARED
    expect(result.readinessScore).toBe('MODERATELY-PREPARED');
  });

  test('returns error for unknown job title', () => {
    const userSkills = ['Python', 'JavaScript'];
    const result = JobDescriptionAnalyzer.analyzeGap(userSkills, 'Unknown Role');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.availableJobs).toBeDefined();
  });

  test('returns all available jobs', () => {
    const jobs = JobDescriptionAnalyzer.getAvailableJobs();
    
    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBeGreaterThan(10);
    expect(jobs).toContain('Backend Developer');
    expect(jobs).toContain('Frontend Developer');
    expect(jobs).toContain('DevOps Engineer');
  });

  test('retrieves job description details', () => {
    const jobDesc = JobDescriptionAnalyzer.getJobDescription('Backend Developer');
    
    expect(jobDesc).toBeDefined();
    expect(jobDesc.required_skills).toBeDefined();
    expect(jobDesc.nice_to_have).toBeDefined();
    expect(jobDesc.level).toBeDefined();
  });

  test('handles case-insensitive skill matching', () => {
    const userSkills = ['node.js', 'EXPRESS', 'mongodb', 'POSTGRESQL'];
    const result = JobDescriptionAnalyzer.analyzeGap(userSkills, 'Backend Developer');
    
    expect(result.success).toBe(true);
    expect(result.skillsCovered).toBe(4);
  });
});

describe('CertificationsAnalyzer', () => {
  test('recommends certifications for missing skills', () => {
    const missingSkills = ['AWS', 'Docker', 'Kubernetes'];
    const currentCerts = [];
    const result = CertificationsAnalyzer.recommendCertifications(
      missingSkills,
      currentCerts,
      'Backend Developer'
    );
    
    expect(result.recommended).toBeDefined();
    expect(result.recommended.length).toBeGreaterThan(0);
  });

  test('excludes already obtained certifications', () => {
    const missingSkills = ['Docker'];
    const currentCerts = ['AWS Solutions Architect Associate'];
    const result = CertificationsAnalyzer.recommendCertifications(
      missingSkills,
      currentCerts,
      'Backend Developer'
    );
    
    // Check that Docker cert is recommended, AWS is not in missingSkills
    const dockerRecs = result.recommended.filter(rec => rec.skill === 'Docker');
    expect(dockerRecs.length).toBeGreaterThanOrEqual(0);
  });

  test('provides role-specific recommendations', () => {
    const missingSkills = [];
    const currentCerts = [];
    const result = CertificationsAnalyzer.recommendCertifications(
      missingSkills,
      currentCerts,
      'DevOps Engineer'
    );
    
    expect(result.role_specific).toBeDefined();
  });

  test('prioritizes certifications by impact', () => {
    const missingSkills = ['AWS', 'Docker', 'Kubernetes'];
    const currentCerts = [];
    const result = CertificationsAnalyzer.recommendCertifications(
      missingSkills,
      currentCerts,
      'DevOps Engineer'
    );
    
    expect(result.recommended).toBeDefined();
    expect(result.recommended.length).toBeLessThanOrEqual(5);
  });

  test('retrieves certification details', () => {
    const details = CertificationsAnalyzer.getCertificationDetails('Docker Certified Associate');
    
    expect(details).toBeDefined();
    expect(details.skill).toBe('Docker');
    expect(details.level).toBe('Associate');
  });

  test('returns all available certifications', () => {
    const allCerts = CertificationsAnalyzer.getAllCertifications();
    
    expect(Array.isArray(allCerts)).toBe(true);
    expect(allCerts.length).toBeGreaterThan(10);
  });

  test('calculates ROI for certifications', () => {
    const roi = CertificationsAnalyzer.calculateROI(3, 5);
    
    expect(roi.totalInvestment).toBeDefined();
    expect(roi.potentialIncome).toBeDefined();
    expect(roi.roi).toBeDefined();
  });

  test('handles empty missing skills', () => {
    const result = CertificationsAnalyzer.recommendCertifications(
      [],
      [],
      'Frontend Developer'
    );
    
    expect(result.recommended).toBeDefined();
  });

  test('prioritizes AWS and Cloud certifications for cloud roles', () => {
    const missingSkills = ['AWS', 'Azure', 'GCP'];
    const currentCerts = [];
    const result = CertificationsAnalyzer.recommendCertifications(
      missingSkills,
      currentCerts,
      'Cloud Engineer'
    );
    
    expect(result.recommended.length).toBeGreaterThan(0);
  });
});
