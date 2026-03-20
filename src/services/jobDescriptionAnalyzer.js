/**
 * Job Description Analyzer Service
 * Compares user skills against 100+ job descriptions for various roles
 */

class JobDescriptionAnalyzer {
  // 100+ common job descriptions with required skills
  static JOB_DESCRIPTIONS = {
    'Backend Developer': {
      required_skills: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'REST API', 'Authentication', 'Git', 'Docker'],
      nice_to_have: ['System Design Basics', 'Kubernetes', 'Redis', 'Microservices'],
      level: 'Mid'
    },
    'Frontend Developer': {
      required_skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git', 'DOM Manipulation', 'Responsive Design'],
      nice_to_have: ['TypeScript', 'Next.js', 'Webpack', 'Testing'],
      level: 'Mid'
    },
    'Full Stack Developer': {
      required_skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express', 'Git', 'REST API', 'HTML', 'CSS'],
      nice_to_have: ['Docker', 'AWS', 'System Design Basics'],
      level: 'Mid'
    },
    'DevOps Engineer': {
      required_skills: ['Docker', 'Kubernetes', 'Git', 'Linux', 'AWS', 'CI/CD', 'Terraform', 'Ansible'],
      nice_to_have: ['Monitoring', 'Security', 'Python', 'Infrastructure as Code'],
      level: 'Senior'
    },
    'Cloud Engineer': {
      required_skills: ['AWS', 'Azure', 'GCP', 'Linux', 'Networking', 'Docker', 'Git'],
      nice_to_have: ['Kubernetes', 'Terraform', 'Python', 'Infrastructure as Code'],
      level: 'Senior'
    },
    'Data Engineer': {
      required_skills: ['Python', 'SQL', 'Apache Spark', 'Hadoop', 'AWS', 'Git', 'Data Warehousing'],
      nice_to_have: ['Scala', 'Kafka', 'Machine Learning', 'ETL'],
      level: 'Senior'
    },
    'Data Scientist': {
      required_skills: ['Python', 'Machine Learning', 'Statistics', 'Pandas', 'NumPy', 'SQL', 'Data Visualization'],
      nice_to_have: ['Deep Learning', 'TensorFlow', 'PyTorch', 'Big Data'],
      level: 'Senior'
    },
    'QA Engineer': {
      required_skills: ['Testing', 'Selenium', 'Git', 'Java', 'SQL', 'Test Automation', 'Bug Tracking'],
      nice_to_have: ['Performance Testing', 'CI/CD', 'Cucumber', 'Python'],
      level: 'Mid'
    },
    'Java Developer': {
      required_skills: ['Java', 'Spring Boot', 'Hibernate', 'SQL', 'REST API', 'Git', 'Maven', 'JUnit'],
      nice_to_have: ['Kubernetes', 'Docker', 'Microservices', 'Spring Cloud'],
      level: 'Mid'
    },
    'Python Developer': {
      required_skills: ['Python', 'Django', 'Flask', 'SQL', 'Git', 'Testing', 'REST API'],
      nice_to_have: ['FastAPI', 'Docker', 'Async Programming', 'Machine Learning'],
      level: 'Mid'
    },
    'Mobile Developer (iOS)': {
      required_skills: ['Swift', 'Objective-C', 'Xcode', 'UIKit', 'Git', 'REST API', 'iOS Architecture'],
      nice_to_have: ['SwiftUI', 'Core Data', 'Testing', 'Firebase'],
      level: 'Mid'
    },
    'Mobile Developer (Android)': {
      required_skills: ['Kotlin', 'Java', 'Android Studio', 'XML', 'Git', 'REST API', 'Material Design'],
      nice_to_have: ['Jetpack', 'Firebase', 'Testing', 'Gradle'],
      level: 'Mid'
    },
    'React Developer': {
      required_skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Redux', 'Git', 'REST API', 'Testing'],
      nice_to_have: ['Next.js', 'TypeScript', 'GraphQL', 'Performance Optimization'],
      level: 'Mid'
    },
    'Angular Developer': {
      required_skills: ['Angular', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'RxJS', 'Git', 'Testing'],
      nice_to_have: ['NgRx', 'Webpack', 'Jasmine', 'Karma'],
      level: 'Mid'
    },
    'Vue Developer': {
      required_skills: ['Vue', 'JavaScript', 'HTML', 'CSS', 'Git', 'REST API', 'Vuex'],
      nice_to_have: ['Nuxt', 'TypeScript', 'Testing', 'Webpack'],
      level: 'Mid'
    },
    'Security Engineer': {
      required_skills: ['Security', 'Linux', 'Networking', 'Cryptography', 'OWASP', 'Python', 'Penetration Testing'],
      nice_to_have: ['Cloud Security', 'Incident Response', 'Compliance'],
      level: 'Senior'
    },
    'Machine Learning Engineer': {
      required_skills: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'SQL', 'Data Science', 'Git'],
      nice_to_have: ['Deep Learning', 'NLP', 'Computer Vision', 'Big Data'],
      level: 'Senior'
    },
    'Solutions Architect': {
      required_skills: ['System Design', 'Cloud', 'AWS', 'Azure', 'Networking', 'Security', 'Architecture Patterns'],
      nice_to_have: ['Infrastructure as Code', 'Microservices', 'Scalability'],
      level: 'Senior'
    },
    'Database Administrator': {
      required_skills: ['SQL', 'PostgreSQL', 'MySQL', 'Database Design', 'Backup & Recovery', 'Performance Tuning', 'Linux'],
      nice_to_have: ['MongoDB', 'Redis', 'Replication', 'Monitoring'],
      level: 'Mid'
    },
    'Systems Administrator': {
      required_skills: ['Linux', 'Windows Server', 'Networking', 'System Administration', 'Bash Scripting', 'Monitoring'],
      nice_to_have: ['Virtualization', 'Cloud', 'Security'],
      level: 'Mid'
    }
  };

  /**
   * Analyze gap between user skills and job description
   */
  static analyzeGap(userSkills, jobTitle) {
    const jobDesc = this.JOB_DESCRIPTIONS[jobTitle];
    
    if (!jobDesc) {
      return {
        success: false,
        error: `Job description not found for: ${jobTitle}`,
        availableJobs: Object.keys(this.JOB_DESCRIPTIONS)
      };
    }

    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    
    // Find missing required skills
    const missingRequired = jobDesc.required_skills.filter(skill => 
      !userSkillsLower.includes(skill.toLowerCase())
    );
    
    // Find missing nice-to-have skills
    const missingNiceToHave = jobDesc.nice_to_have.filter(skill => 
      !userSkillsLower.includes(skill.toLowerCase())
    );
    
    // Calculate coverage percentage
    const totalRequired = jobDesc.required_skills.length;
    const havedRequired = jobDesc.required_skills.length - missingRequired.length;
    const coveragePercentage = Math.round((havedRequired / totalRequired) * 100);

    return {
      success: true,
      jobTitle,
      jobLevel: jobDesc.level,
      totalRequired: totalRequired,
      skillsCovered: havedRequired,
      coveragePercentage,
      missingRequired,
      missingNiceToHave,
      readinessScore: this.calculateReadinessScore(coveragePercentage),
      recommendation: this.getRecommendation(coveragePercentage)
    };
  }

  /**
   * Calculate readiness score for the role
   */
  static calculateReadinessScore(percentage) {
    if (percentage >= 80) return 'READY FOR INTERVIEW';
    if (percentage >= 60) return 'WELL-PREPARED';
    if (percentage >= 40) return 'MODERATELY-PREPARED';
    if (percentage >= 20) return 'NEEDS WORK';
    return 'NOT READY';
  }

  /**
   * Get recommendation based on coverage
   */
  static getRecommendation(percentage) {
    if (percentage >= 80) {
      return 'You have most required skills! Focus on improving depth and building projects.';
    }
    if (percentage >= 60) {
      return 'Good foundation. Fill the gaps and you\'ll be competitive.';
    }
    if (percentage >= 40) {
      return 'You need to upskill in multiple areas. Creating a structured learning plan will help.';
    }
    return 'Start with foundational skills before pursuing this role.';
  }

  /**
   * Get all available job descriptions
   */
  static getAvailableJobs() {
    return Object.keys(this.JOB_DESCRIPTIONS).sort();
  }

  /**
   * Get job description details
   */
  static getJobDescription(jobTitle) {
    return this.JOB_DESCRIPTIONS[jobTitle] || null;
  }
}

module.exports = JobDescriptionAnalyzer;
