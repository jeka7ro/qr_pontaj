const fs = require('fs');

const files = [
  'src/components/LocationsList.jsx',
  'src/components/EmployeesList.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // LocationsList alert
  content = content.replace(/rounded-full border border-red-100/g, 'rounded-lg border border-red-100');
  
  // Revert upload area
  content = content.replace(/rounded-full text-center relative hover:border-primary-300 transition-colors/g, 'rounded-2xl text-center relative hover:border-primary-300 transition-colors');
  content = content.replace(/border-2 border-dashed border-slate-200 rounded-full/g, 'border-2 border-dashed border-slate-200 rounded-lg');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
});
