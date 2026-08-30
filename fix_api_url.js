const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend/src');

function findAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findAndReplace(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const searchPattern1 = /\$\{window\.location\.protocol\}\/\/\$\{window\.location\.hostname\}:5001/g;
      
      if (searchPattern1.test(content)) {
        console.log(`Updating ${fullPath}`);
        const replaceString = `\${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
        content = content.replace(searchPattern1, replaceString);
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

findAndReplace(directoryPath);
console.log('Done!');
