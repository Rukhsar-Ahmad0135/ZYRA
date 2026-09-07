/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 *
 * Price formatting utilities for ZYRA e-commerce
 * Prices are stored in USD
 */

export const formatPrice = (price, currency = "USD") => {
  if (price === null || price === undefined || isNaN(price)) return "$0.00";

  const numPrice = Number(price);

  if (currency === "USD") {
    return `$${numPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `${currency} ${numPrice.toFixed(2)}`;
};

export const formatPriceRaw = (price, currency = "USD") => {
  if (price === null || price === undefined || isNaN(price)) return 0;

  const numPrice = Number(price);
  return numPrice;
};

export default { formatPrice, formatPriceRaw };
