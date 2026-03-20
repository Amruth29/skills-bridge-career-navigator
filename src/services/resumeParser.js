const fs = require('fs');
const path = require('path');
const jobsCatalog = require('../../data/jobs.json');
const JobDescriptionAnalyzer = require('./jobDescriptionAnalyzer');

/**
 * Resume Parser Service
 * Extracts skills and certifications from PDF or text content
 */

class ResumeParser {
  static SKILL_CATALOG_CACHE = null;

  static ACRONYM_MAP = {
    ai: 'AI',
    nlp: 'NLP',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    aws: 'AWS',
    gcp: 'GCP',
    ci_cd: 'CI/CD',
    owasp: 'OWASP',
    junit: 'JUnit',
    jira: 'JIRA',
    figma: 'Figma'
  };

  static SKILL_PATTERNS = {
    // Frontend core
    'HTML': [/\bhtml5?\b/i, /\bhyper\s*text\s*markup\s*language\b/i],
    'CSS': [/\bcss3?\b/i, /\bcascading\s*style\s*sheets?\b/i],
    'JavaScript': [/\bjavascript\b/i, /\bjs\b/i, /\becmascript\b/i],
    'TypeScript': [/\btypescript\b/i, /\bts\b/i],
    'React': [/\breact(?:\.js)?\b/i],
    'Angular': [/\bangular(?:\.js)?\b/i],
    'Vue': [/\bvue(?:\.js)?\b/i],
    'Next.js': [/\bnext\.?js\b/i],
    'DOM Manipulation': [/\bdom\b/i, /\bdom\s+manipulation\b/i, /\bqueryselector\b/i, /\baddeventlistener\b/i],
    'Responsive Design': [/\bresponsive\s+(web\s+)?design\b/i, /\bmedia\s+queries?\b/i, /\bmobile[-\s]?first\b/i],

    // Backend and APIs
    'Node.js': [/\bnode\.?js\b/i],
    'Express': [/\bexpress(?:\.js)?\b/i],
    'Django': [/\bdjango\b/i],
    'Flask': [/\bflask\b/i],
    'Spring Boot': [/\bspring\s*boot\b/i],
    'FastAPI': [/\bfastapi\b/i],
    'REST API': [/\brest(?:ful)?\s+apis?\b/i, /\bapi\s+development\b/i],
    'GraphQL': [/\bgraphql\b/i],
    'Authentication': [/\bauthentication\b/i, /\bauthorization\b/i, /\boauth2?\b/i, /\bjwt\b/i],

    // Languages
    'Python': [/\bpython\b/i],
    'Java': [/\bjava\b/i],
    'C++': [/\bc\+\+\b/i],
    'C#': [/\bc#\b/i, /\bcsharp\b/i],
    'Go': [/\bgo(lang)?\b/i],
    'Rust': [/\brust\b/i],
    'Ruby': [/\bruby\b/i],
    'PHP': [/\bphp\b/i],
    'Swift': [/\bswift\b/i],
    'Kotlin': [/\bkotlin\b/i],

    // Data and DB
    'MongoDB': [/\bmongodb\b/i],
    'PostgreSQL': [/\bpostgres(?:ql)?\b/i],
    'MySQL': [/\bmysql\b/i],
    'SQL': [/\bsql\b/i],
    'Redis': [/\bredis\b/i],
    'Pandas': [/\bpandas\b/i],
    'NumPy': [/\bnumpy\b/i],
    'Data Visualization': [/\bdata\s+visualization\b/i, /\btableau\b/i, /\bpower\s*bi\b/i],

    // DevOps / Cloud / Infra
    'Git': [/\bgit\b/i],
    'Docker': [/\bdocker\b/i],
    'Kubernetes': [/\bkubernetes\b/i, /\bk8s\b/i],
    'AWS': [/\baws\b/i, /\bamazon\s+web\s+services\b/i],
    'Azure': [/\bazure\b/i],
    'GCP': [/\bgcp\b/i, /\bgoogle\s+cloud\b/i],
    'Linux': [/\blinux\b/i],
    'Terraform': [/\bterraform\b/i],
    'Ansible': [/\bansible\b/i],
    'CI/CD': [/\bci\/cd\b/i, /\bcontinuous\s+integration\b/i, /\bcontinuous\s+deployment\b/i],

    // Other role keywords
    'Testing': [/\btesting\b/i, /\bunit\s+test(?:ing)?\b/i, /\bselenium\b/i, /\bjunit\b/i],
    'Machine Learning': [/\bmachine\s+learning\b/i, /\bml\b/i],
    'TensorFlow': [/\btensorflow\b/i],
    'PyTorch': [/\bpytorch\b/i],
    'Security': [/\bsecurity\b/i, /\bowasp\b/i, /\bpenetration\s+testing\b/i],
    'System Design': [/\bsystem\s+design\b/i, /\barchitecture\s+patterns?\b/i],
    'Network': [/\bnetwork(?:ing)?\b/i]
  };

  static CERTIFICATION_PATTERNS = {
    'AWS Solutions Architect': [/\baws\s+solutions\s+architect\b/i, /\baws\s+saa\b/i],
    'AWS Developer Associate': [/\baws\s+developer\s+associate\b/i],
    'AWS DevOps Engineer': [/\baws\s+devops\s+engineer\b/i],
    'Azure Administrator': [/\bazure\s+administrator\b/i],
    'Azure Solutions Architect': [/\bazure\s+solutions\s+architect\b/i],
    'Azure Developer Associate': [/\bazure\s+developer\s+associate\b/i],
    'GCP Associate Cloud Engineer': [/\bgcp\s+associate\s+cloud\s+engineer\b/i, /\bgoogle\s+cloud\s+associate\s+cloud\s+engineer\b/i],
    'GCP Professional': [/\bgcp\s+professional\b/i, /\bgoogle\s+cloud\s+professional\b/i],
    'CKA': [/\bcka\b/i, /\bcertified\s+kubernetes\s+administrator\b/i],
    'CKAD': [/\bckad\b/i, /\bcertified\s+kubernetes\s+application\s+developer\b/i],
    'Docker Certified Associate': [/\bdocker\s+certified\s+associate\b/i],
    'CompTIA Security+': [/\bcomptia\s+security\+\b/i],
    'CEH': [/\bceh\b/i, /\bcertified\s+ethical\s+hacker\b/i],
    'CISSP': [/\bcissp\b/i],
    'OSCP': [/\bocsp\b/i, /\boscp\b/i],
    'Scrum Master': [/\bscrum\s+master\b/i],
    'Certified Scrum': [/\bcertified\s+scrum\b/i],
    'Product Owner': [/\bproduct\s+owner\b/i],
    'Oracle Certified': [/\boracle\s+certified\b/i],
    'Salesforce': [/\bsalesforce\b/i],
    'SAP Certified': [/\bsap\s+certified\b/i],
    'Tableau': [/\btableau\b/i],
    'Bachelor': [/\bbachelor\b/i, /\bb\.?tech\b/i, /\bb\.?e\b/i, /\bb\.?sc\b/i],
    'Masters': [/\bmaster\w*\b/i, /\bm\.?tech\b/i, /\bm\.?s\.?c\b/i],
    'PhD': [/\bph\.?d\b/i]
  };

  static normalizeSearchText(text) {
    return String(text || '')
      .replace(/\u00A0/g, ' ')
      .replace(/[•●▪◦·]/g, ' ')
      .replace(/[\r\t]/g, ' ')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static toDisplaySkill(rawSkill) {
    const value = String(rawSkill || '').trim();
    if (!value) {
      return value;
    }

    const key = value.toLowerCase().replace(/[\s/]+/g, '_');
    if (this.ACRONYM_MAP[key]) {
      return this.ACRONYM_MAP[key];
    }

    return value;
  }

  static escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static buildFlexibleTermRegex(term) {
    const escaped = this.escapeRegex(String(term || '').trim().toLowerCase());
    if (!escaped) {
      return null;
    }

    const flexible = escaped
      .replace(/\\\//g, '[\\s\\/\\-]+')
      .replace(/\\\./g, '[\\s\\.]?')
      .replace(/\\\+/g, '\\\\+')
      .replace(/\s+/g, '[\\s\\-_/]*');

    return new RegExp(`\\b${flexible}\\b`, 'i');
  }

  static getSkillCatalog() {
    if (Array.isArray(this.SKILL_CATALOG_CACHE) && this.SKILL_CATALOG_CACHE.length > 0) {
      return this.SKILL_CATALOG_CACHE;
    }

    const skills = new Set(Object.keys(this.SKILL_PATTERNS));

    (jobsCatalog || []).forEach((roleDef) => {
      Object.values(roleDef?.skillCategories || {}).forEach((arr) => {
        if (Array.isArray(arr)) {
          arr.forEach((skill) => skills.add(String(skill).trim()));
        }
      });
    });

    Object.values(JobDescriptionAnalyzer?.JOB_DESCRIPTIONS || {}).forEach((jobDesc) => {
      (jobDesc?.required_skills || []).forEach((skill) => skills.add(String(skill).trim()));
      (jobDesc?.nice_to_have || []).forEach((skill) => skills.add(String(skill).trim()));
    });

    this.SKILL_CATALOG_CACHE = Array.from(skills).filter(Boolean);
    return this.SKILL_CATALOG_CACHE;
  }

  static shuffleArray(values) {
    const arr = [...values];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  static tokenizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9+#/.\-\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  static inferSkillsFromTextHeuristics(rawText) {
    const text = this.normalizeSearchText(rawText);
    const textTokens = new Set(this.tokenizeText(text));
    const candidates = [];

    this.getSkillCatalog().forEach((skill) => {
      const normalizedSkill = String(skill || '').trim();
      if (!normalizedSkill) {
        return;
      }

      const matcher = this.buildFlexibleTermRegex(normalizedSkill);
      if (matcher && matcher.test(text)) {
        candidates.push({ skill: this.toDisplaySkill(normalizedSkill), score: 100 });
        return;
      }

      const parts = this.tokenizeText(normalizedSkill);
      if (parts.length === 0) {
        return;
      }

      let overlap = 0;
      parts.forEach((part) => {
        if (textTokens.has(part)) {
          overlap += 1;
        }
      });

      if (overlap > 0) {
        const score = overlap / parts.length;
        candidates.push({ skill: this.toDisplaySkill(normalizedSkill), score });
      }
    });

    const unique = new Map();
    candidates
      .sort((a, b) => b.score - a.score)
      .forEach((item) => {
        if (!unique.has(item.skill)) {
          unique.set(item.skill, item.score);
        }
      });

    return Array.from(unique.keys());
  }

  static getRandomSkillHints(minCount = 2, maxCount = 3) {
    const safeMin = Math.max(1, Math.floor(minCount));
    const safeMax = Math.max(safeMin, Math.floor(maxCount));
    const count = Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
    const pool = [
      'JavaScript',
      'React',
      'Node.js',
      'HTML',
      'CSS',
      'Git',
      'SQL',
      'Python',
      'MongoDB',
      'Docker',
      'REST API',
      'Responsive Design',
      'DOM Manipulation'
    ];

    return this.shuffleArray(pool).slice(0, count);
  }

  /**
   * Extract skills from resume text
   * Looks for common skill keywords and patterns
   */
  static extractSkillsFromText(resumeText) {
    const text = String(resumeText || "");
    const normalizedText = this.normalizeSearchText(text);
    const foundSkills = new Set();

    Object.entries(this.SKILL_PATTERNS).forEach(([canonicalSkill, patterns]) => {
      if (patterns.some(pattern => pattern.test(text) || pattern.test(normalizedText))) {
        foundSkills.add(canonicalSkill);
      }
    });

    // Backward compatibility for common raw mentions not yet covered above
    const lowerText = normalizedText.toLowerCase();
    const fallbackRawMatches = [
      'webpack',
      'babel',
      'svelte',
      'tailwind',
      'rails',
      '.net',
      'dotnet',
      'sqlite',
      'cassandra',
      'elasticsearch',
      'dynamodb',
      'oracle',
      'gitlab',
      'github',
      'jenkins',
      'circleci',
      'jira',
      'windows',
      'macos',
      'postman',
      'ai',
      'data science',
      'nlp',
      'computer vision',
      'blockchain',
      'web3',
      'agile',
      'scrum'
    ];

    fallbackRawMatches.forEach((skill) => {
      if (lowerText.includes(skill)) {
        if (skill === 'github' || skill === 'gitlab') {
          foundSkills.add('Git');
        } else {
          foundSkills.add(this.toDisplaySkill(skill.charAt(0).toUpperCase() + skill.slice(1)));
        }
      }
    });

    // Role-aligned catalog matching (skills, tools, technologies)
    this.getSkillCatalog().forEach((term) => {
      const matcher = this.buildFlexibleTermRegex(term);
      if (matcher && matcher.test(normalizedText)) {
        foundSkills.add(this.toDisplaySkill(term));
      }
    });

    return Array.from(foundSkills).sort();
  }

  /**
   * Extract certifications from resume text
   */
  static extractCertificationsFromText(resumeText) {
    const text = this.normalizeSearchText(resumeText);
    const found = new Set();

    Object.entries(this.CERTIFICATION_PATTERNS).forEach(([certName, patterns]) => {
      if (patterns.some((pattern) => pattern.test(text))) {
        found.add(certName);
      }
    });

    // Generic certification phrase matcher
    const genericCertRegex = /\b((aws|azure|gcp|google\s+cloud|oracle|scrum|kubernetes|docker|comptia|cissp|ceh|oscp|salesforce|sap|tableau)[^\n.]{0,60}?(certification|certified|certificate|associate|professional|master))\b/gi;
    const genericMatches = text.match(genericCertRegex) || [];
    genericMatches.forEach((match) => found.add(match.trim()));

    return Array.from(found);
  }

  /**
   * Parse plain text resume
   */
  static parseTextResume(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        success: true,
        text: content,
        skills: this.extractSkillsFromText(content),
        certifications: this.extractCertificationsFromText(content),
        source: 'text'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read resume: ${error.message}`
      };
    }
  }

  /**
   * Parse PDF resume using pdf-parse
   */
  static async parsePdfResume(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `Resume file not found: ${filePath}`
        };
      }

      const pdfParseModule = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      let extractedText = '';
      let parserApiSupported = false;

      // pdf-parse v2: class-based API
      if (typeof pdfParseModule?.PDFParse === 'function') {
        parserApiSupported = true;
        const parser = new pdfParseModule.PDFParse({ data: buffer });
        try {
          const pdfData = await parser.getText();
          extractedText = String(pdfData?.text || '').trim();
        } finally {
          if (typeof parser.destroy === 'function') {
            await parser.destroy();
          }
        }
      }

      // pdf-parse v1: function API
      if (!extractedText && typeof pdfParseModule === 'function') {
        parserApiSupported = true;
        const pdfData = await pdfParseModule(buffer);
        extractedText = String(pdfData?.text || '').trim();
      }

      if (!parserApiSupported) {
        return {
          success: false,
          error: 'Unable to parse PDF text. The installed pdf-parse version may be incompatible.'
        };
      }

      if (!extractedText) {
        return {
          success: false,
          error: 'Unable to extract text from PDF. Please use a text-based PDF (not scanned image).'
        };
      }

      return {
        success: true,
        text: extractedText,
        skills: (() => {
          const extractedSkills = this.extractSkillsFromText(extractedText);
          if (extractedSkills.length >= 2) {
            return extractedSkills;
          }

          const inferred = this.inferSkillsFromTextHeuristics(extractedText)
            .filter((skill) => !extractedSkills.includes(skill))
            .slice(0, 3);

          const merged = Array.from(new Set([...extractedSkills, ...inferred]));
          if (merged.length >= 2) {
            return merged;
          }

          // Last-resort fallback requested for sparse/non-parseable resumes:
          // show a small varying hint-set instead of always identical skills.
          return this.getRandomSkillHints(2, 3);
        })(),
        certifications: this.extractCertificationsFromText(extractedText),
        source: 'pdf'
      };
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND' || String(error.message).toLowerCase().includes('cannot find module')) {
        return {
          success: false,
          error: 'PDF parser dependency missing. Install with: npm install pdf-parse'
        };
      }

      return {
        success: false,
        error: `Failed to parse PDF: ${error.message}`
      };
    }
  }

  /**
   * Main entry point - detect file type and parse accordingly
   */
  static async parseResume(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      return this.parsePdfResume(filePath);
    } else if (ext === '.txt' || ext === '.md') {
      return this.parseTextResume(filePath);
    } else {
      return {
        success: false,
        error: `Unsupported file format: ${ext}. Supported: .pdf, .txt, .md`
      };
    }
  }
}

module.exports = ResumeParser;
