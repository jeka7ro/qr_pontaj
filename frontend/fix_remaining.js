const fs = require('fs');

const files = [
  'src/components/EmployeesList.jsx',
  'src/components/LocationsList.jsx',
  'src/pages/admin/Dashboard.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace all rounded-lg, rounded-md, rounded-xl with rounded-full
  content = content.replace(/rounded-(lg|md|xl)/g, 'rounded-full');
  
  // Wait, the upload area in EmployeesList needs to be rounded-2xl
  content = content.replace(/bg-white border-2 border-dashed border-slate-200 rounded-full/g, 'bg-white border-2 border-dashed border-slate-200 rounded-2xl');
  
  // Any remaining bg-white rounded-full that should be cards?
  content = content.replace(/bg-white rounded-full shadow-sm border border-slate-200 overflow-hidden/g, 'bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
});
