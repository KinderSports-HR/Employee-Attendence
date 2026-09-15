const fs = require('fs');

let appTsx = fs.readFileSync('mobile/App.tsx', 'utf8');

const oldSetLogic = `{Array.from(new Set(employees.map(e => (e.department || '').trim().toUpperCase()).filter(Boolean))).sort().map(dept => (`;
const newSetLogic = `{Array.from(new Map(employees.map(e => [(e.department || '').trim().toLowerCase(), (e.department || '').trim()])).values()).filter(Boolean).sort().map(dept => (`;
appTsx = appTsx.replace(oldSetLogic, newSetLogic);

const oldFilterLogic = `const matchesDept = departmentFilter ? (item.department || '').trim().toUpperCase() === departmentFilter : true;`;
const newFilterLogic = `const matchesDept = departmentFilter ? (item.department || '').trim().toLowerCase() === departmentFilter.toLowerCase() : true;`;
appTsx = appTsx.replace(oldFilterLogic, newFilterLogic);

const oldCountLogic = `(departmentFilter ? (item.department || '').trim().toUpperCase() === departmentFilter : true)`;
const newCountLogic = `(departmentFilter ? (item.department || '').trim().toLowerCase() === departmentFilter.toLowerCase() : true)`;
appTsx = appTsx.replace(oldCountLogic, newCountLogic);

fs.writeFileSync('mobile/App.tsx', appTsx);
console.log('App.tsx updated to fix casing aesthetics.');
