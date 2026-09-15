const fs = require('fs');

let appTsx = fs.readFileSync('mobile/App.tsx', 'utf8');

// 1. Update the Set mapping to normalize departments (trim and uppercase)
const oldSetLogic = `Array.from(new Set(employees.map(e => e.department).filter(Boolean))).sort().map(dept => (`;
const newSetLogic = `Array.from(new Set(employees.map(e => (e.department || '').trim().toUpperCase()).filter(Boolean))).sort().map(dept => (`;
appTsx = appTsx.replace(oldSetLogic, newSetLogic);

// 2. Update the filtering logic to match normalized departments
const oldFilterLogic = `const matchesDept = departmentFilter ? item.department === departmentFilter : true;`;
const newFilterLogic = `const matchesDept = departmentFilter ? (item.department || '').trim().toUpperCase() === departmentFilter : true;`;
appTsx = appTsx.replace(oldFilterLogic, newFilterLogic);

// 3. Update the count logic to match normalized departments
const oldCountLogic = `(departmentFilter ? item.department === departmentFilter : true)`;
const newCountLogic = `(departmentFilter ? (item.department || '').trim().toUpperCase() === departmentFilter : true)`;
appTsx = appTsx.replace(oldCountLogic, newCountLogic);

fs.writeFileSync('mobile/App.tsx', appTsx);
console.log('App.tsx updated to fix department filtering case/space issues.');
