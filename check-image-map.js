const fs = require('fs');
const c = fs.readFileSync('Backend/data/product-image-map.js', 'utf8');
const u = c.match(/unsplash/g);
console.log('product-image-map.js Unsplash:', u ? u.length : 0);
const cl = c.match(/cloudinary.com/g);
console.log('product-image-map.js Cloudinary:', cl ? cl.length : 0);