const fs = require('fs');

// Parse images 2.txt (has product names in table format)
const content2 = fs.readFileSync('D:/images 2.txt', 'utf8');
const lines2 = content2.trim().split('\n');
const mapping = {};

// Parse lines like: | 1 | Printed Resort Shirt | Men | https://res.cloudinary.com/...url1.jpg
// Next line: https://res.cloudinary.com/...url2.jpg
let lastProduct = null;
lines2.forEach(line => {
  const tableMatch = line.match(/^\s*\|\s*\d+\s*\|\s*(.+?)\s*\|\s*(?:Men|Women)\s*\|/);
  if (tableMatch) {
    lastProduct = tableMatch[1].trim();
    mapping[lastProduct] = [];
    return;
  }
  const urlMatch = line.match(/(https:\/\/res\.cloudinary\.com\/[^\s]+\.jpg)/);
  if (urlMatch && lastProduct) {
    mapping[lastProduct].push(urlMatch[1]);
  }
});

console.log('Products from images 2.txt:', Object.keys(mapping).length);
Object.entries(mapping).forEach(([k,v]) => console.log(`  "${k}": [${v.map(u=>'"'+u+'"').join(', ')}]`));

// Parse images.txt (simple list, every 2 lines = 1 product)
const content1 = fs.readFileSync('D:/iamges .txt', 'utf8');
const lines1 = content1.trim().split('\n');
const simpleMapping = {};
let idx = 0;
let urls = [];
lines1.forEach(line => {
  const urlMatch = line.match(/(https:\/\/res\.cloudinary\.com\/[^\s]+\.jpg)/);
  if (urlMatch) {
    urls.push(urlMatch[1]);
  }
});

// Map by position in products.js order
const productNamesOrder = [
  'Boho Floral Blouse',
  'Cargo Joggers',
  'Cargo Pants',
  'Casual Denim Shirt',
  'Casual T-Shirt',
  'Chino Pants',
  'Classic Button-Up Shirt',
  'Classic Oxford Button-Down Shirt', // already has Cloudinary
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

// images.txt has 39 lines, but we need to figure out which ones
// Based on the URL names in the file:
const imageFileMapping = {
  'Boho Floral Blouse': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785949849/Boho_Floral_Blouse_su3jyt.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785949849/Boho_Floral_Blouse1_unvde3.jpg'],
  'Cargo Joggers': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785949849/Cargo_Joggers_jx44rw.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785949849/Cargo_Joggers1_o5b20e.jpg'],
  'Cargo Pants': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785949849/Cargo_Pants_ao4xj3.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950347/Cargo_Pants1_hhxlty.jpg'],
  'Casual Denim Shirt': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950346/Casual_Denim_Shirt_p8okqb.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950347/Casual_Denim_Shirt_p8okqb.jpg'],
  'Casual T-Shirt': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950347/Casual_T-Shirt_velrap.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950347/Casual_T-Shirt1_pcccw4.jpg'],
  'Chino Pants': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950347/Chino_Pants_vodpe1.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950347/Chino_Pants1_bdikzl.jpg'],
  'Classic Button-Up Shirt': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950356/Classic_Button-Up_Shirt_nelvwb.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950356/Classic_Button-Up_Shirt_nelvwb.jpg'],
  'Ribbed Long-Sleeve Top': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950356/Ribbed_Long-Sleeve_Top_jrebh0.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950357/Ribbed_Long-Sleeve_Top1_g8klcl.jpg'],
  'Ruffle-Sleeve Blouse': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950357/Ruffle-Sleeve_Blouse_rquekw.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950357/Ruffle-Sleeve_Blouse1_ymidk3.jpg'],
  'Slim Fit Joggers': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950358/Slim_Fit_Joggers_b0rj3m.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950358/Slim_Fit_Joggers1_m7vi3e.jpg'],
  'Slim Fit Trousers': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950358/Slim_Fit_Trousers_tywsq3.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950358/Slim_Fit_Trousers1_yb5hq9.jpg'],
  'Slim-Fit Easy-Iron Shirt': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950358/Slim-Fit_Easy-Iron_Shirt_zk8tf0.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950359/Slim-Fit_Easy-Iron_Shirt1_bfnz1y.jpg'],
  'Slim-Fit Stretch Shirt': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950359/Slim-Fit_Stretch_Shirt_jaolne.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950359/Slim-Fit_Stretch_Shirt1_c5q8va.jpg'],
  'Stretch Denim Shorts': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950360/Stretch_Denim_Shorts_co31gl.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950360/Stretch_Denim_Shorts1_jhxmhp.jpg'],
  'Stretch Leggings': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950360/Stretch_Leggings_amxaa0.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950360/Stretch_Leggings1_gt15wh.jpg'],
  'Tapered Sweatpants': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950361/Tapered_Sweatpants_ukg6ua.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950362/Tapered_Sweatpants1_orhok2.jpg'],
  'V-Neck Classic T-Shirt': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950362/V-Neck_Classic_T-Shirt_f6br7m.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950362/V-Neck_Classic_T-Shirt1_xw55eb.jpg'],
  'Track Pants': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950362/Track_Pants_zpz5nc.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950362/Track_Pants1_j9jkvf.jpg'],
  'V-Neck Wrap Top': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950362/V-Neck_Wrap_Top_p2uwxs.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950363/V-Neck_Wrap_Top1_dxtd9m.jpg'],
  'Wide-Leg Trousers': ['https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950362/Wide-Leg_Trousers_wntcgq.jpg', 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950362/Wide-Leg_Trousers1_vfzu9h.jpg'],
};

// Combine all mappings
const allMappings = { ...imageFileMapping, ...mapping };
console.log('\nTotal products with mappings:', Object.keys(allMappings).length);

// Read products.js and update URLs
let productsContent = fs.readFileSync('D:/E Commerce project/ZYRA/Backend/data/products.js', 'utf8');

// For each mapping, find the product by name and replace Unsplash URLs
let updatedCount = 0;
Object.entries(allMappings).forEach(([productName, cloudinaryUrls]) => {
  if (cloudinaryUrls.length < 2) return;
  
  // Escape the product name for regex
  const escapedName = productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Find the product section and replace images array
  const pattern = new RegExp(
    `("name":\\s*"${escapedName}"[\\s\\S]*?"images":\\s*\\[[\\s\\S]*?\\][\\s\\S]*?)(?:\\n[\\s\\S]*?)*?(?="name"|$)`,
    'g'
  );
  
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
  
  // Simpler approach: find the specific Unsplash URLs and replace
  const unsplashPattern = /https:\/\/images\.unsplash\.com\/photo-[^"]+/g;
  const hasUnsplash = unsplashPattern.test(productsContent);
  
  // Replace using name-based approach
  const namePattern = new RegExp(`"name":\\s*"${escapedName}"`, 'i');
  if (namePattern.test(productsContent)) {
    updatedCount++;
  }
});

console.log('Products with matching names:', updatedCount);

// Better approach: replace all Unsplash URLs with the Cloudinary URLs in order
// First, collect all Cloudinary URLs in order
const allCloudinaryUrls = Object.values(allMappings)
  .filter(u => u.length >= 2)
  .flat()
  .filter((v, i, a) => a.indexOf(v) === i); // unique

console.log('\nUnique Cloudinary URLs:', allCloudinaryUrls.length);
