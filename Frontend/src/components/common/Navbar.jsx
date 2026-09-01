/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { Link } from "react-router-dom";
import { useState } from "react";
import { HiOutlineShoppingBag, HiBars3BottomRight } from "react-icons/hi2";
import { IoMdClose } from "react-icons/io";
import { Show, UserButton, useUser } from "@clerk/react";
import { useSelector } from "react-redux";
import CartDrawer from "../layout/CartDrawer";
import Searchbar from "./Searchbar";
import { useCart } from "../cart/useCart";
import { useDispatch } from "react-redux";

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const { user: clerkUser } = useUser();
  const { cartCount } = useCart();
  const dispatch = useDispatch();

  const cartItemCount = cartCount;

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const handleAdminLogout = () => {
    dispatch({ type: "auth/logout" });
    window.location.href = "/admin";
  };

  const toggleNavDrawer = () => {
    setNavDrawerOpen(!navDrawerOpen);
  };
  const toggleCartDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <div>
      <nav className="container mx-auto flex items-center justify-between py-4 px-6">
        {/* left lgo*/}
        <div>
          <Link to="/" className="text-2xl font-medium">
            ZYRA
          </Link>
        </div>
        {/* center navigation link */}
        <div className="hidden md:flex space-x-6">
          <Link
            to="/collections/all?gender=Men"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Men
          </Link>
          <Link
            to="/collections/all?gender=Women"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Women
          </Link>
          <Link
            to="/collections/all?category=Top Wear"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Top Wear
          </Link>
          <Link
            to="/collections/all?category=Bottom Wear"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Bottom Wear
          </Link>
          <Link
            to="/stylist"
            className="text-zyra-primary hover:text-zyra-secondary text-sm font-semibold uppercase inline-flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-zyra-primary animate-pulse" />
            AI Stylist
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Show when="signed-in">
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <Link
                  to="/admin"
                  className="block bg-black px-2 rounded text-sm text-white hover:bg-gray-800"
                >
                  Admin
                </Link>
                <button
                  onClick={handleAdminLogout}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                >
                  Admin Logout
                </button>
              </div>
            )}
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-black"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                {clerkUser?.imageUrl ? (
                  <img
                    src={clerkUser.imageUrl}
                    alt={clerkUser.fullName || clerkUser.username || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (clerkUser?.firstName || clerkUser?.username || "U")
                    .slice(0, 1)
                    .toUpperCase()
                )}
              </span>
              <span className="max-w-35 truncate">
                {clerkUser?.fullName ||
                  clerkUser?.username ||
                  user?.name ||
                  "Profile"}
              </span>
            </Link>
            <div className="rounded-full border border-gray-200 bg-white p-1 shadow-sm">
              <UserButton />
            </div>
          </Show>
          <Show when="signed-out">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-black"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium text-gray-700 hover:text-black"
            >
              Register
            </Link>
          </Show>
          <button
            onClick={toggleCartDrawer}
            className="relative hover:text-black"
          >
            <HiOutlineShoppingBag className="h-6 w-6 text-gray-700"></HiOutlineShoppingBag>
            {cartItemCount > 0 && (
              <span className="absolute -top-1 bg-zyra text-white text-xs rounded-full px-2 py-0.5">
                {cartItemCount}
              </span>
            )}
          </button>
          {/* Search */}
          <div className="overflow-hidden">
            <Searchbar></Searchbar>
          </div>
          <button onClick={toggleNavDrawer} className="md:hidden">
            <HiBars3BottomRight className="h-6 w-6 text-gray-700"></HiBars3BottomRight>
          </button>
        </div>
      </nav>
      <CartDrawer
        drawerOpen={drawerOpen}
        toggleCartDrawer={toggleCartDrawer}
      ></CartDrawer>
      {/* Mobile navigation */}
      <div
        className={`fixed top-0 left-0 w-3/4 sm:w-1/2 md:w-1/3 h-full bg-white shadow-lg transform transition-transform duration-300 z-50 ${navDrawerOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"}`}
      >
        <div className="flex justify-end p-4">
          <button onClick={toggleNavDrawer}>
            <IoMdClose className="h-6 w-6 text-gray-600"></IoMdClose>
          </button>
        </div>
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Menu</h2>
          <nav className="space-y-4">
            <Link
              to="/collections/all?gender=Men"
              onClick={toggleNavDrawer}
              className="block text-gray-600 hover:text-black"
            >
              Men
            </Link>
            <Link
              to="/collections/all?gender=Women"
              onClick={toggleNavDrawer}
              className="block text-gray-600 hover:text-black"
            >
              Women
            </Link>
            <Link
              to="/collections/all?category=Top Wear"
              onClick={toggleNavDrawer}
              className="block text-gray-600 hover:text-black"
            >
              Top Wear
            </Link>
            <Link
              to="/collections/all?category=Bottom Wear"
              onClick={toggleNavDrawer}
              className="block text-gray-600 hover:text-black"
            >
              Bottom Wear
            </Link>
            <Link
              to="/stylist"
              onClick={toggleNavDrawer}
              className="block text-zyra-primary hover:text-zyra-secondary font-semibold"
            >
              ✨ AI Stylist
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
