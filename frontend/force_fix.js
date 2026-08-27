const fs = require('fs');

const files = [
  'src/components/EmployeesList.jsx',
  'src/components/LocationsList.jsx',
  'src/pages/admin/Dashboard.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace rounded-lg on the Adaugă Angajat button specifically (which spans multiple lines)
  content = content.replace(/className="px-5 h-10 rounded-(lg|md|xl)/g, 'className="px-5 h-10 rounded-full');
  
  // Also fix any other button lines
  content = content.replace(/<button([^>]*)rounded-(lg|md|xl)/g, '<button$1rounded-full');
  content = content.replace(/<input([^>]*)rounded-(lg|md|xl)/g, '<input$1rounded-full');
  content = content.replace(/<select([^>]*)rounded-(lg|md|xl)/g, '<select$1rounded-full');
  
  // For the delete modal buttons
  content = content.replace(/className="flex-1 h-11 rounded-(lg|md|xl)/g, 'className="flex-1 h-11 rounded-full');
  
  // For other action buttons
  content = content.replace(/className="px-3 py-1([^"]*)rounded-(lg|md|xl)/g, 'className="px-3 py-1$1rounded-full');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
});
