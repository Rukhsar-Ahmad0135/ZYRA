import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const stagedDir = path.resolve(process.cwd(), 'uploads', 'staged');
const targetDir = path.resolve(process.cwd(), 'uploads', 'products');
const productsPath = path.join(__dirname, '..', 'data', 'products.js');
const localStorePath = path.join(__dirname, '..', 'data', 'local-store.json');

const allowedExt = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const sanitize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

if (!fs.existsSync(stagedDir)) {
  console.error('Staged directory not found:', stagedDir);
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const importProducts = async () => {
  const mod = await import(pathToFileURL(productsPath).href);
  return mod.default || [];
};

const writeProductsFile = (products) => {
  fs.writeFileSync(
    productsPath,
    `const products = ${JSON.stringify(products, null, 2)};\n\nexport default products;\n`,
    'utf8'
  );
};

const updateLocalStore = (products) => {
  if (!fs.existsSync(localStorePath)) return;
  try {
    const localStore = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
    if (Array.isArray(localStore.products)) {
      localStore.products = localStore.products.map((p) => {
        const match = products.find((np) => np._id === p._id || np.name === p.name);
        return match ? { ...p, images: match.images } : p;
      });
      fs.writeFileSync(localStorePath, JSON.stringify(localStore, null, 2), 'utf8');
    }
  } catch (err) {
    console.warn('Failed to update local-store.json:', err.message);
  }
};

const run = async () => {
  const products = await importProducts();

  const files = fs.readdirSync(stagedDir).filter((f) => allowedExt.has(path.extname(f).toLowerCase()));
  if (files.length === 0) {
    console.log('No image files found in', stagedDir);
    return;
  }

  const unmatchedFiles = [];
  const matchedProducts = new Set();

  for (const file of files) {
    const base = path.basename(file, path.extname(file));
    const cleaned = sanitize(base);

    // Try to find by sanitized product name or SKU
    const product = products.find((p) => sanitize(p.name) === cleaned || sanitize(p.sku) === cleaned || sanitize(p._id) === cleaned);

    const src = path.join(stagedDir, file);
    const destName = `${Date.now()}-${file}`; // avoid collisions
    const dest = path.join(targetDir, destName);

    if (product) {
      // move file
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);

      const urlPath = path.posix.join('/uploads/products', destName);
      product.images = [{ url: urlPath, altText: product.name || '' }];
      matchedProducts.add(product._id);
      console.log(`Mapped ${file} -> ${product.name} (${urlPath})`);
    } else {
      unmatchedFiles.push(file);
      // keep unmatched in staged for manual review
      console.log(`No product match for ${file}`);
    }
  }

  // write back products file if we matched any
  if (matchedProducts.size > 0) {
    writeProductsFile(products);
    updateLocalStore(products);
    console.log(`Updated ${matchedProducts.size} products and wrote ${productsPath}`);
  } else {
    console.log('No products were updated. See unmatched files list.');
  }

  if (unmatchedFiles.length > 0) {
    console.log('Unmatched files:');
    unmatchedFiles.forEach((f) => console.log(' -', f));
  }
};

run().catch((err) => {
  console.error('Failed to map images:', err);
  process.exit(1);
});
