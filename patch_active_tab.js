const fs = require('fs');
const file = 'frontend/src/components/EmployeeProfile.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useLocation')) {
  content = content.replace("import { useParams, Link }", "import { useParams, Link, useLocation }");
}

if (!content.includes('const location = useLocation();')) {
  content = content.replace(
    "const EmployeeProfile = ({ tenant, themeColor }) => {",
    "const EmployeeProfile = ({ tenant, themeColor }) => {\n  const location = useLocation();\n  const initialTab = new URLSearchParams(location.search).get('tab') || 'details';"
  );
  content = content.replace(
    "const [activeTab, setActiveTab] = useState('details');",
    "const [activeTab, setActiveTab] = useState(initialTab);"
  );
  fs.writeFileSync(file, content);
}
