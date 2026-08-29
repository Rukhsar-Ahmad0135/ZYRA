const fs = require('fs');

// Parse images.txt - URL list
const content1 = fs.readFileSync('D:/iamges .txt', 'utf8');
const lines1 = content1.trim().split('\n').filter(l => l.startsWith('https://res.cloudinary.com'));

// Parse images 2.txt - markdown table
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

// Build complete product-to-URLs mapping
const productUrlMap = {};
Object.entries(mapping2).forEach(([name, urls]) => {
  if (urls.length >= 2) {
    productUrlMap[name] = urls.slice(0, 2);
  }
});

// Group images.txt URLs by product name (from filename)
lines1.forEach(url => {
  const match = url.match(/\/v\d+\/([^\/?]+)\.jpg$/);
  if (match) {
    const filename = match[1];
    const parts = filename.split('_');
    parts.pop(); // remove hash
    let baseName = parts.join('_');
    if (baseName.endsWith('_1')) {
      baseName = baseName.slice(0, -2);
    }
    const cleanName = baseName.replace(/_/g, ' ');
    
    if (!productUrlMap[cleanName]) {
      productUrlMap[cleanName] = [];
    }
    productUrlMap[cleanName].push(url);
  }
});

console.log('Total products mapped:', Object.keys(productUrlMap).length);

// Read product-image-map.js
let content = fs.readFileSync('D:/E Commerce project/ZYRA/Backend/data/product-image-map.js', 'utf8');

// Get all Unsplash URLs in order
const unsplashPattern = /https?:\/\/images\.unsplash\.com\/photo-[^"\']+/g;
const unsplashUrls = content.match(unsplashPattern) || [];
console.log('Unsplash URLs to replace:', unsplashUrls.length);

// Map by product name in the markdown table - each table row has:
// | N | Product Name | Gender |
// followed by 2 Unsplash URL lines

const productNamesInOrder = [
  'Printed Resort Shirt',
  'Polo T-Shirt with Ribbed Collar',
  'Oversized Graphic T-Shirt',
  'Regular-Fit Henley Shirt',
  'Long-Sleeve Thermal Tee',
  'Denim Jeans',
  'Relaxed Fit Sweatpants',
  'Formal Dress Pants',
  'High-Waist Skinny Jeans',
  'Pleated Midi Skirt',
  'Flared Palazzo Pants',
  'High-Rise Joggers',
  'Paperbag Waist Shorts',
  'Culottes',
  'Classic Pleated Trousers',
  'Knitted Cropped Top',
  'Off-Shoulder Top',
  'Lace-Trimmed Cami Top',
  'Graphic Print Tee',
];

let urlIndex = 0;
let cloudIndex = 0;
const cloudArray = [];
productNamesInOrder.forEach(name => {
  const urls = productUrlMap[name];
  if (urls && urls.length >= 2) {
    cloudArray.push(urls[0]);
    cloudArray.push(urls[1]);
  } else if (urls && urls.length === 1) {
    cloudArray.push(urls[0]);
    cloudArray.push(urls[0]);
  }
});

console.log('Cloudinary URLs available:', cloudArray.length);

// Replace each Unsplash URL with corresponding Cloudinary URL in order
content = content.replace(unsplashPattern, () => {
  if (cloudIndex < cloudArray.length) {
    const url = cloudArray[cloudIndex];
    cloudIndex++;
    return url;
  }
  return 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785923723/Classic_Oxford_Button-Down_Shirt_1_mxrkbs.jpg';
});

fs.writeFileSync('D:/E Commerce project/ZYRA/Backend/data/product-image-map.js', content, 'utf8');

// Verify
const remaining = (content.match(/unsplash/g) || []).length;
const cloud = (content.match(/cloudinary.com/g) || []).length;
console.log('Remaining Unsplash:', remaining);
console.log('Total Cloudinary:', cloud);
console.log('Done!');