/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { RiDeleteBin3Line } from "react-icons/ri";
import { useCart } from "./useCart";

const CartContents = ({ cart }) => {
  const { items, updateQuantity, removeItem } = useCart();

  // Determine which products to render
  const products = cart?.products || items;

  if (!products || products.length === 0) {
    return (
      <div>
        <p className="text-gray-600">Your cart is empty.</p>
      </div>
    );
  }

  const handleQuantityChange = (product, delta) => {
    const newQty = product.quantity + delta;
    if (newQty <= 0) {
      removeItem({
        productId: product.productId,
        size: product.size,
        color: product.color,
      });
    } else {
      updateQuantity({
        productId: product.productId,
        size: product.size,
        color: product.color,
        quantity: newQty,
      });
    }
  };

  const handleRemove = (product) => {
    removeItem({
      productId: product.productId,
      size: product.size,
      color: product.color,
    });
  };

  return (
    <div>
      {products.map((product, index) => {
        const key =
          product.productId +
          "-" +
          (product.size || "") +
          "-" +
          (product.color || "") +
          "-" +
          index;
        return (
          <div key={key} className="flex items-start justify-between py-4 border-b">
            <div className="flex items-start">
              <img
                src={product.image}
                alt={product.name}
                className="w-20 h-24 object-cover mr-4 rounded"
              />
              <div>
                <h3>{product.name}</h3>
                <p className="text-sm text-gray-500">
                  {" "}
                  size:{product.size}| color:{product.color}
                </p>
                <div className="flex items-center mt-2">
                  <button
                    className="border rounded px-2 py-1 text-xl font-medium"
                    onClick={() => handleQuantityChange(product, -1)}
                  >
                    -
                  </button>
                  <span className="mx-4">{product.quantity}</span>
                  <button
                    className="border rounded px-2 py-1 text-xl font-medium"
                    onClick={() => handleQuantityChange(product, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <div>
              <p>${(product.price * product.quantity).toFixed(2)}</p>
              <button onClick={() => handleRemove(product)}>
                <RiDeleteBin3Line className="h-6 w-6 mt-2" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CartContents;
