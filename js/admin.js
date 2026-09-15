document.addEventListener('DOMContentLoaded', async () => {
    window.switchAdminView = function(view) {
        const dashView = document.getElementById('dashboardView');
        const monthlyView = document.getElementById('monthlyReportsView');
        const navDash = document.getElementById('navDashboard');
        const navMonthly = document.getElementById('navMonthly');

        if (!dashView || !monthlyView || !navDash || !navMonthly) return;

        if (view === 'monthly') {
            dashView.classList.add('hidden');
            monthlyView.classList.remove('hidden');
            navDash.className = "flex items-center px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg text-sm font-medium transition-colors";
            navMonthly.className = "flex items-center px-4 py-3 bg-blue-600 rounded-lg text-sm font-medium text-white shadow-sm";
        } else {
            monthlyView.classList.add('hidden');
            dashView.classList.remove('hidden');
            navMonthly.className = "flex items-center px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg text-sm font-medium transition-colors";
            navDash.className = "flex items-center px-4 py-3 bg-blue-600 rounded-lg text-sm font-medium text-white shadow-sm";
        }
    };

    if (window.location.hash === '#monthlyReportsView') {
        window.switchAdminView('monthly');
    }

    // 1. Authenticate Admin
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        window.location.href = 'index.html';
        return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
        alert('Unauthorized access. Redirecting to employee dashboard.');
        window.location.href = 'employee.html';
        return;
    }

    // Update Admin Name in header
    try {
        document.querySelector('.text-right .text-sm.font-semibold').textContent = user.full_name || 'Admin User';
        document.querySelector('.w-10.h-10.rounded-full').textContent = (user.full_name || 'A').charAt(0).toUpperCase();
    } catch(e) {}

    // 2. DOM Elements (using selectors to find the hardcoded HTML elements)
    const topStats = document.querySelectorAll('.grid-cols-1.md\\:grid-cols-3 p.text-3xl');
    const inschoolStats = document.querySelectorAll('.grid-cols-2.md\\:grid-cols-4 p.text-2xl');
    
    // Selects
    const selects = document.querySelectorAll('select');
    const liveDeptFilter = selects[0];
    const monthlyDeptFilter = selects[1];
    
    // Tables
    const tbodies = document.querySelectorAll('tbody');
    const liveTable = tbodies[0];
    const monthlyTable = tbodies[1];

    function showMonthlyReportMessage(message) {
        if (!monthlyTable) return;
        monthlyTable.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">${message}</td></tr>`;
    }

    if (liveTable) liveTable.innerHTML = '<tr><td colspan="6" class="text-center py-4">Loading Data...</td></tr>';
    if (monthlyTable) monthlyTable.innerHTML = '<tr><td colspan="6" class="text-center py-4">Loading Data...</td></tr>';

    // 3. Fetch Data
    try {
        const { data: employees, error: empErr } = await supabaseClient.from('employees').select('*');
        if (empErr) throw empErr;

        const todayStr = new Date().toISOString().split('T')[0];
        
        // Fetch ALL attendance to compute statistics
        const { data: attendance, error: attErr } = await supabaseClient.from('attendance').select('*');
        if (attErr) throw attErr;

        const todayAttendance = attendance.filter(a => a.date === todayStr);

        function renderDashboard() {
            // Stats Calculations
            const totalEmps = employees.length;
            const presentToday = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
            const absentToday = totalEmps - presentToday;

            // Update Top Stats
            if(topStats.length >= 3) {
                topStats[0].textContent = totalEmps;
                topStats[1].textContent = presentToday;
                topStats[2].textContent = absentToday;
            }

            // Inschool Stats
            const inschoolEmps = employees.filter(e => e.department && e.department.toLowerCase() === 'inschool');
            const totalIns = inschoolEmps.length;
            const inschoolIds = inschoolEmps.map(e => e.id);
            const inschoolAtt = todayAttendance.filter(a => inschoolIds.includes(a.employee_id));
            const presentIns = inschoolAtt.filter(a => a.status === 'Present' || a.status === 'Late').length;
            const dutyIns = inschoolAtt.filter(a => a.status === 'On-Duty').length;
            const absentIns = totalIns - presentIns - dutyIns;

            if(inschoolStats.length >= 4) {
                inschoolStats[0].textContent = totalIns;
                inschoolStats[1].textContent = presentIns;
                inschoolStats[2].textContent = absentIns;
                inschoolStats[3].textContent = dutyIns;
            }

            // Render Live Table
            const selectedLiveDept = liveDeptFilter.options[liveDeptFilter.selectedIndex].text;
            if (liveTable) {
                liveTable.innerHTML = ''; 
                
                let filteredEmps = employees;
                if (selectedLiveDept && selectedLiveDept !== 'All Departments') {
                    filteredEmps = employees.filter(e => e.department && e.department.toLowerCase() === selectedLiveDept.toLowerCase());
                }

                filteredEmps.forEach(emp => {
                    const att = todayAttendance.find(a => a.employee_id === emp.id);
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-slate-50 transition-colors';
                    
                    const initials = (emp.full_name || 'U').substring(0,2).toUpperCase();
                    
                    // Assign specific colors for departments matching the design
                    let deptColor = 'bg-slate-100 text-slate-700';
                    if(emp.department) {
                        const d = emp.department.toLowerCase();
                        if(d === 'inschool') deptColor = 'bg-blue-100 text-blue-700';
                        if(d === 'dlss') deptColor = 'bg-purple-100 text-purple-700';
                        if(d === 'pay & play') deptColor = 'bg-orange-100 text-orange-700';
                        if(d === 'khelo-india') deptColor = 'bg-emerald-100 text-emerald-700';
                    }

                    const deptLabel = emp.department ? `<span class="px-2 py-0.5 ${deptColor} rounded text-xs font-semibold mr-2">${emp.department.toUpperCase()}</span>` : '';
                    
                    let timeIn = '--:--';
                    let location = 'Not available';
                    let statusBadge = '<span class="px-2.5 py-1 bg-red-100 text-red-700 font-semibold text-xs rounded-full">Absent</span>';

                    if (att) {
                        timeIn = att.time_in || '--:--';
                        if (att.location_address) location = `<span class="text-blue-600 truncate block max-w-[150px]"><svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>${att.location_address}</span>`;
                        
                        if (att.status === 'Present') statusBadge = '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-full">Present</span>';
                        if (att.status === 'Late') statusBadge = '<span class="px-2.5 py-1 bg-amber-100 text-amber-700 font-semibold text-xs rounded-full">Late</span>';
                    }

                    tr.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 mr-3">${initials}</div>
                                <div>
                                    <div class="font-medium text-slate-800 flex items-center">${deptLabel} ${emp.full_name}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-slate-500">${emp.department || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-slate-500">${emp.designation || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-slate-500">${emp.phone}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-slate-800 font-medium">${timeIn}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">${location}</td>
                        <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-xs font-medium">
                            <button class="text-blue-600 hover:text-blue-800 mr-3" onclick="showEmployeeDetails('${emp.id}')">Details</button>
                            <button class="text-amber-600 hover:text-amber-800" onclick="showEditAttendance('${emp.id}')">Edit</button>
                        </td>
                    `;
                    liveTable.appendChild(tr);
                });
            }

            // Expose a global function to show the modal
            window.showEmployeeDetails = function(empId) {
                const emp = employees.find(e => e.id == empId);
                if (!emp) return;
                
                const att = todayAttendance.find(a => a.employee_id == empId);
                
                document.getElementById('modalEmpName').textContent = emp.full_name || 'Unknown Employee';
                document.getElementById('modalInitials').textContent = (emp.full_name || 'U').substring(0,2).toUpperCase();
                document.getElementById('modalDept').textContent = emp.department || 'Not Assigned';
                document.getElementById('modalPhone').textContent = emp.phone || 'N/A';

                const employeeStatus = document.getElementById('modalEmployeeStatus');
                const isActive = emp.is_active !== false && String(emp.status || '').toLowerCase() !== 'inactive';
                employeeStatus.textContent = emp.status || (isActive ? 'Active' : 'Inactive');
                employeeStatus.className = isActive ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold';
                
                if (att) {
                    let statusBadge = '<span class="px-2.5 py-1 bg-red-100 text-red-700 font-semibold text-xs rounded-full">Absent</span>';
                    if (att.status === 'Present') statusBadge = '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-full">Present</span>';
                    if (att.status === 'Late') statusBadge = '<span class="px-2.5 py-1 bg-amber-100 text-amber-700 font-semibold text-xs rounded-full">Late</span>';
                    
                    document.getElementById('modalStatus').innerHTML = statusBadge;
                    document.getElementById('modalTimeIn').textContent = att.time_in || '--:--';
                    document.getElementById('modalLocation').textContent = att.location_address || 'GPS Not Captured';
                } else {
                    document.getElementById('modalStatus').innerHTML = '<span class="px-2.5 py-1 bg-red-100 text-red-700 font-semibold text-xs rounded-full">Absent</span>';
                    document.getElementById('modalTimeIn').textContent = '--:--';
                    document.getElementById('modalLocation').textContent = 'No Check-In Today';
                }
                
                document.getElementById('employeeModal').classList.remove('hidden');
            };

            let editingEmployeeId = null;
            window.showEditAttendance = function(empId) {
                const emp = employees.find(e => e.id == empId);
                const att = todayAttendance.find(a => a.employee_id == empId);
                if (!emp) return;

                editingEmployeeId = empId;
                document.getElementById('editAttendanceEmployee').textContent = `${emp.full_name} - ${att ? att.date : todayStr}`;
                document.getElementById('editEmployeePhone').value = emp.phone || '';
                document.getElementById('editAttendanceStatus').value = att?.status || 'Absent';
                document.getElementById('editAttendanceTime').value = att?.time_in ? att.time_in.substring(0, 5) : '';
                document.getElementById('editAttendanceLocation').value = att?.location_address || '';
                document.getElementById('editAttendanceModal').classList.remove('hidden');
            };

            window.closeEditAttendance = function() {
                document.getElementById('editAttendanceModal').classList.add('hidden');
                editingEmployeeId = null;
            };

            document.getElementById('editAttendanceForm').addEventListener('submit', async (event) => {
                event.preventDefault();
                const existingAttendance = todayAttendance.find(a => a.employee_id == editingEmployeeId);
                const phone = document.getElementById('editEmployeePhone').value.replace(/\D/g, '');
                const values = {
                    status: document.getElementById('editAttendanceStatus').value,
                    time_in: document.getElementById('editAttendanceTime').value || null,
                    location_address: document.getElementById('editAttendanceLocation').value.trim() || null
                };

                try {
                    if (!phone || phone.length < 10) {
                        showNotification('Enter a valid phone number.', 'error');
                        return;
                    }

                    const { error: employeeError } = await supabaseClient
                        .from('employees')
                        .update({ phone })
                        .eq('id', editingEmployeeId);
                    if (employeeError) throw employeeError;

                    const query = existingAttendance
                        ? supabaseClient.from('attendance').update(values).eq('id', existingAttendance.id)
                        : supabaseClient.from('attendance').insert({ ...values, employee_id: editingEmployeeId, date: todayStr });
                    const { error } = await query;
                    if (error) throw error;
                    showNotification('Attendance updated successfully.', 'success');
                    closeEditAttendance();
                    setTimeout(() => window.location.reload(), 500);
                } catch (error) {
                    console.error('Attendance update error:', error);
                    showNotification('Unable to update attendance.', 'error');
                }
            });

            // Render Monthly Table
            if (monthlyTable) {
                monthlyTable.innerHTML = '';
                const selectedMonthlyDept = monthlyDeptFilter.options[monthlyDeptFilter.selectedIndex].text;
                
                let mFilteredEmps = employees;
                if (selectedMonthlyDept && selectedMonthlyDept !== 'All Departments') {
                    mFilteredEmps = employees.filter(e => e.department && e.department.toLowerCase() === selectedMonthlyDept.toLowerCase());
                }

                if (mFilteredEmps.length === 0) {
                    showMonthlyReportMessage('No attendance data available for the selected department.');
                    return;
                }

                mFilteredEmps.forEach(emp => {
                    // Get all attendance for this employee
                    const empAtt = attendance.filter(a => a.employee_id === emp.id);
                    const daysPresent = empAtt.filter(a => a.status === 'Present').length;
                    const lateArrivals = empAtt.filter(a => a.status === 'Late').length;
                    const totalWorkingDays = 22; 
                    const totalPresent = daysPresent + lateArrivals;
                    const daysAbsent = totalWorkingDays - totalPresent;
                    const attPercent = ((totalPresent / totalWorkingDays) * 100).toFixed(1);

                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-slate-50 transition-colors';
                    const initials = (emp.full_name || 'U').substring(0,2).toUpperCase();
                    const deptLabel = emp.department ? `<span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold mr-2">${emp.department.toUpperCase()}</span>` : '';

                    tr.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 mr-3">${initials}</div>
                                <div class="font-medium text-slate-800 flex items-center">${deptLabel} ${emp.full_name}</div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-slate-500">${emp.department || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-slate-500">${emp.designation || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-slate-600 text-center">${totalWorkingDays}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-emerald-600 font-bold text-center">${totalPresent}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-red-500 font-bold text-center">${daysAbsent}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-amber-500 font-bold text-center">${lateArrivals}</td>
                        <td class="px-6 py-4 whitespace-nowrap font-bold text-slate-700">${attPercent}%</td>
                    `;
                    monthlyTable.appendChild(tr);
                });
            }
        }

        // Initial render
        renderDashboard();

        // Listen for filter changes
        if(liveDeptFilter) liveDeptFilter.addEventListener('change', renderDashboard);
        if(monthlyDeptFilter) monthlyDeptFilter.addEventListener('change', renderDashboard);

    } catch (err) {
        console.error('Admin Dashboard Error:', err);
        showNotification('Unable to load dashboard data.', 'error');
        showMonthlyReportMessage('Unable to load the attendance report. Please check your connection and try again.');
    }
});
