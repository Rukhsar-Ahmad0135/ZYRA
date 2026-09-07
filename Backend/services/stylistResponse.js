import mongoose from "mongoose";
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

function isValidObjectId(id) {
  if (!id || typeof id !== "string") return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
}

export const fetchProductByIds = async (ids) => {
  const wanted = (Array.isArray(ids) ? ids : []).map((id) => String(id).trim()).filter(Boolean);
  if (wanted.length === 0) return [];

  const validIds = wanted.filter(isValidObjectId);
  const invalidIds = wanted.filter(id => !isValidObjectId(id));

  if (invalidIds.length > 0) {
    console.warn("Invalid product IDs skipped:", invalidIds);
  }

  if (validIds.length === 0) return [];

  if (isLocalMode()) {
    const store = getLocalStore();
    const map = new Map((store.products || []).map((p) => [String(p._id), p]));
    return validIds.map((id) => map.get(id)).filter(Boolean);
  }

  const { default: Product } = await import("../models/Product.js");
  const objectIds = validIds.map(id => new mongoose.Types.ObjectId(id));
  const found = await Product.find({ _id: { $in: objectIds } }).lean();
  const foundMap = new Map(found.map((p) => [String(p._id), p]));
  return validIds.map((id) => foundMap.get(id)).filter(Boolean);
};
