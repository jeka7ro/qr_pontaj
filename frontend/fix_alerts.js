const fs = require('fs');

const files = [
  'src/components/LocationsList.jsx',
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Revert error alert back to rounded-lg
  content = content.replace(/rounded-full flex items-start gap-3/g, 'rounded-lg flex items-start gap-3');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
});
