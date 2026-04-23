const fs = require('fs');
const path = require('path');

const HOMEWORK_DIR = path.join(__dirname, 'homework');
const OUTPUT_FILE = path.join(__dirname, 'data.json');

// Supported image extensions
const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);

function buildData() {
  console.log('Scanning homework directory...');
  
  if (!fs.existsSync(HOMEWORK_DIR)) {
    console.error(`Directory not found: ${HOMEWORK_DIR}`);
    // Create it to be safe
    fs.mkdirSync(HOMEWORK_DIR, { recursive: true });
  }

  const files = fs.readdirSync(HOMEWORK_DIR);
  
  const images = files
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return VALID_EXTENSIONS.has(ext);
    })
    .map(file => {
      const stats = fs.statSync(path.join(HOMEWORK_DIR, file));
      const ext = path.extname(file);
      const basename = path.basename(file, ext);
      // Format the title to be nicely capitalized, e.g., "exercise_5a" -> "Exercise 5A"
      const title = basename
        .replace(/[_-]/g, ' ')
        .split(/\s+/)
        .map(word => {
          if (!word) return word;
          let cap = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          return cap.replace(/(\d)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
        })
        .join(' ');
      return {
        filename: file,
        path: `homework/${file}`,
        title: title,
        mtime: stats.mtime.getTime() // used for sorting (newest first)
      };
    })
    .sort((a, b) => b.mtime - a.mtime); // Sort newest to oldest

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(images, null, 2));
  console.log(`Generated data.json with ${images.length} images.`);
}

buildData();
