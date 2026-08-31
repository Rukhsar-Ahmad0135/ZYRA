// Sitemap Generator for ZYRA
// Run this script to generate sitemap.xml

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://zyra.com';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

// Static routes
const staticRoutes = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/collections/all', changefreq: 'daily', priority: 0.9 },
  { url: '/collections/new-arrivals', changefreq: 'daily', priority: 0.8 },
  { url: '/collections/best-sellers', changefreq: 'weekly', priority: 0.8 },
  { url: '/login', changefreq: 'monthly', priority: 0.5 },
  { url: '/register', changefreq: 'monthly', priority: 0.5 },
];

// Dynamic routes - in production, fetch from API
const dynamicRoutes = [
  // These would be generated from your product/categories API
  // Example structure:
  // { url: '/products/product-id', changefreq: 'weekly', priority: 0.7, lastmod: '2024-01-15' },
];

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

  // Static routes
  staticRoutes.forEach((route) => {
    xml += `
  <url>
    <loc>${BASE_URL}${route.url}</loc>
    <lastmod>${route.lastmod || today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  });

  // Dynamic routes (products, categories)
  dynamicRoutes.forEach((route) => {
    xml += `
  <url>
    <loc>${BASE_URL}${route.url}</loc>
    <lastmod>${route.lastmod || today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  });

  xml += `
</urlset>`;

  // Write sitemap.xml
  fs.writeFileSync(OUTPUT_PATH, xml);
  console.log(`Sitemap generated at ${OUTPUT_PATH}`);
  console.log(`Total URLs: ${staticRoutes.length + dynamicRoutes.length}`);
}

// Run if executed directly
if (require.main === module) {
  generateSitemap();
}

module.exports = { generateSitemap };