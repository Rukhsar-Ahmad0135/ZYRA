const fs = require('fs');

const urls = fs.readFileSync('D:/iamges .txt', 'utf8')
  .split(/\r?\n/)
  .filter(l => l.trim())
  .filter(Boolean);

const store = JSON.parse(
  fs.readFileSync('D:/E Commerce project/ZYRA/Backend/data/local-store.json', 'utf8')
);
const products = store.products;

function slugify(name) {
  return name.replace(/[-\s]+/g, '_').replace(/[^\w]/g, '').toLowerCase();
}

// Build slug-based lookup, then add manual overrides for names that differ in the URL
const productBySlug = {};
products.forEach(p => { productBySlug[slugify(p.name)] = p; });

const manualOverrides = {
  'casual_t-shirt':              products.find(p => p.name === 'Casual T-Shirt'),
  'classic_button-up_shirt':    products.find(p => p.name === 'Classic Button-Up Shirt'),
  'ribbed_long-sleeve_top':     products.find(p => p.name === 'Ribbed Long-Sleeve Top'),
  'ruffle-sleeve_blouse':       products.find(p => p.name === 'Ruffle-Sleeve Blouse'),
  'slim-fit_easy-iron_shirt':   products.find(p => p.name === 'Slim-Fit Easy-Iron Shirt'),
  'slim-fit_stretch_shirt':     products.find(p => p.name === 'Slim-Fit Stretch Shirt'),
  'v-neck_classic_t-shirt':     products.find(p => p.name === 'V-Neck Classic T-Shirt'),
  'v-neck_wrap_top':            products.find(p => p.name === 'V-Neck Wrap Top'),
  'wide-leg_trousers':          products.find(p => p.name === 'Wide-Leg Trousers'),
};

// Merge: manual overrides take precedence
const productMap = {};
for (const [slug, p] of Object.entries(productBySlug)) {
  productMap[slug] = manualOverrides[slug] || p;
}
for (const [slug, p] of Object.entries(manualOverrides)) {
  if (p) productMap[slug] = p;
}

// Match URLs to products
const urlMap = {};
const unmatched = [];
for (const u of urls) {
  const m = u.match(/\/([^/]+)\.jpg$/);
  if (!m) { unmatched.push(u); continue; }
  const base = m[1].toLowerCase();
  const clean = base.replace(/_[a-z0-9]+$/i, '');
  let matched = false;
  for (const [slug, p] of Object.entries(productMap)) {
    if (clean === slug || clean === slug + '1' ||
        clean.startsWith(slug + '_') || clean.startsWith(slug + '1_')) {
      if (!urlMap[p._id]) urlMap[p._id] = { name: p.name, urls: [] };
      urlMap[p._id].urls.push(u);
      matched = true;
      break;
    }
  }
  if (!matched) unmatched.push(u);
}

console.log('Matched products:', Object.keys(urlMap).length);
console.log('Unmatched URLs:', unmatched.length);
unmatched.forEach(u => console.log('  -', u));

// Build update object with altText based on product name
const updates = {};
for (const pid in urlMap) {
  const uniqueUrls = Array.from(new Set(urlMap[pid].urls));
  const name = urlMap[pid].name;
  updates[pid] = {
    images: uniqueUrls.map((url, i) => ({
      url: url,
      altText: i === 0 ? `${name} front view` : `${name} detail view`,
    })),
  };
}

// Write back to local-store.json
const updatedStore = JSON.parse(JSON.stringify(store));
for (const pid in updates) {
  const product = updatedStore.products.find(p => p._id === pid);
  if (product) {
    product.images = updates[pid].images;
    console.log(`Updated: ${product.name} (${pid}) - ${updates[pid].images.length} images`);
  }
}

fs.writeFileSync(
  'D:/E Commerce project/ZYRA/Backend/data/local-store.json',
  JSON.stringify(updatedStore, null, 2),
  'utf8'
);
console.log('\nDone. Store written with', Object.keys(updates).length, 'image updates.');