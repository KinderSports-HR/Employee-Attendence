const fs = require('fs');
const https = require('https');

const configCode = fs.readFileSync('js/supabase-config.js', 'utf8');
const urlMatch = configCode.match(/const SUPABASE_URL = ['"]([^'"]+)['"]/);
const keyMatch = configCode.match(/const SUPABASE_ANON_KEY = ['"]([^'"]+)['"]/);

const SUPABASE_URL = urlMatch[1];
const SUPABASE_ANON_KEY = keyMatch[1];

let users = [
    { full_name: "Kanaiyabhai Bhil", phone: "8141356881", role: "employee", department: "Morbi" },
    { full_name: "Makwana Aartiben Batukbhai", phone: "6359584768", role: "employee", department: "Bhavnagar" },
    { full_name: "Nasim Majgul", phone: "9601058195", role: "employee", department: "Ahmedabad" },
    { full_name: "Paritosh Bhatti", phone: "7984044850", role: "employee" },
    { full_name: "JIGAR KHARVARA", phone: "7984752624", role: "employee", department: "Gandhinagar" },
  { full_name: "Yash Jethva", phone: "6354799291", role: "employee" },
  { full_name: "Hansa ben Solanki", phone: "8799627227", role: "employee", department: "dlss", designation: "Kabaddi Trainer" },
  { full_name: "RABARI RANCHHOD BHAI", phone: "7874785195", role: "employee" },
  { full_name: "Hirva Limbachiya", phone: "6352769579", role: "employee" },
  { full_name: "KALPESH PARMAR", phone: "9662562214", role: "employee", designation: "ATHLETICS COACH" },
  { full_name: "Pankaj Kumar", phone: "9873573672", role: "employee", department: "inschool", designation: "Coach" },
  { full_name: "ASHISHKUMAR HARISINGBHAI VASAV", phone: "7434972490", role: "employee" },
  { full_name: "RONAK PAREKH", phone: "8153982617", role: "employee" },
  { full_name: "NAKUM PAYAL", phone: "8799445967", role: "employee" },
  { full_name: "Rabari jaydip", phone: "7600588888", role: "employee" },
  { full_name: "Gadani Janmesh", phone: "9327037825", role: "employee", department: "inschool", designation: "Coach" },
  { full_name: "Aniket Chauhan", phone: "8460814493", role: "employee", department: "inschool", designation: "Pay & Play Trainer" },
  { full_name: "Ashish Solanki", phone: "8401812838", role: "employee", department: "inschool", designation: "Pay & Play Trainer" }
];

users = users.map(u => ({
    full_name: u.full_name,
    phone: u.phone,
    role: u.role,
    department: u.department || null,
    designation: u.designation || null
}));

const getOptions = {
    hostname: new URL(SUPABASE_URL).hostname,
    port: 443,
    path: '/rest/v1/employees?select=phone',
    method: 'GET',
    headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
};

https.request(getOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const existingPhones = JSON.parse(data).map(u => u.phone);
        const newUsers = users.filter(u => !existingPhones.includes(u.phone));
        
        if (newUsers.length === 0) {
            console.log("No new users to insert.");
            return;
        }

        const postOptions = {
            hostname: new URL(SUPABASE_URL).hostname,
            port: 443,
            path: '/rest/v1/employees',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=representation'
            }
        };

        const req = https.request(postOptions, (postRes) => {
            let postData = '';
            postRes.on('data', chunk => postData += chunk);
            postRes.on('end', () => {
                console.log('Insert status:', postRes.statusCode);
                console.log('Inserted successfully!');
            });
        });
        req.write(JSON.stringify(newUsers));
        req.end();
    });
}).end();
