const fs = require('fs');
const path = require('path');

// Read both image files
const content1 = fs.readFileSync('D:/iamges .txt', 'utf8');
const content2 = fs.readFileSync('D:/images 2.txt', 'utf8');

// Parse images.txt - simple list of URLs (39 URLs)
const urls1 = content1.trim().split('\n')
  .map(l => l.trim())
  .filter(l => l.startsWith('https://res.cloudinary.com'));

// Parse images 2.txt - markdown table with product names
const lines2 = content2.trim().split('\n');
const mapping2 = {};
let currentProduct = null;

lines2.forEach(line => {
  const tableMatch = line.match(/^\s*\|\s*\d+\s*\|\s*(.+?)\s*\|\s*(?:Men|Women)\s*\|/);
  if (tableMatch) {
    currentProduct = tableMatch[1].trim();
    mapping2[currentProduct] = [];
    return;
  }
  const urlMatch = line.match(/(https:\/\/res\.cloudinary\.com\/[^\s]+\.jpg)/);
  if (urlMatch && currentProduct) {
    mapping2[currentProduct].push(urlMatch[1]);
  }
});

// Build complete product-to-URLs mapping from images 2.txt (19 products with names)
const productUrlMap = {};
Object.entries(mapping2).forEach(([name, urls]) => {
  if (urls.length >= 2) {
    productUrlMap[name] = urls.slice(0, 2);
  }
});

// Add the first file (images.txt) - these need name matching
// We need to match by filename in URL
const productNamesFromFile1 = [
  'Boho Floral Blouse',
  'Cargo Joggers', 
  'Cargo Pants',
  'Casual Denim Shirt',
  'Casual T-Shirt',
  'Chino Pants',
  'Classic Button-Up Shirt',
  'Ribbed Long-Sleeve Top',
  'Ruffle-Sleeve Blouse',
  'Slim Fit Joggers',
  'Slim Fit Trousers',
  'Slim-Fit Easy-Iron Shirt',
  'Slim-Fit Stretch Shirt',
  'Stretch Denim Shorts',
  'Stretch Leggings',
  'Tapered Sweatpants',
  'V-Neck Classic T-Shirt',
  'Track Pants',
  'V-Neck Wrap Top',
  'Wide-Leg Trousers',
];

// Group URLs by product from images.txt (every 2 URLs = 1 product)
for (let i = 0; i < productNamesFromFile1.length && i * 2 + 1 < urls1.length; i++) {
  const name = productNamesFromFile1[i];
  productUrlMap[name] = [urls1[i * 2], urls1[i * 2 + 1]];
}

// Also add Classic Oxford Button-Down Shirt which already has one Cloudinary URL in product-image-map.js
productUrlMap['Classic Oxford Button-Down Shirt'] = [
  'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785923723/Classic_Oxford_Button-Down_Shirt_1_mxrkbs.jpg',
  'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785923723/Classic_Oxford_Button-Down_Shirt_1_mxrkbs.jpg'
];

console.log('Total products mapped:', Object.keys(productUrlMap).length);

// Read products.js
let productsContent = fs.readFileSync('D:/E Commerce project/ZYRA/Backend/data/products.js', 'utf8');

// Replace Unsplash URLs for each product
let updated = 0;
Object.entries(productUrlMap).forEach(([productName, cloudinaryUrls]) => {
  const escapedName = productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Find the images array for this product and replace both URLs
  // Pattern: "name": "Product Name" ... "images": [ { "url": "old_url1", ... }, { "url": "old_url2", ... } ]
  const nameRegex = new RegExp(`"name"\\s*:\\s*"${escapedName}"`, 'i');
  if (!nameRegex.test(productsContent)) {
    console.warn(`Product not found in products.js: ${productName}`);
    return;
  }
  
  // Find and replace the two unsplash URLs for this product
  // Use a more precise approach: find the product section and replace its images
  const productStart = productsContent.indexOf(`"name": "${productName}"`);
  if (productStart === -1) {
    console.warn(`Product not found: ${productName}`);
    return;
  }
  
  // Find the "images": [ ... ] array after the name
  const imagesStart = productsContent.indexOf('"images"', productStart);
  if (imagesStart === -1) {
    console.warn(`No images array for: ${productName}`);
    return;
  }
  
  const bracketStart = productsContent.indexOf('[', imagesStart);
  if (bracketStart === -1) {
    console.warn(`No opening bracket for images: ${productName}`);
    return;
  }
  
  // Find matching closing bracket
  let depth = 0;
  let bracketEnd = -1;
  for (let i = bracketStart; i < productsContent.length; i++) {
    if (productsContent[i] === '[') depth++;
    else if (productsContent[i] === ']') {
      depth--;
      if (depth === 0) {
        bracketEnd = i;
        break;
      }
    }
  }
  
  if (bracketEnd === -1) {
    console.warn(`No closing bracket for images: ${productName}`);
    return;
  }
  
  // Build new images array
  const newImages = `[
      {
        "url": "${cloudinaryUrls[0]}",
        "altText": "${productName} front view"
      },
      {
        "url": "${cloudinaryUrls[1]}",
        "altText": "${productName} back view"
      }
    ]`;
  
  // Replace
  productsContent = productsContent.slice(0, bracketStart + 1) + '\n' + newImages + '\n' + productsContent.slice(bracketEnd);
  updated++;
});

console.log('Updated products:', updated);

// Write back
fs.writeFileSync('D:/E Commerce project/ZYRA/Backend/data/products.js', productsContent, 'utf8');
console.log('Done!');