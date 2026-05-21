/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
//  */
// import { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import CartContents from "../cart/CartContents";
const CartDrawer = ({ drawerOpen, toggleCartDrawer }) => {
  const navigate = useNavigate();
  const handleCheckout = () => {
    toggleCartDrawer();
    navigate("/checkout");
  };
  return (
    <div
      className={`fixed top-0 right-0 w-3/4 sm:w-1/2 md:-[30rem] h-full bg-white shadow-lg transform transition-transform duration-300 flex flex-col z-50 ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      {/*close button*/}
      <div className="flex justify-end p-4">
        <button onClick={toggleCartDrawer}>
          <IoMdClose className="h-6 w-6 text-gray-600"></IoMdClose>
        </button>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-4">Your Cart</h2>
        {/* component for cart content */}
        <CartContents />
      </div>
      {/* checkout button fixed at the buttom */}
      <div className="p-4 bg-white sticky bottom-0">
        <button
          onClick={handleCheckout}
          className="w-full bg-black text-white py-3 rounded-lg font-semibold  hover:bg-gray-800 transition duration-300"
        >
          Checkout
        </button>
        <p className="text-sm tracking-tight text-gray-500 mt-2 text-center">
          Shipping, taxes, and discounts calculated at checkout.
        </p>
      </div>
    </div>
  );
};

export default CartDrawer;
