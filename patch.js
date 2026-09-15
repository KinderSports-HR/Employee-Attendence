const fs = require('fs');

// Patch admin.html
let html = fs.readFileSync('admin.html', 'utf8');

// Replace the specific header row for Live Table and Monthly table
// We look for 'Employee Name</th>'
html = html.replace(
    '<th class="px-6 py-4 border-b border-slate-200">Employee Name</th>',
    '<th class="px-6 py-4 border-b border-slate-200">Employee Name</th>\n                                      <th class="px-6 py-4 border-b border-slate-200">Department</th>\n                                      <th class="px-6 py-4 border-b border-slate-200">Designation</th>'
);

html = html.replace(
    '<th class="px-6 py-4 border-b border-slate-200">Employee Name</th>',
    '<th class="px-6 py-4 border-b border-slate-200">Employee Name</th>\n                                      <th class="px-6 py-4 border-b border-slate-200">Department</th>\n                                      <th class="px-6 py-4 border-b border-slate-200\">Designation</th>'
);

fs.writeFileSync('admin.html', html);
console.log('patched admin.html');

// Patch js/admin.js
let js = fs.readFileSync('js/admin.js', 'utf8');

js = js.replace(
    '<td class="px-6 py-4 whitespace-nowrap text-slate-500">${emp.phone}</td>',
    '<td class="px-6 py-4 whitespace-nowrap text-slate-500">${emp.department || \'-\'}</td>\n                        <td class="px-6 py-4 whitespace-nowrap text-slate-500">${emp.designation || \'-\'}</td>\n                        <td class="px-6 py-4 whitespace-nowrap text-slate-500">${emp.phone}</td>'
);

js = js.replace(
    '<td class="px-6 py-4 whitespace-nowrap text-slate-600 text-center">${totalWorkingDays}</td>',
    '<td class="px-6 py-4 whitespace-nowrap text-slate-500">${emp.department || \'-\'}</td>\n                        <td class="px-6 py-4 whitespace-nowrap text-slate-500">${emp.designation || \'-\'}</td>\n                        <td class="px-6 py-4 whitespace-nowrap text-slate-600 text-center">${totalWorkingDays}</td>'
);

fs.writeFileSync('js/admin.js', js);
console.log('patched js/admin.js');
