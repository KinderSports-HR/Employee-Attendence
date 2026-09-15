const fs = require('fs');

let appTsx = fs.readFileSync('mobile/App.tsx', 'utf8');
appTsx = appTsx.replace(
    /dateHeaders\.push\(`\$\{day\}-\$\{String\(monthNum\)\.padStart\(2, '0'\)\}-\$\{year\}\\u00A0`\);/g,
    'dateHeaders.push(`\\u200B\${day}-\${String(monthNum).padStart(2, \\'0\\')}-\${year}`);'
);
fs.writeFileSync('mobile/App.tsx', appTsx);

let html = fs.readFileSync('monthly_report.html', 'utf8');
html = html.replace(
    /dateHeaders\.push\(`\$\{day\}-\$\{monthStr\}-\$\{yearStr\}\\u00A0`\);/g,
    'dateHeaders.push(`\\u200B\${day}-\${monthStr}-\${yearStr}`);'
);
fs.writeFileSync('monthly_report.html', html);
console.log('Fixed headers with ZERO WIDTH SPACE');
