const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * File Picker Utility
 * Provides file browsing and selection capabilities for CLI
 */

class FilePicker {
  /**
   * Get resume files from common directories
   */
  static getAvailableResumes() {
    const searchPaths = [
      process.cwd(),
      path.join(process.cwd(), 'data'),
      path.join(process.cwd(), 'resumes'),
      path.join(process.env.HOME || process.env.USERPROFILE, 'Desktop'),
      path.join(process.env.HOME || process.env.USERPROFILE, 'Documents')
    ];

    const resumeFiles = [];
    const extensions = ['.pdf', '.txt', '.md'];

    for (const dir of searchPaths) {
      if (!fs.existsSync(dir)) continue;

      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const ext = path.extname(file).toLowerCase();
          if (!extensions.includes(ext)) continue;

          const fullPath = path.join(dir, file);
          const stats = fs.statSync(fullPath);
          
          if (stats.isFile()) {
            // Check if file not already in list
            const exists = resumeFiles.some(f => f.path === fullPath);
            if (!exists) {
              resumeFiles.push({
                name: file,
                path: fullPath,
                dir: dir,
                size: stats.size
              });
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }

    // Sort by modification time (newest first)
    return resumeFiles.sort((a, b) => b.size - a.size);
  }

  /**
   * Interactive file browser in CLI
   */
  static async browseFiles(rl) {
    const resumeFiles = this.getAvailableResumes();

    if (resumeFiles.length === 0) {
      console.log('\n❌ No resume files found in common directories.');
      console.log('   Searched in:');
      console.log('   • Current directory');
      console.log('   • data/');
      console.log('   • resumes/');
      console.log('   • Desktop/');
      console.log('   • Documents/\n');
      return null;
    }

    console.log('\n📁 AVAILABLE RESUMES:\n');
    resumeFiles.forEach((file, idx) => {
      const sizeKB = (file.size / 1024).toFixed(1);
      console.log(`${idx + 1}. ${file.name} (${sizeKB}KB)`);
      console.log(`   📍 ${file.path}`);
    });

    console.log(`\n${resumeFiles.length + 1}. Enter custom path`);
    console.log(`${resumeFiles.length + 2}. Cancel\n`);

    return new Promise((resolve) => {
      rl.question('Select a file (or enter number): ', (answer) => {
        const choice = parseInt(answer);

        if (isNaN(choice) || choice < 1 || choice > resumeFiles.length + 2) {
          console.log('❌ Invalid selection');
          resolve(null);
          return;
        }

        if (choice === resumeFiles.length + 2) {
          // Cancel
          resolve(null);
          return;
        }

        if (choice === resumeFiles.length + 1) {
          // Custom path
          rl.question('\nEnter path to resume file: ', (customPath) => {
            const normalizedPath = customPath.trim();
            if (fs.existsSync(normalizedPath)) {
              resolve(normalizedPath);
            } else {
              console.log(`❌ File not found: ${normalizedPath}`);
              resolve(null);
            }
          });
          return;
        }

        // Selected file
        resolve(resumeFiles[choice - 1].path);
      });
    });
  }

  /**
   * Show recently accessed resume files
   */
  static getRecentResumes(limit = 5) {
    const resumeFiles = this.getAvailableResumes();
    return resumeFiles.slice(0, limit);
  }

  /**
   * Get file info
   */
  static getFileInfo(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();

      return {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(1),
        type: ext.slice(1).toUpperCase(),
        modified: stats.mtime,
        exists: true
      };
    } catch (error) {
      return null;
    }
  }
}

module.exports = FilePicker;
