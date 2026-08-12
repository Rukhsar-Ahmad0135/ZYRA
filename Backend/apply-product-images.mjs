import fs from 'fs';
import path from 'path';
import products from './data/products.js';
import productImageMap from './data/product-image-map.js';

const productsPath = path.resolve('data/products.js');
const localStorePath = path.resolve('data/local-store.json');

const chooseImages = (product) => {
  const name = String(product.name || '').toLowerCase();
  const gender = String(product.gender || '').toLowerCase();
  const isWomen = gender.includes('women') || gender.includes('female');
  const map = isWomen ? productImageMap.women : productImageMap.men;

  if (isWomen) {
    if (/jeans|skinny|denim/.test(name)) return map.jeans;
    if (/trouser|pleated|palazzo|culottes/.test(name)) return map.trousers;
    if (/legging|leggings/.test(name)) return map.leggings;
    if (/skirt|midi/.test(name)) return map.skirts;
    if (/short|shorts/.test(name)) return map.shorts;
    if (/jogger|joggers/.test(name)) return map.joggers;
    if (/blouse|cami|wrap|crop|top|knitted|tee|graphic|lace|ruffle|button-up/.test(name)) return map.blouses;
    return map.tops;
  }

  if (/polo/.test(name)) return map.polos;
  if (/graphic|t-shirt|tee|v-neck|oversized/.test(name)) return map.tees;
  if (/thermal/.test(name)) return map.thermal;
  if (/jogger|track/.test(name)) return map.joggers;
  if (/cargo/.test(name)) return map.cargo;
  if (/sweatpant/.test(name)) return map.sweatpants;
  if (/jean|denim/.test(name)) return map.jeans;
  if (/chino|chinos/.test(name)) return map.chinos;
  if (/trouser|dress pants|formal/.test(name)) return map.trousers;
  return map.shirts;
};

const buildImages = (product) =>
  chooseImages(product).map((image, index) => ({
    ...image,
    altText: `${product.name || 'Product'} ${index === 0 ? 'front view' : 'detail view'}`,
  }));

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

console.log(`Updated ${updatedProducts.length} products with more specific imagery.`);
