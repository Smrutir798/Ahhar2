const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const frontendSrcDir = path.join(__dirname, '..', 'src');

walkDir(frontendSrcDir, (filePath) => {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace default axios import with custom axios instance
    // Match exactly `import axios from 'axios';` and replace with `import axios from '@/lib/axios';`
    content = content.replace(/import\s+axios\s+from\s+['"]axios['"];?/g, "import axios from '@/lib/axios';");

    // Replace `http://localhost:5000/api` with empty string or `/`
    // Since base URL is `.../api`, `http://localhost:5000/api/endpoint` -> `/endpoint`
    content = content.replace(/http:\/\/localhost:5000\/api/g, "");

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
