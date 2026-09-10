// auth.js
// This script handles the login logic using the Supabase client

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent standard HTML form submission
            
            const phoneInput = document.getElementById('phone').value;
            const currentTab = window.location.pathname.includes('admin') ? 'admin' : 'employee';
            
            console.log(`Attempting login for ${currentTab} with phone: ${phoneInput}`);
            
            try {
                // Check if this phone number exists in the 'employees' table
                const { data: user, error } = await supabaseClient
                    .from('employees')
                    .select('*')
                    .eq('phone', phoneInput)
                    .maybeSingle();
                
                if (error || !user) {
                    alert("User not found! Please check the phone number or ask an admin to add you.");
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