/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  addOutfitToCart,
  clearStylistAddedMessage,
  clearStylistResult,
  fetchStylistRecommendation,
  setStylistPrompt,
} from "../redux/slices/stylistSlice";
import { fetchCart } from "../redux/slices/cartSlice";

const SUGGESTIONS = [
  { label: "Casual college outfit for men", icon: "🎓" },
  { label: "Office formal look for women under $150", icon: "💼" },
  { label: "Weekend streetwear outfit", icon: "🛹" },
  { label: "Date night elegant look for women", icon: "✨" },
  { label: "Smart casual outfit for men", icon: "🍷" },
  { label: "Beach vacation look", icon: "🏖️" },
];

const Spinner = ({ className = "w-5 h-5" }) => (
  <span
    className={`inline-block ${className} border-2 border-white border-t-transparent rounded-full animate-spin`}
    aria-hidden="true"
  />
);

const ProductCard = ({ product, onAdd, adding }) => {
  const image = product.images?.[0]?.url;
  const price = Number(product.discountPrice || product.price) || 0;
  const original = Number(product.price) || 0;
  const onSale = original > price && price > 0;
  return (
    <div className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col">
      <Link to={`/products/${product._id}`} className="block">
        <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">
              No image
            </div>
          )}
          {onSale && (
            <span className="absolute top-2 left-2 bg-zyra-primary text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
              Sale
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-col flex-1 p-4">
        <p className="text-[11px] uppercase tracking-wider text-stone-500">
          {product.category} · {product.collections}
        </p>
        <Link
          to={`/products/${product._id}`}
          className="text-sm font-semibold text-stone-900 mt-1 line-clamp-2 hover:text-zyra-primary"
        >
          {product.name}
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-stone-900">${price.toFixed(2)}</span>
          {onSale && (
            <span className="text-xs text-stone-400 line-through">${original.toFixed(2)}</span>
          )}
        </div>
        {product.colors?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {product.colors.slice(0, 5).map((color) => (
              <span
                key={color}
                className="text-[10px] uppercase tracking-wider text-stone-600 border border-stone-200 rounded-full px-2 py-0.5"
              >
                {color}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto pt-4 flex gap-2">
          <Link
            to={`/products/${product._id}`}
            className="flex-1 text-center text-xs font-semibold uppercase tracking-wider text-stone-900 border border-stone-900 rounded-lg py-2 hover:bg-stone-900 hover:text-white transition-colors"
          >
            View
          </Link>
          <button
            type="button"
            onClick={() => onAdd(product)}
            disabled={adding}
            className="flex-1 text-xs font-semibold uppercase tracking-wider text-white bg-zyra-primary rounded-lg py-2 hover:bg-zyra-secondary disabled:opacity-50 transition-colors"
          >
            {adding ? <Spinner className="w-4 h-4 mx-auto" /> : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Stylist = () => {
  const dispatch = useDispatch();
  const { prompt, outfitName, summary, products, source, aiConfigured, aiError, loading, adding, error, addedMessage } =
    useSelector((state) => state.stylist);
  const user = useSelector((state) => state.auth?.user);
  const guestId = useSelector((state) => state.auth?.guestId);
  const userId = user?._id || user?.id || null;

  const [localPrompt, setLocalPrompt] = useState("");

  useEffect(() => {
    if (addedMessage) {
      toast.success(addedMessage);
      dispatch(clearStylistAddedMessage());
    }
  }, [addedMessage, dispatch]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = localPrompt.trim();
    if (!trimmed) {
      toast.error("Describe the outfit you want first.");
      return;
    }
    dispatch(setStylistPrompt(trimmed));
    dispatch(fetchStylistRecommendation(trimmed));
  };

  const handleSuggestion = (text) => {
    setLocalPrompt(text);
    dispatch(setStylistPrompt(text));
    dispatch(fetchStylistRecommendation(text));
  };

  const handleAddOne = (product) => {
    const item = {
      productId: product._id,
      size: (product.sizes && product.sizes[0]) || "M",
      color: (product.colors && product.colors[0]) || "",
      quantity: 1,
    };
    dispatch(
      addOutfitToCart({
        products: [product],
        guestId,
        userId,
      })
    ).then(() => dispatch(fetchCart({ userId, guestId })));
  };

  const handleAddAll = () => {
    if (!products || products.length === 0) return;
    dispatch(
      addOutfitToCart({
        products,
        guestId,
        userId,
      })
    ).then(() => dispatch(fetchCart({ userId, guestId })));
  };

  const handleClear = () => {
    setLocalPrompt("");
    dispatch(clearStylistResult());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-50">
      <section className="relative overflow-hidden border-b border-stone-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#fff7ed_0%,_transparent_60%),radial-gradient(circle_at_bottom_right,_#fee2e2_0%,_transparent_60%)] opacity-70" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <span className="inline-flex items-center gap-2 bg-stone-900 text-white text-[11px] font-semibold uppercase tracking-[0.25em] px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-zyra-primary animate-pulse" />
            New · AI Stylist
          </span>
          <h1 className="mt-6 text-3xl sm:text-5xl font-semibold tracking-tight text-stone-950">
            Tell us the vibe. <span className="text-zyra-primary">We'll dress you.</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-stone-600 text-sm sm:text-base leading-relaxed">
            Describe an occasion, mood, or budget and our stylist will pull a complete
            outfit using only real products in the ZYRA catalog. Try a suggestion below
            or write your own.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 bg-white rounded-2xl border border-stone-200 p-2 shadow-sm">
              <input
                type="text"
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                placeholder="e.g. Casual college outfit for men under $100"
                className="flex-1 px-4 py-3 bg-transparent text-stone-900 placeholder:text-stone-400 outline-none text-sm sm:text-base"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-stone-900 text-white text-sm font-semibold uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-zyra-primary disabled:opacity-60 transition-colors"
              >
                {loading ? <Spinner /> : null}
                {loading ? "Styling..." : "Generate outfit"}
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => handleSuggestion(s.label)}
                disabled={loading}
                className="text-xs sm:text-sm bg-white border border-stone-200 rounded-full px-3 py-1.5 text-stone-700 hover:border-stone-900 hover:text-stone-900 transition-colors disabled:opacity-50"
              >
                <span className="mr-1">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          <p className="mt-6 text-[11px] uppercase tracking-[0.25em] text-stone-400">
            {aiConfigured
              ? "Powered by AI · ZYRA catalog"
              : "Smart fallback · ZYRA catalog (add STYLIST_API_KEY for live AI)"}
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {(outfitName || products.length > 0) && (
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
                Your curated look
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-stone-950 mt-1">
                {outfitName || "AI Stylist Pick"}
              </h2>
              {summary && (
                <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl">
                  {summary}
                </p>
              )}
              {source === "fallback" && !aiConfigured && (
                <p className="mt-2 text-[11px] uppercase tracking-wider text-amber-700">
                  Local fallback used — set STYLIST_API_KEY in the backend .env for AI-driven picks.
                </p>
              )}
              {aiError && (
                <p className="mt-2 text-[11px] uppercase tracking-wider text-amber-700">
                  AI provider error: {aiError} — showing fallback.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold uppercase tracking-wider text-stone-700 border border-stone-300 rounded-lg px-4 py-2 hover:bg-stone-100"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleAddAll}
                disabled={adding || products.length === 0}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white bg-zyra-primary rounded-lg px-5 py-2.5 hover:bg-zyra-secondary disabled:opacity-50 transition-colors"
              >
                {adding ? <Spinner className="w-4 h-4" /> : null}
                {adding ? "Adding..." : `Add entire outfit (${products.length})`}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse"
              >
                <div className="aspect-[3/4] bg-stone-200" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-stone-200 rounded w-1/3" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAdd={handleAddOne}
                adding={adding}
              />
            ))}
          </div>
        )}

        {!loading && products.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="mx-auto w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-2xl">
              👗
            </div>
            <h3 className="mt-6 text-lg font-semibold text-stone-900">
              Your outfit will appear here
            </h3>
            <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto">
              Use the box above to describe what you're looking for — a casual
              hangout, a wedding guest look, a gym-ready set, anything. We'll
              match real products from the catalog.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Stylist;
