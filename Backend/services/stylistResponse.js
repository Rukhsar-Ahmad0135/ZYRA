import { isLocalMode, getLocalStore } from "./localStore.js";

const PRODUCT_RESPONSE_FIELDS = [
  "_id",
  "id",
  "name",
  "description",
  "price",
  "discountPrice",
  "countInStock",
  "sku",
  "category",
  "brand",
  "sizes",
  "colors",
  "collections",
  "material",
  "gender",
  "images",
  "tags",
  "isFeatured",
  "rating",
  "numReviews",
];

const pickFields = (product) => {
  if (!product) return null;
  const out = {};
  for (const f of PRODUCT_RESPONSE_FIELDS) {
    if (product[f] !== undefined) out[f] = product[f];
  }
  out._id = product._id;
  out.id = product._id;
  return out;
};

export const responseProduct = (product) => pickFields(product);

export const responseProducts = (products) =>
  Array.isArray(products) ? products.map(pickFields).filter(Boolean) : [];

export const fetchProductByIds = async (ids) => {
  const wanted = (Array.isArray(ids) ? ids : []).map((id) => String(id)).filter(Boolean);
  if (wanted.length === 0) return [];
  if (isLocalMode()) {
    const store = getLocalStore();
    const map = new Map((store.products || []).map((p) => [String(p._id), p]));
    return wanted.map((id) => map.get(id)).filter(Boolean);
  }
  const { default: Product } = await import("../models/Product.js");
  const found = await Product.find({ _id: { $in: wanted } }).lean();
  const foundMap = new Map(found.map((p) => [String(p._id), p]));
  return wanted.map((id) => foundMap.get(id)).filter(Boolean);
};
