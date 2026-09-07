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
  processRecommendation,
  lockProduct,
  unlockProduct,
  clearOutfitSession,
  stylistChat,
  addOutfitToCart,
  clearStylistAddedMessage,
  clearSession,
  setStylistPrompt
} from "../redux/slices/stylistSlice";
import { fetchCart } from "../redux/slices/cartSlice";
import { formatPrice } from "../utils/priceUtils";

const SUGGESTIONS = [
  { label: "Casual college outfit for men", icon: "🎓" },
  { label: "Office formal look for women", icon: "💼" },
  { label: "Weekend streetwear outfit", icon: "🛹" },
  { label: "Date night elegant look", icon: "✨" },
  { label: "Smart casual for men", icon: "🍷" },
  { label: "Beach vacation look", icon: "🏖️" },
];

const Spinner = ({ className = "w-5 h-5" }) => (
  <span
    className={`inline-block ${className} border-2 border-white border-t-transparent rounded-full animate-spin`}
    aria-hidden="true"
  />
);

const LockIcon = ({ locked }) => (
  <svg
    className={`w-4 h-4 ${locked ? "text-amber-500" : "text-stone-400"}`}
    fill={locked ? "currentColor" : "none"}
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    {locked ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    )}
  </svg>
);

const ProductCard = ({ product, onAdd, adding, onToggleLock, isLocked, canModify }) => {
  const image = product.images?.[0]?.url;
  const price = Number(product.discountPrice || product.price) || 0;
  const original = Number(product.price) || 0;
  const onSale = original > price && price > 0;

  return (
    <div className={`group bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col relative ${isLocked ? "border-amber-400 ring-2 ring-amber-100" : "border-stone-200"}`}>
      {isLocked && (
        <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1">
          <LockIcon locked />
          Locked
        </div>
      )}

      {canModify && (
        <button
          type="button"
          onClick={() => onToggleLock(product)}
          className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${
            isLocked
              ? "bg-amber-100 hover:bg-amber-200 text-amber-600"
              : "bg-white/90 hover:bg-stone-100 text-stone-500"
          }`}
          title={isLocked ? "Unlock item (allow changes)" : "Lock item (keep in outfit)"}
        >
          <LockIcon locked={isLocked} />
        </button>
      )}

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
            <span className="absolute bottom-2 left-2 bg-zyra-primary text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
              Sale
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-4">
        <p className="text-[11px] uppercase tracking-wider text-stone-500">
          {product.category}
        </p>
        <Link
          to={`/products/${product._id}`}
          className="text-sm font-semibold text-stone-900 mt-1 line-clamp-2 hover:text-zyra-primary"
        >
          {product.name}
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-stone-900">{formatPrice(price, "USD")}</span>
          {onSale && (
            <span className="text-xs text-stone-400 line-through">{formatPrice(original, "USD")}</span>
          )}
        </div>
        {product.colors?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.colors.slice(0, 4).map((color) => (
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
          {onAdd && !isLocked && (
            <button
              type="button"
              onClick={() => onAdd(product)}
              disabled={adding}
              className="flex-1 text-xs font-semibold uppercase tracking-wider text-white bg-zyra-primary rounded-lg py-2 hover:bg-zyra-secondary disabled:opacity-50 transition-colors"
            >
              {adding ? <Spinner className="w-4 h-4 mx-auto" /> : "Add"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const OutfitSummary = ({ outfitState, lockedItems, onRemove, onClearSession, onStartNew }) => {
  if (!outfitState || outfitState.items?.length === 0) return null;

  const lockedIds = lockedItems?.map(l => l.productId) || [];

  return (
    <div className="bg-gradient-to-r from-stone-100 to-stone-50 rounded-2xl p-5 mb-6 border border-stone-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">
            {outfitState.name || "Your Outfit"}
          </h3>
          <p className="text-sm text-stone-600">
            {outfitState.items?.length || 0} items
            {lockedItems?.length > 0 && ` · ${lockedItems.length} locked`}
            · Total: {formatPrice(outfitState.totalPrice || 0, "USD")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onStartNew}
            className="text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-stone-900 transition-colors"
          >
            New outfit
          </button>
          <button
            type="button"
            onClick={onClearSession}
            className="text-xs font-semibold uppercase tracking-wider text-red-600 hover:text-red-700 transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {outfitState.items?.map((item) => (
          <div key={item.productId} className="flex-shrink-0 text-center">
            <div className="relative w-20">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className={`w-20 h-20 object-cover rounded-lg ${lockedIds.includes(item.productId) ? "ring-2 ring-amber-400" : ""}`}
                />
              ) : (
                <div className="w-20 h-20 bg-stone-200 rounded-lg flex items-center justify-center text-xs text-stone-500">
                  No img
                </div>
              )}
              {lockedIds.includes(item.productId) && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                  <LockIcon locked />
                </div>
              )}
              {!lockedIds.includes(item.productId) && (
                <button
                  type="button"
                  onClick={() => onRemove(item.productId)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm text-stone-400 hover:text-red-600 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
            <p className="text-[10px] text-stone-600 mt-1 truncate w-20">{item.name}</p>
            <p className="text-[10px] font-semibold text-stone-900">{formatPrice(item.price, "USD")}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ContextBadge = ({ context }) => {
  if (!context || (!context.gender && !context.style && !context.occasion)) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3 justify-center">
      {context.gender && (
        <span className="text-xs bg-stone-800 text-white px-3 py-1 rounded-full capitalize">
          {context.gender}
        </span>
      )}
      {context.style && (
        <span className="text-xs bg-zyra-primary/10 text-zyra-primary px-3 py-1 rounded-full capitalize">
          {context.style}
        </span>
      )}
      {context.occasion && (
        <span className="text-xs bg-stone-200 text-stone-700 px-3 py-1 rounded-full capitalize">
          {context.occasion}
        </span>
      )}
      {context.budget && (
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
          Under ${context.budget}
        </span>
      )}
    </div>
  );
};

const Stylist = () => {
  const dispatch = useDispatch();
  const {
    sessionId,
    outfitName,
    summary,
    products,
    source,
    aiConfigured,
    loading,
    adding,
    error,
    addedMessage,
    lockedItems,
    outfitState,
    context,
    chatMessages,
    ragConfigured,
    provider
  } = useSelector((state) => state.stylist);
  const user = useSelector((state) => state.auth?.user);
  const guestId = useSelector((state) => state.auth?.guestId);
  const userId = user?._id || user?.id || null;

  const [localPrompt, setLocalPrompt] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (addedMessage) {
      toast.success(addedMessage);
      dispatch(clearStylistAddedMessage());
    }
  }, [addedMessage, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = localPrompt.trim();
    if (!trimmed) {
      toast.error("Describe what you want first!");
      return;
    }
    dispatch(setStylistPrompt(trimmed));
    dispatch(processRecommendation({ prompt: trimmed, sessionId }));
  };

  const handleSuggestion = (text) => {
    setLocalPrompt(text);
    dispatch(setStylistPrompt(text));
    dispatch(processRecommendation({ prompt: text, sessionId }));
  };

  const handleToggleLock = (product) => {
    if (!sessionId) return;

    const isLocked = lockedItems?.some(l => l.productId === product._id);
    if (isLocked) {
      dispatch(unlockProduct({ sessionId, productId: product._id }));
      toast.info("Item unlocked - AI can now change it");
    } else {
      dispatch(lockProduct({ sessionId, productId: product._id, category: product.category }));
      toast.success("Item locked - AI will keep this item");
    }
  };

  const handleRemoveItem = (productId) => {
    const isLocked = lockedItems?.some(l => l.productId === productId);
    if (isLocked) {
      toast.error("Unlock the item first before removing");
      return;
    }
    const prompt = `Remove the item with ID ${productId}`;
    dispatch(processRecommendation({ prompt, sessionId }));
  };

  const handleAddOne = (product) => {
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

  const handleStartNew = () => {
    if (sessionId) {
      dispatch(clearOutfitSession(sessionId));
    }
    setLocalPrompt("");
    dispatch(clearSession());
  };

  const handleClearSession = () => {
    if (sessionId) {
      dispatch(clearOutfitSession(sessionId));
    }
    dispatch(clearSession());
  };

  const handleChatSubmit = (event) => {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    if (!sessionId) {
      toast.error("Generate an outfit first, then chat!");
      return;
    }
    dispatch(stylistChat({ prompt: trimmed, sessionId }));
    setChatInput("");
  };

  const lockedIds = lockedItems?.map(l => l.productId) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-50">
      <section className="relative overflow-hidden border-b border-stone-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#fff7ed_0%,_transparent_60%),radial-gradient(circle_at_bottom_right,_#fee2e2_0%,_transparent_60%)] opacity-70" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <span className="inline-flex items-center gap-2 bg-stone-900 text-white text-[11px] font-semibold uppercase tracking-[0.25em] px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-zyra-primary animate-pulse" />
            AI Fashion Stylist
          </span>
          <h1 className="mt-6 text-3xl sm:text-5xl font-semibold tracking-tight text-stone-950">
            Tell us the vibe. <span className="text-zyra-primary">We'll dress you.</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-stone-600 text-sm sm:text-base leading-relaxed">
            Describe an occasion, mood, or budget. Lock items you want to keep, and ask for changes.
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
                {loading ? "Styling..." : "Generate"}
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

          {sessionId && <ContextBadge context={context} />}

          <div className="mt-4 flex items-center justify-center gap-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400">
              {provider ? `Powered by ${provider}` : "Configure AI for recommendations"}
            </p>
            {sessionId && (
              <button
                type="button"
                onClick={() => setShowChat(!showChat)}
                className="text-[11px] uppercase tracking-wider text-zyra-primary hover:text-zyra-secondary transition-colors"
              >
                {showChat ? "Hide chat" : "Chat"}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {showChat && sessionId && (
          <div className="mb-6 bg-white rounded-2xl border border-stone-200 p-4">
            <h3 className="text-sm font-semibold text-stone-900 mb-3">Chat with ZARA</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user" ? "bg-zyra-primary text-white" : "bg-stone-100 text-stone-900"
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Change the shirt, add accessories..."
                className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-zyra-primary"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !chatInput.trim()}
                className="bg-zyra-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-zyra-secondary disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {sessionId && (
          <OutfitSummary
            outfitState={outfitState}
            lockedItems={lockedItems}
            onRemove={handleRemoveItem}
            onClearSession={handleClearSession}
            onStartNew={handleStartNew}
          />
        )}

        {(outfitName || products.length > 0) && (
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Your look</p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-stone-950 mt-1">
                {outfitName || "AI Stylist Pick"}
              </h2>
              {summary && (
                <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl">
                  {summary}
                </p>
              )}
              {lockedItems?.length > 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  {lockedItems.length} item{lockedItems.length !== 1 ? "s" : ""} locked. Locked items won't be changed.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleStartNew}
                className="text-xs font-semibold uppercase tracking-wider text-stone-700 border border-stone-300 rounded-lg px-4 py-2 hover:bg-stone-100"
              >
                New
              </button>
              <button
                type="button"
                onClick={handleAddAll}
                disabled={adding || products.length === 0}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white bg-zyra-primary rounded-lg px-5 py-2.5 hover:bg-zyra-secondary disabled:opacity-50 transition-colors"
              >
                {adding ? <Spinner className="w-4 h-4" /> : null}
                {adding ? "Adding..." : `Add all (${products.length})`}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
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
                onToggleLock={handleToggleLock}
                isLocked={lockedIds.includes(product._id)}
                canModify={sessionId}
              />
            ))}
          </div>
        )}

        {!loading && products.length === 0 && !sessionId && (
          <div className="text-center py-20">
            <div className="mx-auto w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-2xl">
              👗
            </div>
            <h3 className="mt-6 text-lg font-semibold text-stone-900">
              Your outfit will appear here
            </h3>
            <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto">
              Describe what you're looking for and the AI will create an outfit.
              Lock items you want to keep, then ask for changes.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Stylist;
