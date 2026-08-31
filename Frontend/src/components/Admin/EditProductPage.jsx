/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProductById } from "../../redux/slices/productSlice";
import {
  fetchAdminProducts,
  updateProduct,
  createProduct,
  uploadProductImages,
} from "../../redux/slices/adminProductSlice";
import { toast } from "sonner";

// Canonical product taxonomy (Step 7)
const CATEGORIES = ["Top Wear", "Bottom Wear", "Accessories", "Footwear"];
const GENDERS = ["Men", "Women", "Unisex"];

// Normalize any legacy gender value to the canonical taxonomy.
const normalizeGender = (raw) => {
  const map = {
    men: "Men",
    male: "Men",
    women: "Women",
    female: "Women",
    unisex: "Unisex",
  };
  if (!raw) return "Unisex";
  return map[String(raw).toLowerCase()] || "Unisex";
};

const COLLECTIONS = [
  "New Arrivals",
  "Featured",
  "Best Sellers",
  "Sale",
  "General",
];


const emptyForm = {
  name: "",
  description: "",
  price: "",
  discountPrice: "",
  countInStock: "",
  sku: "",
  category: "",
  brand: "",
  sizes: [],
  colors: [],
  collections: "General",
  material: "",
  gender: "Unisex",

  images: [],
  isFeatured: false,
  isPublished: true,
  tags: [],
};

const EditProductPage = () => {
  const { id } = useParams();
  const isEditMode = id && id !== "new";
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.adminProducts);

  const [formData, setFormData] = useState(emptyForm);
  const [sizesInput, setSizesInput] = useState("");
  const [colorsInput, setColorsInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchProductById(id))
        .unwrap()
        .then((product) => {
          setFormData({
            name: product.name || "",
            description: product.description || "",
            price: product.price ?? "",
            discountPrice: product.discountPrice ?? "",
            countInStock: product.countInStock ?? "",
            sku: product.sku || "",
            category: product.category || "",
            brand: product.brand || "",
            sizes: product.sizes || [],
            colors: product.colors || [],
            collections: product.collections || "General",
            material: product.material || "",
            gender: normalizeGender(product.gender),
            images: product.images || [],

            isFeatured: product.isFeatured || false,
            isPublished:
              product.isPublished !== undefined ? product.isPublished : true,
            tags: product.tags || [],
          });
          setSizesInput((product.sizes || []).join(", "));
          setColorsInput((product.colors || []).join(", "));
          setTagsInput((product.tags || []).join(", "));
        })
        .catch((err) => {
          toast.error(err?.message || "Failed to load product");
        })
        .finally(() => setLoadingProduct(false));
    }
  }, [dispatch, id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await dispatch(uploadProductImages(files)).unwrap();
      const newImages = uploaded.map((img) => ({
        url: img.url,
        publicId: img.publicId,
        altText: formData.name || "product image",
      }));
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...newImages],
      }));
      toast.success("Image(s) uploaded");
    } catch (err) {
      toast.error(err?.message || "Image upload failed");
    } finally {
      setUploading(false);
      // Reset the input so selecting the same file again re-triggers change.
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        discountPrice: formData.discountPrice
          ? Number(formData.discountPrice)
          : undefined,
        countInStock: Number(formData.countInStock),
        sizes: sizesInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        colors: colorsInput
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (isEditMode) {
        await dispatch(updateProduct({ id, productData: payload })).unwrap();
        toast.success("Product updated successfully");
      } else {
        await dispatch(createProduct(payload)).unwrap();
        toast.success("Product created successfully");
      }
      dispatch(fetchAdminProducts({ page: 1, pageSize: 10, search: "" })).catch(
        () => {},
      );
      navigate("/admin/products");
    } catch (err) {
      toast.error(err?.message || "Save failed");
    }
  };

  if (loadingProduct) {
    return (
      <div className="text-center py-16 text-gray-500">Loading product...</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">
        {isEditMode ? "Edit Product" : "Create Product"}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-gray-50 p-6 rounded-lg border"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Name *</label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">SKU *</label>
            <input
              name="sku"
              type="text"
              value={formData.sku}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Price *</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Discount Price</label>
            <input
              name="discountPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.discountPrice}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Stock *</label>
            <input
              name="countInStock"
              type="number"
              min="0"
              value={formData.countInStock}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Brand</label>
            <input
              name="brand"
              type="text"
              value={formData.brand}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Collection</label>
            <select
              name="collections"
              value={formData.collections}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              {COLLECTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Material</label>
            <input
              name="material"
              type="text"
              value={formData.material}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">
              Sizes (comma separated)
            </label>
            <input
              type="text"
              value={sizesInput}
              onChange={(e) => setSizesInput(e.target.value)}
              placeholder="S, M, L"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">
              Colors (comma separated)
            </label>
            <input
              type="text"
              value={colorsInput}
              onChange={(e) => setColorsInput(e.target.value)}
              placeholder="Red, Blue, Black"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">
            Tags (comma separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="casual, summer, premium"
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-gray-700 mb-1">Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="w-full p-2 border rounded"
            disabled={uploading}
          />
          {uploading && (
            <p className="text-sm text-gray-500 mt-1">Uploading...</p>
          )}
          {formData.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={img.url}
                    alt={img.altText || "product"}
                    className="w-20 h-20 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
            />
            Featured
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
            />
            Published
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || uploading}
            className="bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : isEditMode
                ? "Update Product"
                : "Create Product"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="bg-gray-500 text-white py-2 px-6 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProductPage;
