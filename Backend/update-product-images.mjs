import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsPath = path.join(__dirname, 'data', 'products.js');
const localStorePath = path.join(__dirname, 'data', 'local-store.json');

const productsModule = await import(pathToFileURL(productsPath).href);
const products = productsModule.default;

const menImageSets = {
  default: [
    { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=500&fit=crop', altText: 'Men fashion shirt front view' },
    { url: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&h=500&fit=crop', altText: 'Men fashion shirt detail view' },
  ],
  polo: [
    { url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&h=500&fit=crop', altText: 'Men polo shirt front view' },
    { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop', altText: 'Men polo shirt detail view' },
  ],
  tee: [
    { url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&h=500&fit=crop', altText: 'Men t-shirt front view' },
    { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop', altText: 'Men t-shirt detail view' },
  ],
  thermal: [
    { url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&h=500&fit=crop', altText: 'Men thermal top front view' },
    { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=500&fit=crop', altText: 'Men thermal top detail view' },
  ],
  joggers: [
    { url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&h=500&fit=crop', altText: 'Men joggers front view' },
    { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&h=500&fit=crop', altText: 'Men joggers detail view' },
  ],
  cargo: [
    { url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&h=500&fit=crop', altText: 'Men cargo pants front view' },
    { url: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=500&h=500&fit=crop', altText: 'Men cargo pants detail view' },
  ],
  sweatpants: [
    { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=500&fit=crop', altText: 'Men sweatpants front view' },
    { url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&h=500&fit=crop', altText: 'Men sweatpants detail view' },
  ],
  jeans: [
    { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=500&fit=crop', altText: 'Men jeans front view' },
    { url: 'https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?w=500&h=500&fit=crop', altText: 'Men jeans detail view' },
  ],
  chino: [
    { url: 'https://images.unsplash.com/photo-1473968643109-aa3b32f9c9d8?w=500&h=500&fit=crop', altText: 'Men chinos front view' },
    { url: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=500&h=500&fit=crop', altText: 'Men chinos detail view' },
  ],
  trouser: [
    { url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500&h=500&fit=crop', altText: 'Men trousers front view' },
    { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&h=500&fit=crop', altText: 'Men trousers detail view' },
  ],
};

const womenImageSets = {
  default: [
    { url: 'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=500&h=500&fit=crop', altText: 'Women fashion top front view' },
    { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop', altText: 'Women fashion top detail view' },
  ],
  top: [
    { url: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=500&h=500&fit=crop', altText: 'Women blouse front view' },
    { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&h=500&fit=crop', altText: 'Women blouse detail view' },
  ],
  jeans: [
    { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop', altText: 'Women jeans front view' },
    { url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=500&fit=crop', altText: 'Women jeans detail view' },
  ],
  trouser: [
    { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=500&h=500&fit=crop', altText: 'Women trousers front view' },
    { url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500&h=500&fit=crop', altText: 'Women trousers detail view' },
  ],
  leggings: [
    { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop', altText: 'Women leggings front view' },
    { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', altText: 'Women leggings detail view' },
  ],
  skirt: [
    { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=500&h=500&fit=crop', altText: 'Women skirt front view' },
    { url: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=500&h=500&fit=crop', altText: 'Women skirt detail view' },
  ],
  shorts: [
    { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&h=500&fit=crop', altText: 'Women shorts front view' },
    { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', altText: 'Women shorts detail view' },
  ],
  joggers: [
    { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=500&fit=crop', altText: 'Women joggers front view' },
    { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop', altText: 'Women joggers detail view' },
  ],
};

function getImageSet(product) {
  const name = String(product.name || '').toLowerCase();
  const gender = String(product.gender || '').toLowerCase();
  const category = String(product.category || '').toLowerCase();
  const isWomen = gender.includes('women') || gender.includes('female');

  if (isWomen) {
    if (/jeans|skinny|denim/.test(name)) return womenImageSets.jeans;
    if (/trouser|pleated|palazzo|culottes/.test(name)) return womenImageSets.trouser;
    if (/legging|leggings/.test(name)) return womenImageSets.leggings;
    if (/skirt|midi/.test(name)) return womenImageSets.skirt;
    if (/short|shorts/.test(name)) return womenImageSets.shorts;
    if (/jogger|joggers/.test(name)) return womenImageSets.joggers;
    if (/blouse|crop|top|knitted|cropped|tee/.test(name)) return womenImageSets.top;
    return womenImageSets.default;
  }

  if (/polo/.test(name)) return menImageSets.polo;
  if (/graphic|t-shirt|tee|v-neck/.test(name)) return menImageSets.tee;
  if (/thermal/.test(name)) return menImageSets.thermal;
  if (/jogger|track/.test(name)) return menImageSets.joggers;
  if (/cargo/.test(name)) return menImageSets.cargo;
  if (/sweatpant/.test(name)) return menImageSets.sweatpants;
  if (/jean|denim/.test(name)) return menImageSets.jeans;
  if (/chino|chinos/.test(name)) return menImageSets.chino;
  if (/trouser|dress pants|formal/.test(name)) return menImageSets.trouser;
  if (/shirt|oxford|denim shirt|henley|button/.test(name) || category.includes('top')) return menImageSets.default;
  return menImageSets.default;
}

function buildImages(product) {
  const images = getImageSet(product).map((image, index) => ({
    ...image,
    altText: `${product.name || 'Product'} ${index === 0 ? 'front view' : 'detail view'}`,
  }));
  return images;
}

const updatedProducts = products.map((product) => ({
  ...product,
  images: buildImages(product),
}));

fs.writeFileSync(
  productsPath,
  `const products = ${JSON.stringify(updatedProducts, null, 2)};\n\nexport default products;\n`,
  'utf8'
);

if (fs.existsSync(localStorePath)) {
  const localStore = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
  if (Array.isArray(localStore.products)) {
    localStore.products = localStore.products.map((product) => ({
      ...product,
      images: product.name ? buildImages(product) : product.images,
    }));
    fs.writeFileSync(localStorePath, JSON.stringify(localStore, null, 2), 'utf8');
  }
}

console.log(`Updated ${updatedProducts.length} products with product-specific clothing imagery.`);
