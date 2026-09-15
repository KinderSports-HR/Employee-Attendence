const fs = require('fs');

// Patch monthly_report.html
let html = fs.readFileSync('monthly_report.html', 'utf8');

const oldHtmlLogic = `            const reportMonth = new Date().toISOString().slice(0, 7);

            downloadButton.addEventListener('click', () => {
                downloadCsv(\`monthly-attendance-\${reportMonth}.csv\`, ['Employee Name', 'Department', 'Designation', 'Attendance Dates', 'Working Days', 'Present', 'Absent', 'Late', 'Attendance'], exportRows);
            });

            try {`;
// Fallback match since git checkout reverted it to a slightly different older commit maybe?
// Wait, the log says:
//             downloadButton.addEventListener('click', () => {
// >                 downloadCsv(`monthly-attendance-${new Date().toISOString().slice(0, 7)}.csv`, ['Employee Name', 'Department', 'Designation', 'Working Days', 'Present', 'Absent', 'Late', 'Attendance'], exportRows);
//               });

html = html.replace(/const exportRows = \[\];[\s\S]*?try \{/, `const exportRows = [];
            
            const reportMonth = new Date().toISOString().slice(0, 7);
            const [yearStr, monthStr] = reportMonth.split('-');
            const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
            const dateHeaders = [];
            const dateKeys = [];
            for (let i = 1; i <= daysInMonth; i++) {
                const day = String(i).padStart(2, '0');
                dateHeaders.push(\`\${day}-\${monthStr}-\${yearStr}\u00A0\`);
                dateKeys.push(\`\${yearStr}-\${monthStr}-\${day}\`);
            }

            downloadButton.addEventListener('click', () => {
                const headers = ['Employee Name', 'Department', 'Designation', ...dateHeaders, 'Total', 'Present', 'Late', 'Absent'];
                downloadCsv(\`monthly-attendance-\${reportMonth}.csv\`, headers, exportRows);
            });

            try {`);

html = html.replace(/const percentage = \(\(totalPresent \/ totalWorkingDays\).*?;[\s\S]*?table\.appendChild\(row\);\s*\}/, `let presentCount = 0;
                    let lateCount = 0;
                    let absentCount = 0;
                    let totalCount = 0;
                    const dateStatuses = dateKeys.map(isoDate => {
                        const dayRecords = employeeAttendance.filter(r => r.date === isoDate);
                        if (dayRecords.length > 0) {
                            const st = dayRecords[0].status || 'Present';
                            if (st === 'Present') presentCount++;
                            else if (st === 'Late') lateCount++;
                            else absentCount++;
                            totalCount++;
                            return st;
                        } else {
                            absentCount++;
                            return '-';
                        }
                    });
                    
                    const percentage = totalWorkingDays > 0 ? ((totalCount / totalWorkingDays) * 100).toFixed(1) : '0.0';
                    exportRows.push([employee.full_name || 'Unnamed Employee', employee.department || '-', employee.designation || '-', ...dateStatuses, totalCount, presentCount, lateCount, absentCount]);
                    
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-slate-50';
                    row.innerHTML = \`<td class="px-6 py-4 font-medium">\${employee.full_name || 'Unnamed Employee'}</td><td class="px-6 py-4 text-slate-500">\${employee.department || '-'}</td><td class="px-6 py-4 text-slate-500">\${employee.designation || '-'}</td><td class="px-6 py-4 text-center">\${totalWorkingDays}</td><td class="px-6 py-4 text-center text-emerald-600 font-semibold">\${presentCount}</td><td class="px-6 py-4 text-center text-red-500 font-semibold">\${absentCount}</td><td class="px-6 py-4 text-center text-amber-500 font-semibold">\${lateCount}</td><td class="px-6 py-4 text-right font-semibold">\${percentage}%</td>\`;
                    table.appendChild(row);
                `);

const oldThead = `<tr>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee Name</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Designation</th>
                            <th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Working Days</th>
                            <th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Present</th>
                            <th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Absent</th>
                            <th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Late</th>
                            <th class="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance %</th>
                        </tr>`;

const newThead = `<tr>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee Name</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Designation</th>
                            <th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Working Days</th>
                            <th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Present</th>
                            <th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Absent</th>
                            <th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Late</th>
                            <th class="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance %</th>
                        </tr>`;

html = html.replace(oldThead, newThead);

fs.writeFileSync('monthly_report.html', html);
console.log('monthly_report.html fixed');
