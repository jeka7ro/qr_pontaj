const evaluateModules = (modulesObj) => {
  if (!modulesObj) return {};
  const evaluated = { ...modulesObj };
  const now = new Date();
  
  for (const [key, value] of Object.entries(evaluated)) {
    if (typeof value === 'string') {
      try {
        const expirationDate = new Date(value);
        if (expirationDate < now) {
          evaluated[key] = false;
        } else {
          // If it's valid and in the future, we still send the string to frontend
          // Frontends check if Truthy, and a string is Truthy.
        }
      } catch (e) {
        evaluated[key] = false;
      }
    }
  }
  return evaluated;
};

module.exports = { evaluateModules };
