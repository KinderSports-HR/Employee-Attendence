// auth.js
// This script handles the login logic using the Supabase client

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent standard HTML form submission
            
            const phoneInput = document.getElementById('phone').value.trim();
            const normalizedPhone = phoneInput.replace(/\D/g, '');
            const currentTab = window.location.pathname.includes('admin') ? 'admin' : 'employee';

            if (currentTab === 'admin' && normalizedPhone !== '8050984405') {
                alert('Invalid admin phone number.');
                return;
            }

            if (currentTab === 'admin') {
                localStorage.setItem('currentUser', JSON.stringify({
                    phone: '8050984405',
                    full_name: 'Admin User',
                    role: 'admin'
                }));
                window.location.href = 'admin.html';
                return;
            }
            
            console.log(`Attempting login for ${currentTab} with phone: ${normalizedPhone}`);
            
            try {
                // Check if this phone number exists in the 'employees' table
                const { data: employees, error } = await supabaseClient
                    .from('employees')
                    .select('*');

                if (error) {
                    console.error('Employee lookup failed:', error);
                    alert('Login is unavailable because the database connection is not configured correctly. Please contact the administrator.');
                    return;
                }

                const user = employees?.find(employee =>
                    String(employee.phone || '').replace(/\D/g, '') === normalizedPhone
                );
                
                if (!user) {
                    alert(`Phone number ${normalizedPhone} is not registered. Please enter the exact number from the employee records.`);
                    console.error(error);
                    return;
                }

                // If user is found, check role
                if (currentTab === 'admin' && user.role !== 'admin') {
                    alert("You do not have Admin privileges!");
                    return;
                }

                // Save user data to localStorage so other pages know who is logged in
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                // Redirect to the correct dashboard
                if (currentTab === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'employee.html';
                }

            } catch (err) {
                console.error("Login Error: ", err);
                alert("Something went wrong connecting to the database.");
            }
        });
    }
});