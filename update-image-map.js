const fs = require('fs');

// Read the file
let content = fs.readFileSync('D:/E Commerce project/ZYRA/Backend/data/product-image-map.js', 'utf8');

// The Cloudinary URLs we have from images 2.txt and images.txt, grouped by product name
// From the earlier parsing, these are the 19 products with their 2 Cloudinary URLs each

const cloudinaryUrls = {
  "Printed Resort Shirt": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922088/Printed_Resort_Shirt1_crim4d.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922088/Printed_Resort_Shirt_d6ttpy.jpg"],
  "Polo T-Shirt with Ribbed Collar": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922085/Polo_T-Shirt_with_Ribbed_Collar1_s1glj4.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922082/Polo_T-Shirt_with_Ribbed_Collar_noj8cb.jpg"],
  "Oversized Graphic T-Shirt": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922077/Oversized_Graphic_T-Shirt1_yd9bxz.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922075/Oversized_Graphic_T-Shirt_c4croc.jpg"],
  "Regular-Fit Henley Shirt": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922057/Regular-Fit_Henley_Shirt_yyzrqx.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922058/Regular-Fit_Henley_Shirt_1_oqtxkm.jpg"],
  "Long-Sleeve Thermal Tee": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922071/Long-Sleeve_Thermal_Tee1_yo73tx.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922069/Long-Sleeve_Thermal_Tee_qbxxhf.jpg"],
  "Denim Jeans": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922018/Denim_Jeans_d4zivv.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922021/Denim_Jeans1_oipkrh.jpg"],
  "Relaxed Fit Sweatpants": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922058/Relaxed_Fit_Sweatpants_pfbvre.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922058/Relaxed_Fit_Sweatpants1_gie0ue.jpg"],
  "Formal Dress Pants": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922024/Formal_Dress_Pants_dyzsfh.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922015/Formal_Dress_Pants1_euzydx.jpg"],
  "High-Waist Skinny Jeans": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787926304/High-Waist_Skinny_Jeans_kmzgkf.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787926304/High-Waist_Skinny_Jeans1_hnay1i.jpg"],
  "Pleated Midi Skirt": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922081/Pleated_Midi_Skirt_c6pv75.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922082/Pleated_Midi_Skirt1_uel2ja.jpg"],
  "Flared Palazzo Pants": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922023/Flared_Palazzo_Pants_ydkwtj.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922024/Flared_Palazzo_Pants_1_hl3wfu.jpg"],
  "High-Rise Joggers": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922061/High-Rise_Joggers1_glw5zf.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922059/High-Rise_Joggers_wy3hib.jpg"],
  "Paperbag Waist Shorts": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922079/Paperbag_Waist_Shorts1_yw3y4r.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922078/Paperbag_Waist_Shorts_qsbokl.jpg"],
  "Culottes": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787921825/Culottes1_mgpnol.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787921825/Culottes_k0lfgv.jpg"],
  "Classic Pleated Trousers": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787921825/Classic_Pleated_Trousers1_nmtp9v.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787921825/Classic_Pleated_Trousers_i5ncbj.jpg"],
  "Knitted Cropped Top": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922066/Knitted_Cropped_Top_az7sus.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922066/Knitted_Cropped_Top1_xooivv.jpg"],
  "Off-Shoulder Top": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922072/Off-Shoulder_Top1_zyqbvp.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922072/Off-Shoulder_Top_g7cruz.jpg"],
  "Lace-Trimmed Cami Top": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922067/Lace-Trimmed_Cami_Top_1_kawcud.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922066/Lace-Trimmed_Cami_Top_trwkcd.jpg"],
  "Graphic Print Tee": ["https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922017/Graphic_Print_Tee_keksbs.jpg", "https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922018/Graphic_Print_Tee1_xadfdc.jpg"]
};

console.log('Products to update:', Object.keys(cloudinaryUrls).length);

// Get all Unsplash URLs to replace
const unsplashPattern = /https?:\/\/images\.unsplash\.com\/photo-[^"\']+/g;
const unsplashMatches = content.match(unsplashPattern);
console.log('Unsplash URLs found:', unsplashMatches ? unsplashMatches.length : 0);

if (unsplashMatches) {
  unsplashMatches.forEach(url => {
    // Extract the product name from the markdown table context
    // The format is: | N | Product Name | Gender | followed by URLs
    // We need to match based on the URL path
    // Actually, we'll replace each Unsplash URL with the correct Cloudinary URL from our map
    // by matching the product name from the surrounding markdown table lines
  });
  
  // Let's do a smarter approach: replace each Unsplash URL with the matching Cloudinary one
  // by looking at the preceding table row
  const lines = content.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this line contains an Unsplash URL
    const unsplashMatch = line.match(unsplashPattern);
    if (unsplashMatch) {
      const foundUrl = unsplashMatch[0];
      // Look backwards to find the product name in the markdown table
      let productName = null;
      let checkIdx = i - 1;
      while (checkIdx >= 0 && checkIdx > i - 10) {
        const prevLine = lines[checkIdx];
        const nameMatch = prevLine.match(/^\s*\|\s*\d+\s*\|\s*(.+?)\s*\|\s*(Men|Women)\s*\|/);
        if (nameMatch) {
          productName = nameMatch[1].trim();
          break;
        }
        checkIdx--;
      }
      
      // Also check the line above for product name
      if (!productName && i > 0) {
        const prevLine2 = lines[i - 1];
        const nameMatch2 = prevLine2.match(/^\s*\|\s*\d+\s*\|\s*(.+?)\s*\|\s*(Men|Women)\s*\|/);
        if (nameMatch2) {
          productName = nameMatch2[1].trim();
        }
      }
      
      // Replace with Cloudinary URL if we have it
      if (productName && cloudinaryUrls[productName]) {
        const [cloudUrl1, cloudUrl2] = cloudinaryUrls[productName];
        // Replace only the first Unsplash URL found with the first Cloudinary
        // and the second with the second Cloudinary
        // We'll track which ones we've already replaced
        content = content.replace(foundUrl, cloudUrl1);
        console.log(`Replaced "${foundUrl.substring(0, 50)}..." with "${cloudUrl1}" for ${productName}`);
      } else if (productName) {
        console.log(`No Cloudinary mapping for: ${productName}, keeping: ${foundUrl}`);
      }
    }
    i++;
  }
}

// Write back
fs.writeFileSync('D:/E Commerce project/ZYRA/Backend/data/product-image-map.js', content, 'utf8');
console.log('Done!');