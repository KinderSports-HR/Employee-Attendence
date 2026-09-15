const fs = require('fs');

let js = fs.readFileSync('js/employee.js', 'utf8');

js = js.replace(
    'let status = "Present";',
    'if (hours < 6 || hours >= 22) { alert("Attendance can only be marked between 6:00 AM and 10:00 PM."); resetButton(); return; }\n                let status = "Present";'
);

fs.writeFileSync('js/employee.js', js);
console.log('Added time restriction');
