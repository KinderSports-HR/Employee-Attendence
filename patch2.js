const fs = require('fs');

let html = fs.readFileSync('add_employee.html', 'utf8');

// Insert Designation after Department
const deptBlockEnd = '</select>\n                            </div>';
const designationBlock = `
                            <!-- Designation -->
                            <div>
                                <label for="designation" class="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                                <input type="text" id="designation" name="designation" placeholder="e.g. Coach, Admin, Trainer" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow">
                            </div>`;

html = html.replace(deptBlockEnd, deptBlockEnd + designationBlock);
fs.writeFileSync('add_employee.html', html);

// Also need to patch add_employee.js if it exists to include designation in the Supabase query.
if (fs.existsSync('js/add_employee.js')) {
    let js = fs.readFileSync('js/add_employee.js', 'utf8');
    
    // Grab designation
    js = js.replace(
        "const department = document.getElementById('department').value;",
        "const department = document.getElementById('department').value;\n            const designation = document.getElementById('designation').value;"
    );

    // Add to insert object
    js = js.replace(
        "department: department,",
        "department: department,\n                        designation: designation,"
    );
    fs.writeFileSync('js/add_employee.js', js);
}
console.log('patched add_employee');
