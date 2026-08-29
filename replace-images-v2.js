const fs = require('fs');

// Parse images.txt
const content1 = fs.readFileSync('D:/iamges .txt', 'utf8');
const lines1 = content1.trim().split('\n').filter(l => l.startsWith('https://res.cloudinary.com'));

// Parse images 2.txt (19 products with explicit table names + URLs)
const content2 = fs.readFileSync('D:/images 2.txt', 'utf8');
const lines2 = content2.trim().split('\n');
const mapping2 = {};
let currentProduct2 = null;

lines2.forEach(line => {
  const tableMatch = line.match(/^\s*\|\s*\d+\s*\|\s*(.+?)\s*\|\s*(?:Men|Women)\s*\|/);
  if (tableMatch) {
    currentProduct2 = tableMatch[1].trim();
    mapping2[currentProduct2] = [];
    return;
  }
  const urlMatch = line.match(/(https:\/\/res\.cloudinary\.com\/[^\s]+\.jpg)/);
  if (urlMatch && currentProduct2) {
    mapping2[currentProduct2].push(urlMatch[1]);
  }
});

console.log('Products from images 2.txt:', Object.keys(mapping2).length);

// From images.txt, extract product name from URL and group
const fromImages1 = {};
lines1.forEach(url => {
  // Extract product name from URL path
  // Pattern: /vXXXXXX/Product_Name_[suffix]_hash.jpg
  const match = url.match(/\/v\d+\/([^\/?]+)\.jpg$/);
  if (match) {
    const filename = match[1];
    // Remove trailing "1" or hash suffix to get base name
    // Product names have spaces replaced with underscores
    let cleanName;
    
    // Remove the hash suffix (last part after last underscore)
    const parts = filename.split('_');
    // Remove hash (last part)
    parts.pop();
    let baseName = parts.join('_');
    
    // Handle "1" suffix for back image: remove trailing "_1"
    if (baseName.endsWith('_1')) {
      baseName = baseName.slice(0, -2);
    }
    
    cleanName = baseName.replace(/_/g, ' ');
    
    if (!fromImages1[cleanName]) {
      fromImages1[cleanName] = [];
    }
    fromImages1[cleanName].push(url);
  }
});

console.log('Products from images.txt:', Object.keys(fromImages1).length);

// List all products and their URLs
console.log('\n=== All products ===');
const allProducts = {};
Object.entries(mapping2).forEach(([k, v]) => { allProducts[k] = v; });
Object.entries(fromImages1).forEach(([k, v]) => { 
  if (!allProducts[k]) allProducts[k] = [];
  allProducts[k] = [...allProducts[k], ...v];
});

for (const [k, v] of Object.entries(allProducts)) {
  console.log(`  "${k}": ${v.length} URLs`);
  v.forEach(u => console.log(`    ${u}`));
}

// Now read products.js and update
let productsContent = fs.readFileSync('D:/E Commerce project/ZYRA/Backend/data/products.js', 'utf8');

// For each product in products.js, find its images and replace Unsplash URLs
// Strategy: read the file line by line, track current product name, replace URLs

const productLines = productsContent.split('\n');
const updatedProducts = {};
let currentProductName = null;
let updated = 0;

for (let i = 0; i < productLines.length; i++) {
  const line = productLines[i];
  
  // Detect product name
  const nameMatch = line.match(/"name":\s*"([^"]+)"/);
  if (nameMatch) {
    currentProductName = nameMatch[1];
  }
  
  // Replace Unsplash URLs
  const unsplashMatch = line.match(/(https:\/\/images\.unsplash\.com\/photo-[^\s"}]+)/);
  if (unsplashMatch && currentProductName && allProducts[currentProductName]) {
    const cloudUrls = allProducts[currentProductName];
    // Determine which Cloudinary URL to use (first or second)
    const altTextMatch = line.match(/altText":\s*"([^"]+)"/);
    const altText = altTextMatch ? altTextMatch[1] : '';
    const isFront = altText.includes('front');
    const isDetail = altText.includes('detail') || altText.includes('back');
    
    let newUrl;
    if (cloudUrls.length >= 2) {
      newUrl = isFront ? cloudUrls[0] : cloudUrls[1];
    } else if (cloudUrls.length === 1) {
      newUrl = cloudUrls[0];
    }
    
    if (newUrl) {
      productLines[i] = line.replace(unsplashMatch[1], newUrl);
      updated++;
    }
  }
  
  // Also replace /uploads/ URLs with Cloudinary if available
  const uploadMatch = line.match(/("url":\s*")(\/uploads\/[^"]+)"/);
  if (uploadMatch && currentProductName && allProducts[currentProductName]) {
    const cloudUrls = allProducts[currentProductName];
    const altTextMatch = line.match(/altText":\s*"([^"]+)"/);
    const altText = altTextMatch ? altTextMatch[1] : '';
    const isFront = altText.includes('front');
    
    let newUrl;
    if (cloudUrls.length >= 2) {
      newUrl = isFront ? cloudUrls[0] : cloudUrls[1];
    } else if (cloudUrls.length === 1) {
      newUrl = cloudUrls[0];
    }
    
    if (newUrl) {
      productLines[i] = line.replace(uploadMatch[2], newUrl);
      updated++;
    }
  }
}

productsContent = productLines.join('\n');
fs.writeFileSync('D:/E Commerce project/ZYRA/Backend/data/products.js', productsContent, 'utf8');

// Count remaining Unsplash
const unsplashCount = (productsContent.match(/images.unsplash.com/g) || []).length;
const cloudinaryCount = (productsContent.match(/cloudinary.com/g) || []).length;
console.log(`\nReplaced ${updated} URLs`);
console.log('Remaining Unsplash URLs:', unsplashCount);
console.log('Total Cloudinary URLs:', cloudinaryCount);
