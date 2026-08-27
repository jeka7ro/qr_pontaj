const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Buttons, Inputs, Selects, Textareas should be rounded-full
  // We can use a regex to find className="..." inside these tags and replace rounded-md or rounded-lg or rounded-xl with rounded-full.
  
  // A generic way: find all className strings that belong to button, input, select, textarea
  const tags = ['button', 'input', 'select', 'textarea'];
  for (const tag of tags) {
    // This is a naive but effective regex for JSX tags with classNames
    const regex = new RegExp(`<${tag}[^>]*className=["'][^"']*rounded-(md|lg|xl)[^"']*["'][^>]*>`, 'gi');
    content = content.replace(regex, (match) => {
      return match.replace(/rounded-(md|lg|xl)/g, 'rounded-full');
    });
  }

  // Cards and Modals should be rounded-2xl.
  // We can look for bg-white combined with rounded-md/lg/xl and shadow
  content = content.replace(/bg-white([^"']*)rounded-(md|lg|xl)/g, 'bg-white$1rounded-2xl');
  content = content.replace(/rounded-(md|lg|xl)([^"']*)bg-white/g, 'rounded-2xl$2bg-white');
  
  // Specific fix for the search bar which might be just a div wrapping an input
  content = content.replace(/className="relative([^"']*)rounded-(md|lg|xl)/g, 'className="relative$1rounded-full');

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
