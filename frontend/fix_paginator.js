const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  const oldClass = /className="p-1\.5 rounded-full text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"/g;
  const newClass = `className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"`;
  
  content = content.replace(oldClass, newClass);
  fs.writeFileSync(file, content);
}

fixFile('src/components/EmployeesList.jsx');
fixFile('src/components/LocationsList.jsx');
