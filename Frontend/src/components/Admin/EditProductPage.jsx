/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useState } from "react";
const EditProductPage = () => {
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: 0,
    CountInStock: 0,
    sku: "",
    category: "",
    brand: "",
    size: [],
    colors: [],
    collection: "",
    material: "",
    gender: "",
    images: [
      {
        url: "https://picsum.photos/150?random=1",
      },
      {
        url: "https://picsum.photos/150?random=2",
      },
    ],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    console.log("uploaded file:", file);
  };
  const handlesubmit = (e) => {
    e.preventDefault();
    console.log(productData);
  };
  return (
    <div className="max-w-5xl mx-auto p-6 shadow-md rounded-md">
      <h2 className="text-3xl font-bold mb-6">Edit Product</h2>
      <form onSubmit={handlesubmit}>
        {/* name */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Product Name</label>
          <input
            type="text"
            name="name"
            value={productData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        {/* description */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Description</label>
          <textarea
            name="description"
            value={productData.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
            rows={4}
            required
          />
        </div>
        {/* price */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Price</label>
          <input
            type="number"
            name="price"
            value={productData.price}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* CountInStock */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Count In Stock</label>
          <input
            type="number"
            name="CountInStock"
            value={productData.CountInStock}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* sku */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">SKU</label>
          <input
            type="text"
            name="sku"
            value={productData.sku}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* sizes */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">
            Sizes (comma-separated)
          </label>
          <input
            type="text"
            name="size"
            value={productData.size.join(", ")}
            onChange={(e) =>
              setProductData({
                ...productData,
                size: e.target.value.split(",").map((size) => size.trim()),
              })
            }
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* colors */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">
            colors (comma-separated)
          </label>
          <input
            type="text"
            name="colors"
            value={productData.colors.join(", ")}
            onChange={(e) =>
              setProductData({
                ...productData,
                colors: e.target.value.split(",").map((color) => color.trim()),
              })
            }
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* image upload */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Upload Images</label>
          <div className="flex items-center">
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300"
            >
              Choose Files
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          <div className="flex gap-4 mt-4">
            {productData.images.map((img, index) => (
              <div key={index}>
                <img
                  src={img.url}
                  alt={img.altText || "Product Image"}
                  className="w-20 h-20 object-cover rounded-md shadow-md"
                />
              </div>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors duration-300"
        >
          Update Products
        </button>
      </form>
    </div>
  );
};

export default EditProductPage;
