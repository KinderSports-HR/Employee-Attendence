const fs = require('fs');

let js = fs.readFileSync('js/employee.js', 'utf8');

// 1. Remove the "Late" logic completely. Anything marked is just "Present".
js = js.replace(
    /let status = "Present";\s*if \(hours > 9 \|\| \(hours === 9 && minutes > 30\)\) \{\s*status = "Late";\s*\}/g,
    'let status = "Present";'
);

// 2. Change the button state if already checked in, so they can Check Out.
const checkMarkedLogic = `
            if (todayRecord) {
                document.getElementById('todayStatus').textContent = todayRecord.status;
                attendanceBtn.disabled = true;
                attendanceBtnLabel.textContent = 'Attendance Already Marked';
                attendanceBtn.classList.replace('bg-emerald-500', 'bg-slate-400');
                attendanceBtn.classList.replace('hover:bg-emerald-600', 'hover:bg-slate-500');
                if (todayRecord.status === 'Present') {
                    document.getElementById('todayStatus').className = 'text-lg font-bold text-emerald-600';
                }
            } else {
                document.getElementById('todayStatus').textContent = 'Not Marked Yet';
            }
`;

const newCheckMarkedLogic = `
            if (todayRecord) {
                document.getElementById('todayStatus').textContent = todayRecord.status;
                if (todayRecord.status === 'Present') {
                    document.getElementById('todayStatus').className = 'text-lg font-bold text-emerald-600';
                }

                if (!todayRecord.time_out) {
                    // Check Out mode
                    attendanceBtn.disabled = false;
                    attendanceBtnLabel.textContent = 'Mark Check Out';
                } else {
                    // Completely done for the day
                    attendanceBtn.disabled = true;
                    attendanceBtnLabel.textContent = 'Attendance Completed';
                    attendanceBtn.classList.replace('bg-emerald-500', 'bg-slate-400');
                    attendanceBtn.classList.replace('hover:bg-emerald-600', 'hover:bg-slate-500');
                }
            } else {
                document.getElementById('todayStatus').textContent = 'Not Marked Yet';
            }
`;
js = js.replace(checkMarkedLogic, newCheckMarkedLogic);

// 3. Update the Supabase insert to handle UPSERT/UPDATE for check-out
const insertLogic = `
                const { data, error } = await supabaseClient
                    .from('attendance')
                    .insert([
                        {
                            employee_id: currentUser.id,
                            date: dateStr,
                            time_in: timeIn,
                            status: status,
                            latitude: lat,
                            longitude: lon,
                            location_address: address
                        }
                    ])
                    .select();
`;

const newInsertLogic = `
                let data, error;
                if (todayAttendanceRecord && !todayAttendanceRecord.time_out) {
                    // This is a Check Out! Update the existing record
                    const res = await supabaseClient
                        .from('attendance')
                        .update({ time_out: timeIn })
                        .eq('id', todayAttendanceRecord.id)
                        .select();
                    data = res.data;
                    error = res.error;
                } else {
                    // Check In! Insert new record
                    const res = await supabaseClient
                        .from('attendance')
                        .insert([
                            {
                                employee_id: currentUser.id,
                                date: dateStr,
                                time_in: timeIn,
                                status: status,
                                latitude: lat,
                                longitude: lon,
                                location_address: address
                            }
                        ])
                        .select();
                    data = res.data;
                    error = res.error;
                }
`;
js = js.replace(insertLogic, newInsertLogic);

fs.writeFileSync('js/employee.js', js);
console.log('patched employee.js successfully');
