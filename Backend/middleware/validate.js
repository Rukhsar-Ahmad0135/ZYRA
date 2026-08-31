/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { body, param, query, validationResult } from "express-validator";
import mongoose from "mongoose";

/**
 * Runs validation rules and returns a 400 with a consistent error shape.
 *
 * Response shape on failure:
 *   { message: string, errors: [{ field, message }] }
 *
 * Falls back to the first error's message for legacy clients that read
 * `message` directly.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const formatted = errors.array({ onlyFirstError: true }).map((e) => ({
    field: e.path || e.param,
    message: e.msg,
  }));
  return res.status(400).json({
    message: formatted[0]?.message || "Validation failed",
    errors: formatted,
  });
};

/**
 * Validates that a route param is a valid MongoDB ObjectId.
 */
export const validateObjectId = (paramName = "id") =>
  param(paramName).custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error("Invalid id format");
    }
    return true;
  });

/* ------------------------------------------------------------------ */
/*  Shared field validators                                            */
/* ------------------------------------------------------------------ */

export const nameValidator = () =>
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters");

export const emailValidator = () =>
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail();

export const passwordValidator = () =>
  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .bail()
    .custom((value) => {
      // Reject all-whitespace / trivially broken passwords.
      if (typeof value !== "string") {
        throw new Error("Password must be a string");
      }
      if (value.trim() !== value) {
        throw new Error("Password must not contain leading or trailing whitespace");
      }
      return true;
    });

export const roleValidator = () =>
  body("role")
    .optional()
    .isIn(["customer", "admin"])
    .withMessage("Role must be either 'customer' or 'admin'");

export const skuValidator = () =>
  body("sku").trim().notEmpty().withMessage("SKU is required");

export const priceValidator = () =>
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a number greater than or equal to 0");

export const countInStockValidator = () =>
  body("countInStock")
    .isInt({ min: 0 })
    .withMessage("Count in stock must be a non-negative integer");

export const genderValidator = () =>
  body("gender")
    .optional()
    .isIn([
      // Canonical taxonomy
      "Men",
      "Women",
      "Unisex",
      // Legacy values accepted for backward compatibility
      "male",
      "female",
      "unisex",
      "men",
      "women",
    ])
    .withMessage("Invalid gender value");


export const imagesValidator = () =>
  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array")
    .custom((images) =>
      images.every(
        (img) =>
          img &&
          typeof img.url === "string" &&
          /^https?:\/\//.test(img.url) &&
          // publicId is optional but must be a non-empty string when present
          (img.publicId === undefined ||
            img.publicId === null ||
            img.publicId === "" ||
            typeof img.publicId === "string")
      )
    )
    .withMessage(
      "Each image must have a valid http(s) url; publicId is optional but must be a string when present"
    );

export const quantityValidator = (field = "quantity") =>
  body(field)
    .isInt({ min: 1, max: 9999 })
    .withMessage("Quantity must be between 1 and 9999");

export const paginationValidator = () => [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Page size must be between 1 and 100"),
];

export const shippingAddressValidator = () => [
  body("shippingAddress.address")
    .trim()
    .notEmpty()
    .withMessage("Address is required"),
  body("shippingAddress.city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),
  body("shippingAddress.postalCode")
    .trim()
    .notEmpty()
    .withMessage("Postal code is required"),
  body("shippingAddress.country")
    .trim()
    .notEmpty()
    .withMessage("Country is required"),
];

export const checkoutItemsValidator = () =>
  body("checkoutItems")
    .isArray({ min: 1 })
    .withMessage("At least one checkout item is required")
    .custom((items) =>
      items.every(
        (item) =>
          item &&
          typeof item.productId === "string" &&
          typeof item.name === "string" &&
          typeof item.price === "number" &&
          typeof item.quantity === "number" &&
          item.quantity > 0,
      ),
    )
    .withMessage(
      "Each checkout item must include productId, name, price (number) and quantity (positive number)",
    );

export const paymentMethodValidator = () =>
  body("paymentMethod")
    .trim()
    .notEmpty()
    .withMessage("Payment method is required");

export const totalPriceValidator = () =>
  body("totalPrice")
    .isFloat({ min: 0 })
    .withMessage("Total price must be a non-negative number");

