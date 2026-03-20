const readline = require("readline");
const { analyzeProfile } = require("../controllers/analysisController");
const ResumeAnalysisController = require("../controllers/resumeAnalysisController");
const { SkillsValidator, RoleValidator } = require("../validators");
const { SkillValidationError, RoleValidationError } = require("../exceptions");
const { log } = require("../utils/logger");
const FilePicker = require("../utils/filePicker");
const jobs = require("../../data/jobs.json");

function printDivider(char = "═") {
  console.log(char.repeat(70));
}

function printSection(title) {
  console.log("\n");
  printDivider();
  console.log(` ${title}`);
  printDivider();
}

function printKeyValue(label, value) {
  console.log(`  ${label.padEnd(22)}: ${value}`);
}

function printBulletList(items = [], prefix = "•") {
  items.forEach((item) => {
    console.log(`   ${prefix} ${item}`);
  });
}

function askValidatedChoice(rl, prompt, allowedChoices) {
  return new Promise((resolve) => {
    const ask = () => {
      rl.question(prompt, (input) => {
        const choice = input.trim();
        if (allowedChoices.includes(choice)) {
          resolve(choice);
          return;
        }

        console.log(`\n❌ Invalid choice. Please enter one of: ${allowedChoices.join(", ")}`);
        ask();
      });
    };

    ask();
  });
}

function startCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  log("Welcome to Skill Bridge CLI 🚀");

  (async () => {
    const choice = await askValidatedChoice(
      rl,
      "\nChoose input method:\n1. Manual skill entry\n2. Upload resume (PDF/TXT)\n\nEnter choice (1 or 2): ",
      ["1", "2"]
    );

    if (choice === "2") {
      handleResumeUpload(rl);
    } else {
      handleManualSkillEntry(rl);
    }
  })();
}

function handleResumeUpload(rl) {
  (async () => {
    const uploadChoice = await askValidatedChoice(
      rl,
      "\nHow would you like to select your resume?\n1. Browse files\n2. Enter file path\n\nEnter choice (1 or 2): ",
      ["1", "2"]
    );

    let resumePath;

    if (uploadChoice === "1") {
      // File browser mode
      console.log("\n📂 Browsing for resume files...");
      resumePath = await FilePicker.browseFiles(rl);

      if (!resumePath) {
        console.log("\n❌ No file selected. Exiting.");
        rl.close();
        return;
      }
    } else {
      // Manual path entry mode
      resumePath = await new Promise((resolve) => {
        const askPath = () => {
          rl.question("\nEnter path to your resume file (PDF/TXT): ", (pathInput) => {
            const trimmedPath = pathInput.trim();
            if (!trimmedPath) {
              console.log("\n❌ File path cannot be empty. Please try again.");
              askPath();
              return;
            }

            resolve(trimmedPath);
          });
        };

        askPath();
      });
    }

    // Show file info
    const fileInfo = FilePicker.getFileInfo(resumePath);
    if (fileInfo) {
      console.log(`\n✓ Selected: ${fileInfo.name} (${fileInfo.sizeKB}KB)`);
    }

    // Ask for target role
    rl.question("\nEnter target role: ", async (roleInput) => {
      try {
        if (!roleInput || !roleInput.trim()) {
          console.error("\n❌ Target role cannot be empty.");
          rl.close();
          return;
        }

        // Validate role
        let userRole;
        try {
          userRole = RoleValidator.validate(roleInput, jobs);
        } catch (error) {
          console.error("\n❌", error.message);
          rl.close();
          return;
        }

        console.log(`\n✓ Role selected: ${userRole}\n`);
        console.log("📊 Analyzing resume...\n");

        // Analyze resume
        const result = await ResumeAnalysisController.analyzeResumeForRole(resumePath, userRole);

        if (!result.success) {
          console.error("\n❌ Analysis Error:", result.error);
          if (result.availableJobs) {
            console.log("\nAvailable job roles:");
            result.availableJobs.slice(0, 10).forEach((job, idx) => {
              console.log(`  ${idx + 1}. ${job}`);
            });
          }
          rl.close();
          return;
        }

        printSection("📄 RESUME ANALYSIS");
        printKeyValue("Source", result.resumeAnalysis.source.toUpperCase());
        printKeyValue("Extracted Skills", result.resumeAnalysis.extractedSkills.length);
        console.log("\n  Skills:");
        printBulletList(result.resumeAnalysis.extractedSkills);
        if (result.resumeAnalysis.extractedCertifications.length > 0) {
          console.log("\n  Certifications:");
          printBulletList(result.resumeAnalysis.extractedCertifications, "✓");
        }

        printSection("🧠 GAP ANALYSIS");
        printKeyValue("Target Role", `${result.gapAnalysis.jobTitle} (${result.gapAnalysis.jobLevel})`);
        printKeyValue("Skills Coverage", `${result.gapAnalysis.coveragePercentage}% (${result.gapAnalysis.skillsCovered}/${result.gapAnalysis.totalRequired})`);
        printKeyValue("Readiness", result.gapAnalysis.readinessScore);
        console.log(`\n  💡 Recommendation: ${result.gapAnalysis.recommendation}`);
        
        if (result.gapAnalysis.missingRequired.length > 0) {
          console.log(`\n  Missing Required Skills (${result.gapAnalysis.missingRequired.length}):`);
          printBulletList(result.gapAnalysis.missingRequired);
        }

        if (result.gapAnalysis.missingNiceToHave.length > 0) {
          console.log(`\n  Missing Nice-to-Have Skills (${result.gapAnalysis.missingNiceToHave.length}):`);
          printBulletList(result.gapAnalysis.missingNiceToHave);
        }

        if (result.certifications.recommended.length > 0) {
          printSection("🎓 CERTIFICATION RECOMMENDATIONS");
          result.certifications.recommended.forEach((rec, idx) => {
            console.log(`\n  ${idx + 1}. ${rec.skill || rec.certification.name}`);
            if (rec.certifications) {
              rec.certifications.forEach(cert => {
                console.log(`     • ${cert.name} (${cert.level}, ${cert.duration}, ${cert.cost})`);
              });
            } else if (rec.certification) {
              console.log(`     • ${rec.certification.name} (${rec.certification.level}, ${rec.certification.duration})`);
            }
          });
        }

        if (result.resumeAnalysis.extractedCertifications.length > 0) {
          printSection("✅ YOUR CERTIFICATIONS");
          result.resumeAnalysis.extractedCertifications.forEach(cert => {
            console.log(`  ✓ ${cert}`);
          });
        }

        printSection("🗺️ LEARNING ROADMAP");
        if (Array.isArray(result.roadmap)) {
          result.roadmap.forEach((item) => {
            console.log(`\n  Step ${item.step}  |  ${item.level}  |  ${item.category}`);
            console.log(`   • Skill : ${item.skill}`);
            console.log(`   • Plan  : ${item.plan}`);
          });
        } else if (result.roadmap) {
          console.log(`  ${result.roadmap}`);
        }

        if (result.debugTrace && result.debugTrace.length > 0) {
          printSection("🛠️ DEBUG TRACE");
          result.debugTrace.forEach(line => console.log(`  ${line}`));
        }

        console.log("\n✨ Analysis complete. Keep building, keep growing!\n");
        printDivider();

      } catch (error) {
        console.error("\n❌ Unexpected error:", error.message);
      } finally {
        rl.close();
      }
    });
  })();
}

function handleManualSkillEntry(rl) {
  rl.question("Enter your skills (comma separated): ", (skillsInput) => {
    // Validate skills input immediately
    let userSkills;
    try {
      userSkills = SkillsValidator.validate(skillsInput);
    } catch (error) {
      if (error instanceof SkillValidationError) {
        console.error(error.message);
      } else {
        console.error("\n❌ Unexpected error during skill validation:", error.message);
      }
      rl.close();
      return;
    }

    console.log(`\n✓ Registered ${userSkills.length} skill(s): ${userSkills.join(", ")}\n`);

    rl.question("Enter target role: ", async (roleInput) => {
      // Validate role input immediately
      let userRole;
      try {
        userRole = RoleValidator.validate(roleInput, jobs);
      } catch (error) {
        if (error instanceof RoleValidationError) {
          console.error(error.message);
        } else {
          console.error("\n❌ Unexpected error during role validation:", error.message);
        }
        rl.close();
        return;
      }

      console.log(`\n✓ Role selected: ${userRole}\n`);

      try {
        const result = await analyzeProfile(userSkills, userRole);

        printSection("📊 ANALYSIS RESULT");
        printKeyValue("Roadmap Source", result.roadmapSource);
        printKeyValue("Status", result.roadmapMessage);

        console.log("\n  Missing Skills:");
        if (Array.isArray(result.missingSkills) && result.missingSkills.length > 0) {
          printBulletList(result.missingSkills);
        } else {
          console.log("   ✓ No missing skills detected");
        }

        printSection("🗺️ ROADMAP");
        if (Array.isArray(result.roadmap)) {
          result.roadmap.forEach((item) => {
            console.log(`\n  Step ${item.step}  |  ${item.level}  |  ${item.category}`);
            console.log(`   • Skill : ${item.skill}`);
            console.log(`   • Plan  : ${item.plan}`);
          });
        } else {
          console.log(`  ${result.roadmap}`);
        }

        if (result.roadmapDiagram) {
          printSection("🔀 ROADMAP FLOW (ASCII)");
          console.log(result.roadmapDiagram.ascii);
        }

        if (Array.isArray(result.debugTrace) && result.debugTrace.length > 0) {
          printSection("🛠️ DEBUG TRACE");
          result.debugTrace.forEach((line) => console.log(`  ${line}`));
        }

        console.log("\n✨ Analysis complete. Keep building, keep growing!\n");
        printDivider();

      } catch (error) {
        console.error("\n❌ Analysis Error:", error.message);
      } finally {
        rl.close();
      }
    });
  });
}


module.exports = { startCLI };