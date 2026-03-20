/**
 * Certifications Analyzer Service
 * Recommends relevant certifications based on skills and job role
 */

class CertificationsAnalyzer {
  static CERTIFICATIONS_BY_SKILL = {
    'AWS': [
      { name: 'AWS Solutions Architect Associate', level: 'Associate', duration: '3 months', cost: '$150' },
      { name: 'AWS Developer Associate', level: 'Associate', duration: '3 months', cost: '$150' },
      { name: 'AWS Solutions Architect Professional', level: 'Professional', duration: '6 months', cost: '$300' }
    ],
    'Azure': [
      { name: 'Azure Administrator Associate', level: 'Associate', duration: '3 months', cost: '$165' },
      { name: 'Azure Solutions Architect Expert', level: 'Expert', duration: '6 months', cost: '$165' }
    ],
    'Kubernetes': [
      { name: 'CKA (Certified Kubernetes Administrator)', level: 'Professional', duration: '3 months', cost: '$395' },
      { name: 'CKAD (Certified Kubernetes Application Developer)', level: 'Professional', duration: '2 months', cost: '$395' }
    ],
    'Docker': [
      { name: 'Docker Certified Associate', level: 'Associate', duration: '2 months', cost: '$295' }
    ],
    'Java': [
      { name: 'Oracle Certified Associate Java Programmer', level: 'Associate', duration: '2 months', cost: '$245' },
      { name: 'Oracle Certified Professional Java Programmer', level: 'Professional', duration: '4 months', cost: '$245' }
    ],
    'Python': [
      { name: 'PCEP – Python Certified Entry Level Programmer', level: 'Entry', duration: '1 month', cost: '$59' },
      { name: 'PCAP – Python Certified Associate Programmer', level: 'Associate', duration: '2 months', cost: '$225' }
    ],
    'Security': [
      { name: 'CompTIA Security+', level: 'Associate', duration: '3 months', cost: '$370' },
      { name: 'CISSP', level: 'Professional', duration: '6+ months', cost: '$749' },
      { name: 'CEH (Certified Ethical Hacker)', level: 'Professional', duration: '4 months', cost: '$1000' }
    ],
    'Cloud': [
      { name: 'Cloud+ by CompTIA', level: 'Associate', duration: '2 months', cost: '$370' }
    ],
    'Agile': [
      { name: 'Certified Scrum Master (CSM)', level: 'Professional', duration: '2 days', cost: '$395' },
      { name: 'Certified Scrum Product Owner (CSPO)', level: 'Professional', duration: '2 days', cost: '$395' }
    ],
    'SQL': [
      { name: 'Microsoft SQL Server Certification', level: 'Associate', duration: '2 months', cost: '$165' }
    ],
    'Machine Learning': [
      { name: 'TensorFlow Developer Certificate', level: 'Professional', duration: '3 months', cost: '$100' },
      { name: 'AWS Certified Machine Learning – Specialty', level: 'Specialty', duration: '4 months', cost: '$300' }
    ]
  };

  static ROLE_RECOMMENDED_CERTIFICATIONS = {
    'Backend Developer': ['AWS', 'Docker', 'Kubernetes', 'Java'],
    'Frontend Developer': ['Cloud'],
    'Full Stack Developer': ['AWS', 'Docker', 'Cloud'],
    'DevOps Engineer': ['AWS', 'Azure', 'Kubernetes', 'Docker', 'Cloud+'],
    'Cloud Engineer': ['AWS', 'Azure', 'Cloud+'],
    'Data Engineer': ['AWS', 'Python'],
    'Data Scientist': ['Python', 'Machine Learning'],
    'Java Developer': ['Java', 'AWS'],
    'Python Developer': ['Python', 'AWS'],
    'Security Engineer': ['Security', 'CompTIA Security+'],
    'Solutions Architect': ['AWS', 'Cloud+'],
    'QA Engineer': ['Agile'],
    'Mobile Developer (iOS)': ['Cloud'],
    'Mobile Developer (Android)': ['Cloud']
  };

  /**
   * Recommend certifications based on missing skills and role
   */
  static recommendCertifications(missingSkills, currentCertifications, jobRole) {
    const recommendations = {
      recommended: [],
      already_have: [],
      skill_specific: [],
      role_specific: []
    };

    // Get role-specific recommendations
    const roleRecommended = this.ROLE_RECOMMENDED_CERTIFICATIONS[jobRole] || [];

    // Check each missing skill
    missingSkills.forEach(skill => {
      const certs = this.CERTIFICATIONS_BY_SKILL[skill];
      if (certs) {
        // Filter out certifications user already has
        const availableCerts = certs.filter(cert => 
          !currentCertifications.some(current => 
            current.toLowerCase().includes(cert.name.toLowerCase())
          )
        );

        if (availableCerts.length > 0) {
          recommendations.skill_specific.push({
            skill,
            certifications: availableCerts.slice(0, 2) // Top 2 per skill
          });
        }
      }
    });

    // Role-specific certifications
    roleRecommended.forEach(skillName => {
      const certs = this.CERTIFICATIONS_BY_SKILL[skillName];
      if (certs) {
        const topCert = certs[0];
        if (!currentCertifications.some(current => 
          current.toLowerCase().includes(topCert.name.toLowerCase())
        )) {
          recommendations.role_specific.push({
            skill: skillName,
            certification: topCert
          });
        }
      }
    });

    // Combine and prioritize
    recommendations.recommended = this.prioritizeCertifications(
      recommendations.skill_specific,
      recommendations.role_specific
    );

    return recommendations;
  }

  /**
   * Prioritize certifications by impact and difficulty
   */
  static prioritizeCertifications(skillSpecific, roleSpecific) {
    const combined = [];

    // Add skill-specific first (higher priority)
    skillSpecific.forEach(item => {
      combined.push({
        type: 'skill-specific',
        skill: item.skill,
        certifications: item.certifications,
        priority: 1
      });
    });

    // Add role-specific next
    roleSpecific.forEach(item => {
      combined.push({
        type: 'role-specific',
        skill: item.skill,
        certification: item.certification,
        priority: 2
      });
    });

    return combined.slice(0, 5); // Top 5 recommendations
  }

  /**
   * Get certification details
   */
  static getCertificationDetails(certName) {
    for (const [skill, certs] of Object.entries(this.CERTIFICATIONS_BY_SKILL)) {
      const found = certs.find(c => c.name.toLowerCase() === certName.toLowerCase());
      if (found) {
        return { skill, ...found };
      }
    }
    return null;
  }

  /**
   * Get all available certifications
   */
  static getAllCertifications() {
    const allCerts = [];
    Object.entries(this.CERTIFICATIONS_BY_SKILL).forEach(([skill, certs]) => {
      certs.forEach(cert => {
        allCerts.push({ skill, ...cert });
      });
    });
    return allCerts;
  }

  /**
   * Calculate certification ROI (Return on Investment)
   */
  static calculateROI(certificationsCompleted, skillsGained) {
    const avgCost = 250; // Average cost per cert
    const totalCost = certificationsCompleted * avgCost;
    const skillValue = skillsGained * 5000; // Estimated salary boost per skill
    
    return {
      totalInvestment: totalCost,
      potentialIncome: skillValue,
      roi: ((skillValue - totalCost) / totalCost * 100).toFixed(2) + '%'
    };
  }
}

module.exports = CertificationsAnalyzer;
