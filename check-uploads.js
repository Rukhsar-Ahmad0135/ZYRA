const fs = require('fs');
const c = fs.readFileSync('./Backend/data/products.js', 'utf8');
const m = c.match(/\/uploads\/[^\"]+/g);
console.log('Upload URLs:', m ? m.length : 0);
if (m) m.forEach(u => console.log(' ', u));