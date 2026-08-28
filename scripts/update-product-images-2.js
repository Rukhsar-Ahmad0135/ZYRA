const fs = require('fs');

const content = fs.readFileSync('D:/images 2.txt', 'utf8');
const urls = content.match(/https:\/\/res\.cloudinary\.com\/dab9s1yeq\/image\/upload\/[^\s]+/g) || [];

const store = JSON.parse(
  fs.readFileSync('D:/E Commerce project/ZYRA/Backend/data/local-store.json', 'utf8')
);
const products = store.products;

function normalize(s) {
  return s.toLowerCase().replace(/[-\s_]+/g, '_').replace(/[^a-z0-9_]/g, '');
}

const productByNorm = {};
products.forEach(p => { productByNorm[normalize(p.name)] = p; });

const urlMap = {};
const unmatched = [];

for (const u of urls) {
  const m = u.match(/\/([^/]+)\.jpg$/);
  if (!m) { unmatched.push(u); continue; }
  let base = normalize(m[1]);
  // Strip trailing hash first: _crim4d -> empty
  base = base.replace(/_[a-z0-9]+$/, '');
  // Then strip trailing _1: _1 -> empty
  base = base.replace(/_1$/, '');

  let matched = false;
  for (const [slug, p] of Object.entries(productByNorm)) {
    if (base === slug || base.startsWith(slug + '_') || slug.startsWith(base + '_')) {
      if (!urlMap[p._id]) urlMap[p._id] = { name: p.name, urls: [] };
      urlMap[p._id].urls.push(u);
      matched = true;
      break;
    }
  }
  if (!matched) unmatched.push(m[1]);
}

console.log('Matched products:', Object.keys(urlMap).length);
console.log('Unmatched URLs:', unmatched.length);
unmatched.forEach(u => console.log('  -', u));

const updatedStore = JSON.parse(JSON.stringify(store));
let count = 0;
for (const pid in urlMap) {
  const uniqueUrls = Array.from(new Set(urlMap[pid].urls));
  const name = urlMap[pid].name;
  const product = updatedStore.products.find(p => p._id === pid);
  if (product) {
    product.images = uniqueUrls.map((url, i) => ({
      url: url,
      altText: i === 0 ? `${name} front view` : `${name} detail view`,
    }));
    console.log(`Updated: ${product.name} (${pid}) - ${uniqueUrls.length} images`);
    count++;
  }
}

fs.writeFileSync(
  'D:/E Commerce project/ZYRA/Backend/data/local-store.json',
  JSON.stringify(updatedStore, null, 2),
  'utf8'
);
console.log('\nDone. Updated', count, 'products with new Cloudinary images.');