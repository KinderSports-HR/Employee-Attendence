const fs = require('fs');

// Patch mobile/App.tsx
let appTsx = fs.readFileSync('mobile/App.tsx', 'utf8');
const oldExportMonthly = `async function exportMonthly() {
    const rows = employees.map((employee) => {
      const records = attendance.filter((record) => record.employee_id === employee.id && record.date.startsWith(month));
      const present = records.filter((record) => record.status === 'Present').length;
      const late = records.filter((record) => record.status === 'Late').length;
      const dates = records.map((record) => record.date).sort().join(', ');
      return [employee.full_name, employee.department || '', employee.designation || '', dates, records.length, present, late, Math.max(records.length - present - late, 0)];
    });
    await downloadCsv(\`monthly-attendance-\${month}.csv\`, ['Employee Name', 'Department', 'Designation', 'Attendance Dates', 'Attendance Entries', 'Present', 'Late', 'Absent'], rows);
  }`;

const newExportMonthly = `async function exportMonthly() {
    const year = parseInt(month.split('-')[0], 10);
    const monthNum = parseInt(month.split('-')[1], 10);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    
    const dateHeaders = [];
    const dateKeys = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const day = String(i).padStart(2, '0');
      dateHeaders.push(\`\${day}-\${String(monthNum).padStart(2, '0')}-\${year}\`);
      dateKeys.push(\`\${year}-\${String(monthNum).padStart(2, '0')}-\${day}\`);
    }

    const rows = employees.map((employee) => {
      const records = attendance.filter((record) => record.employee_id === employee.id && record.date.startsWith(month));
      
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let totalCount = 0;

      const dateStatuses = dateKeys.map(isoDate => {
        const dayRecords = records.filter(r => r.date === isoDate);
        if (dayRecords.length > 0) {
            const status = dayRecords[0].status || 'Present';
            if (status === 'Present') presentCount++;
            else if (status === 'Late') lateCount++;
            else absentCount++;
            totalCount++;
            return status;
        } else {
            absentCount++;
            return '-';
        }
      });

      return [employee.full_name, employee.department || '-', employee.designation || '-', ...dateStatuses, totalCount, presentCount, lateCount, absentCount];
    });

    const headers = ['Employee Name', 'Department', 'Designation', ...dateHeaders, 'Total', 'Present', 'Late', 'Absent'];
    await downloadCsv(\`monthly-attendance-\${month}.csv\`, headers, rows);
  }`;

appTsx = appTsx.replace(/async function exportMonthly\(\) \{[\s\S]*?await downloadCsv\(`monthly-attendance-\$\{month\}\.csv`.*?;\s*\}/, newExportMonthly);
fs.writeFileSync('mobile/App.tsx', appTsx);
console.log('mobile/App.tsx updated');

// Patch monthly_report.html
let html = fs.readFileSync('monthly_report.html', 'utf8');

const oldHtmlLogic = `            const reportMonth = new Date().toISOString().slice(0, 7);

            downloadButton.addEventListener('click', () => {
                downloadCsv(\`monthly-attendance-\${reportMonth}.csv\`, ['Employee Name', 'Department', 'Designation', 'Attendance Dates', 'Working Days', 'Present', 'Absent', 'Late', 'Attendance'], exportRows);
            });

            try {`;

const newHtmlLogic = `            const reportMonth = new Date().toISOString().slice(0, 7);
            const [yearStr, monthStr] = reportMonth.split('-');
            const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
            const dateHeaders = [];
            const dateKeys = [];
            for (let i = 1; i <= daysInMonth; i++) {
                const day = String(i).padStart(2, '0');
                dateHeaders.push(\`\${day}-\${monthStr}-\${yearStr}\`);
                dateKeys.push(\`\${yearStr}-\${monthStr}-\${day}\`);
            }

            downloadButton.addEventListener('click', () => {
                const headers = ['Employee Name', 'Department', 'Designation', ...dateHeaders, 'Total', 'Present', 'Late', 'Absent'];
                downloadCsv(\`monthly-attendance-\${reportMonth}.csv\`, headers, exportRows);
            });

            try {`;
html = html.replace(oldHtmlLogic, newHtmlLogic);

const oldRowLogic = `                    const percentage = ((totalPresent / totalWorkingDays) * 100).toFixed(1);
                    const attendanceDates = employeeAttendance.map(item => item.date).sort().join(', ');
                    exportRows.push([employee.full_name || 'Unnamed Employee', employee.department || '', employee.designation || '', attendanceDates, totalWorkingDays, totalPresent, absent, late, \`\${percentage}%\`]);
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-slate-50';
                    row.innerHTML = \`<td class="px-6 py-4 font-medium">\${employee.full_name || 'Unnamed Employee'}</td><td class="px-6 py-4 text-slate-500">\${employee.department || '-'}</td><td class="px-6 py-4 text-slate-500">\${employee.designation || '-'}</td><td class="px-6 py-4 text-slate-500">\${attendanceDates || '-'}</td><td class="px-6 py-4 text-center">\${totalWorkingDays}</td><td class="px-6 py-4 text-center text-emerald-600 font-semibold">\${totalPresent}</td><td class="px-6 py-4 text-center text-red-500 font-semibold">\${absent}</td><td class="px-6 py-4 text-center text-amber-500 font-semibold">\${late}</td><td class="px-6 py-4 text-right font-semibold">\${percentage}%</td>\`;
                    table.appendChild(row);`;

const newRowLogic = `                    
                    let presentCount = 0;
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
                    table.appendChild(row);`;
                    
html = html.replace(oldRowLogic, newRowLogic);

// Update HTML table headers in monthly_report.html
const oldThead = `<tr>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee Name</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Designation</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Dates</th>
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
console.log('monthly_report.html updated');
