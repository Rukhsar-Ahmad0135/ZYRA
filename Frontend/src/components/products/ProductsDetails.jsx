/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { useEffect, useRef, useState } from "react";
import { useCart } from "../cart/useCart";
import { toast } from "sonner";
import ProductGrid from "./ProductGrid";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

const ProductsDetails = ({ productId }) => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { user, guestId } = useSelector((state) => state.auth);
  const { similarProducts, loading: reduxLoading, error: reduxError } = useSelector(
    (state) => state.products,
  );

  const { addToCart } = useCart();

  const effectiveProductId = productId || id;
  const [product, setProduct] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const [mainImage, setMainImage] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const addToCartTimerRef = useRef(null);

  useEffect(() => {
    const pid = effectiveProductId;
    if (!pid) return;

    setLocalLoading(true);
    setLocalError(null);

    let mounted = true;

    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/products/${pid}`)
      .then((res) => {
        if (!mounted) return;
        setProduct(res.data);
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setLocalError("Unable to load product");
      })
      .finally(() => {
        if (!mounted) return;
        setLocalLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [effectiveProductId]);

  useEffect(() => {
    if (!product?.images?.length) return;
    // setMainImage derived from product; avoid extra effect loops by only setting when changed
    const next = product.images[0]?.url || null;
    setMainImage((cur) => (cur === next ? cur : next));
  }, [product]);


  useEffect(
    () =>
      () => {
        if (addToCartTimerRef.current) {
          clearTimeout(addToCartTimerRef.current);
        }
      },
    [],
  );

  const handleDecQuantity = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncQuantity = () => setQuantity((q) => q + 1);

  const handleAddToCart = () => {
    if (isAddingToCart) return;
    if (!selectedColor || !selectedSize) {
      toast.error("Please select a color and size before adding to cart.");
      return;
    }

    // Cart drawer notification (component-level)
    addToCart({
      product,
      size: selectedSize,
      color: selectedColor,
      quantity,
    });

    toast.success(`${product?.name || "Product"} added successfully`, {
      description: `${quantity} item${quantity > 1 ? "s" : ""} added to your cart`,
      duration: 3000,
    });

    setIsAddingToCart(true);

    addToCartTimerRef.current = window.setTimeout(() => {
      setIsAddingToCart(false);
      addToCartTimerRef.current = null;
    }, 3000);

    // If you also rely on redux addToCart thunk, keep it here.
    // (Your cart slice uses addToCart too; we keep behavior consistent.)
    dispatch(
      {
        type: "cart/addToCart",
        payload: {
          productId: effectiveProductId,
          quantity,
          size: selectedSize,
          color: selectedColor,
          guestId,
          userId: user?._id,
        },
      },
    );
  };

  const showLoading = localLoading || reduxLoading;
  if (showLoading) return <p>Loading .....</p>;

  const showError = localError || reduxError;
  if (showError) return <p>Error {showError}</p>;

  if (!product?._id) return <p>Product not found.</p>;

  const colors = Array.isArray(product.colors) ? product.colors : [];
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg">
        <div className="flex flex-col md:flex-row">
          {/* left thumbnails */}
          <div className="hidden md:flex flex-col space-y-4 mr-6">
            {(product.images || []).map((img, idx) => (
              <img
                key={idx}
                src={img.url}
                alt={img.altText || `Thumbnail ${idx}`}
                className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${
                  mainImage === img.url ? "border-black" : "border-gray-300"
                }`}
                onClick={() => setMainImage(img.url)}
              />
            ))}
          </div>

          {/* main image */}
          <div className="md:w-1/2">
            <div className="mb-4">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt="Main Product"
                  className="w-full h-auto object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-100 bg-gray-100 rounded-lg" />
              )}
            </div>
          </div>

          {/* Mobile thumbnail */}
          <div className="md:hidden flex overscroll-x-scroll space-x-4 mb-4">
            {(product.images || []).map((img, idx) => (
              <img
                key={idx}
                src={img.url}
                alt={img.altText || `Thumbnail ${idx}`}
                className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${
                  mainImage === img.url ? "border-black" : "border-gray-300"
                }`}
                onClick={() => setMainImage(img.url)}
              />
            ))}
          </div>

          {/* Right details */}
          <div className="md:w-1/2 md:ml-10">
            <h1 className="text-2xl md:text-3xl font-semibold mb-2">{product.name}</h1>

            <p className="text-lg text-gray-600 mb-1 line-through">
              {product.originalPrice ? ` $${product.originalPrice}` : null}
            </p>
            <p className="text-xl text-gray-500 mb-2">${product.price}</p>
            <p className="text-gray-600 mb-4">{product.description}</p>

            <div className="mb-4">
              <p className="text-gray-700">Color:</p>
              <div className="flex gap-2 mt-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded-full border"
                    style={{
                      backgroundColor: color.toLowerCase(),
                      filter: "brightness(0.8)",
                      outline: selectedColor === color ? "2px solid #111" : "none",
                    }}
                    onClick={() => setSelectedColor(color)}
                    aria-pressed={selectedColor === color}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="mb-4"></div>
            <p className="text-gray-700">Size:</p>
            <div className="flex gap-2 mt-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  className="px-4 py-2 rounded border"
                  onClick={() => setSelectedSize(size)}
                  style={{
                    outline: selectedSize === size ? "2px solid #111" : "none",
                  }}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <p className="text-gray-700">Quantity:</p>
              <div className="flex items-center space-x-4 mt-2">
                <button
                  className="px-2 py-1 bg-gray-200 rounded border text-lg"
                  onClick={handleDecQuantity}
                >
                  -
                </button>
                <span className="text-lg">{quantity}</span>
                <button
                  className="px-2 py-1 bg-gray-200 rounded text-lg"
                  onClick={handleIncQuantity}
                >
                  +
                </button>
              </div>
            </div>

            <button
              className={`bg-black text-white py-2 px-6 rounded w-full mb-4 transition ${
                isAddingToCart ? "opacity-60 cursor-not-allowed" : "hover:bg-zinc-800"
              }`}
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? "Adding..." : "Add to Cart"}
            </button>

            <div className="mt-10 text-gray-700">
              <h3 className="text-xl font-bold mb-4">Characteristics</h3>
              <table className="w-full text-left text-sm text-gray-600">
                <tbody>
                  <tr>
                    <td className="py-1">Brand</td>
                    <td className="py-1">{product.brand}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Material</td>
                    <td className="py-1">{product.material}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl text-center font-medium mb-4">You May ALso Like</h2>
          <ProductGrid products={similarProducts} />
        </div>
      </div>
    </div>
  );
};

export default ProductsDetails;

