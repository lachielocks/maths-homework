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
      
      // Convert "Algebra_Week_1" to "Algebra Week 1"
      const title = basename.replace(/[_-]/g, ' ');
      
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
