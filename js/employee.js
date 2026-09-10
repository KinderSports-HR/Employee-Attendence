// js/employee.js
// Handles fetching and displaying data on the Employee Dashboard

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Employee.js loaded and DOM is ready!");
    
    try {
        // 1. Get logged in user from localStorage
        const userStr = localStorage.getItem('currentUser');
        console.log("User data from localStorage:", userStr);
        
        if (!userStr || userStr === 'undefined') {
            console.warn("No valid user found, redirecting to login...");
            window.location.href = 'index.html';
            return;
        }
        
        const user = JSON.parse(userStr);
        console.log("Parsed user object:", user);
        
        // 2. Update Profile UI safely
        const fullName = user.full_name || user.name || "Unknown User";
        const department = user.department || "General";
        const role = user.role || "Employee";
        const phone = user.phone || "--";

        document.getElementById('empName').textContent = fullName;
        document.getElementById('empDesignation').textContent = `${department} | ${role}`;
        document.getElementById('empPhone').textContent = phone;
        document.getElementById('welcomeName').textContent = `Hello, ${fullName}`;
        
        // Set Profile Initials Safely
        try {
            const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            document.getElementById('navInitials').textContent = initials || "U";
            document.getElementById('profileImg').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=e2e8f0&color=475569&size=100`;
        } catch (e) {
            console.error("Error setting avatars:", e);
        }

        // 3. Fetch Attendance History from Supabase
        console.log("Attempting to fetch attendance for user ID:", user.id);
        
        const { data: attendanceData, error } = await supabaseClient
            .from('attendance')
            .select('*')
            .eq('employee_id', user.id)
            .order('date', { ascending: false });
            
        if (error) {
            console.error("Supabase Database Error:", error);
            throw error;
        }
        
        console.log("Attendance Data fetched:", attendanceData);
        
        const historyBody = document.getElementById('historyBody');
        historyBody.innerHTML = ''; // clear "Loading..." text
        
        if (!attendanceData || attendanceData.length === 0) {
            historyBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-slate-500">No attendance records found yet.</td></tr>';
            document.getElementById('todayStatus').textContent = 'Not Marked Yet';
        } else {
            // Check if today is marked
            const today = new Date().toISOString().split('T')[0];
            const todayRecord = attendanceData.find(r => r.date === today);
            
            if (todayRecord) {
                document.getElementById('todayStatus').textContent = todayRecord.status;
                if (todayRecord.status === 'Present') {
                    document.getElementById('todayStatus').className = 'text-lg font-bold text-emerald-600';
                }
            } else {
                document.getElementById('todayStatus').textContent = 'Not Marked Yet';
            }
            
            // Populate table rows
            attendanceData.forEach(record => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50 transition-colors';
                
                let statusBadge = '';
                if (record.status === 'Present') {
                    statusBadge = '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-full border border-emerald-200">Present</span>';
                } else if (record.status === 'Absent') {
                    statusBadge = '<span class="px-2.5 py-1 bg-red-100 text-red-700 font-semibold text-xs rounded-full border border-red-200">Absent</span>';
                } else {
                    statusBadge = `<span class="px-2.5 py-1 bg-amber-100 text-amber-700 font-semibold text-xs rounded-full border border-amber-200">${record.status || 'Unknown'}</span>`;
                }

                tr.innerHTML = `
                    <td class="px-6 py-4 font-medium text-slate-800">${record.date}</td>
                    <td class="px-6 py-4 text-emerald-600 font-medium">${record.time_in || '--:--'}</td>
                    <td class="px-6 py-4 text-slate-500">${record.time_out || '--:--'}</td>
                    <td class="px-6 py-4 text-slate-500 text-xs">${record.location_address || 'Unknown'}</td>
                    <td class="px-6 py-4">${statusBadge}</td>
                `;
                historyBody.appendChild(tr);
            });
        }
        
    } catch (err) {
        console.error('Fatal Error rendering Employee Dashboard:', err);
        document.getElementById('empName').textContent = "Error Loading Profile";
        document.getElementById('todayStatus').textContent = "Error";
        document.getElementById('historyBody').innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">System Error: Check Browser Console (F12) for details.</td></tr>`;
    }

    // ==========================================
    // 4. Mark Attendance Logic (GPS & Supabase)
    // ==========================================
    const attendanceBtn = document.getElementById('attendanceBtn');
    const attendanceBtnLabel = document.getElementById('attendanceBtnLabel');
    const locationText = document.getElementById('locationText');
    const mapContainer = document.getElementById('mapContainer');

    attendanceBtn.addEventListener('click', () => {
        if (attendanceBtn.disabled) return;

        // Visual feedback
        attendanceBtn.disabled = true;
        attendanceBtnLabel.textContent = "Detecting Location...";
        attendanceBtn.classList.replace('bg-emerald-500', 'bg-slate-400');
        attendanceBtn.classList.replace('hover:bg-emerald-600', 'hover:bg-slate-500');

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            resetButton();
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            try {
                attendanceBtnLabel.textContent = "Saving Record...";

                // Reverse Geocode (Get Address from Lat/Lon)
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                const geoData = await res.json();
                const address = geoData.display_name || "Unknown Location";

                // Determine Status: Present if before 9:30 AM, else Late
                const now = new Date();
                const hours = now.getHours();
                const minutes = now.getMinutes();
                const timeIn = now.toTimeString().split(' ')[0]; // HH:MM:SS
                const dateStr = now.toISOString().split('T')[0];
                
                let status = "Present";
                if (hours > 9 || (hours === 9 && minutes > 30)) {
                    status = "Late";
                }

                // Save to Supabase
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
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
                    ]);

                if (error) throw error;

                // Update UI Location Text
                locationText.textContent = address;
                
                // Render Leaflet Map
                mapContainer.innerHTML = "<div id='realMap' class='w-full h-full'></div>";
                const map = L.map('realMap').setView([lat, lon], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(map);
                L.marker([lat, lon]).addTo(map)
                    .bindPopup(`Marked ${status} here!`)
                    .openPopup();

                // Update Button
                attendanceBtnLabel.textContent = "Attendance Marked!";
                attendanceBtn.classList.replace('bg-slate-400', 'bg-emerald-600');
                showNotification(`Attendance marked as ${status}.`, 'success');
                
                // Refresh page after 2 seconds to show new history in the table
                setTimeout(() => window.location.reload(), 2000);

            } catch (err) {
                console.error(err);
                alert("Failed to save attendance record. See console for details.");
                resetButton();
            }

        }, (error) => {
            alert("Location access denied or failed. Please ensure location permissions are granted.");
            resetButton();
        }, { enableHighAccuracy: true });
    });

    function resetButton() {
        attendanceBtn.disabled = false;
        attendanceBtnLabel.textContent = "Mark Attendance (Check In)";
        attendanceBtn.classList.replace('bg-slate-400', 'bg-emerald-500');
        attendanceBtn.classList.replace('hover:bg-slate-500', 'hover:bg-emerald-600');
    }
});
