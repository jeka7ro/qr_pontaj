const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Split by <button and process
  const parts = content.split('<button');
  for (let i = 1; i < parts.length; i++) {
    const endTagIndex = parts[i].indexOf('>');
    if (endTagIndex !== -1) {
      let attrs = parts[i].substring(0, endTagIndex);
      attrs = attrs.replace(/rounded-(md|lg|xl)/g, 'rounded-full');
      parts[i] = attrs + parts[i].substring(endTagIndex);
    }
  }
  content = parts.join('<button');

  // Do the same for <input, <select, <textarea
  const tags = ['<input', '<select', '<textarea'];
  for (const tag of tags) {
    const partsTag = content.split(tag);
    for (let i = 1; i < partsTag.length; i++) {
      const endTagIndex = partsTag[i].indexOf('>');
      if (endTagIndex !== -1) {
        let attrs = partsTag[i].substring(0, endTagIndex);
        attrs = attrs.replace(/rounded-(md|lg|xl)/g, 'rounded-full');
        partsTag[i] = attrs + partsTag[i].substring(endTagIndex);
      }
    }
    content = partsTag.join(tag);
  }

  if (original !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

walk('src/components');
walk('src/pages');
console.log('Done.');
