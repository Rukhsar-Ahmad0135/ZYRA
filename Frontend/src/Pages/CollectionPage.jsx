/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { useEffect, useRef, useState } from "react";
import { FaFilter } from "react-icons/fa";
import FilterSidebar from "../components/products/FilterSidebar";
import ProductGrid from "../components/products/ProductGrid";
import Sortoption from "../components/products/Sortoption";
import { useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByCollection } from "../redux/slices/productSlice";

const CollectionPage = () => {
  const { collection } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const queryParams = Object.fromEntries([...searchParams]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  useEffect(() => {
    dispatch(fetchProductsByCollection({ collection, ...queryParams }));
  }, [dispatch, collection, searchParams]);
  const toggleSidebar = () => {
    setIsSidebarOpen((currentValue) => !currentValue);
  };

  const handleClickOutside = (event) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     const fetchedProducts = [
  //       {
  //         id: 1,
  //         name: "Casual Shirt",
  //         price: 19.99,
  //         image: [{ url: "https://picsum.photos/500/500?random=3" }],
  //       },
  //       {
  //         id: 2,
  //         name: "Denim Jeans",
  //         price: 39.99,
  //         image: [{ url: "https://picsum.photos/500/500?random=4" }],
  //       },
  //       {
  //         id: 3,
  //         name: "Denim Jeans",
  //         price: 39.99,
  //         image: [{ url: "https://picsum.photos/500/500?random=5" }],
  //       },
  //       {
  //         id: 4,
  //         name: "Denim Jeans",
  //         price: 39.99,
  //         image: [{ url: "https://picsum.photos/500/500?random=6" }],
  //       },
  //       {
  //         id: 5,
  //         name: "Casual Shirt",
  //         price: 19.99,
  //         image: [{ url: "https://picsum.photos/500/500?random=7" }],
  //       },
  //       {
  //         id: 6,
  //         name: "Denim Jeans",
  //         price: 39.99,
  //         image: [{ url: "https://picsum.photos/500/500?random=8" }],
  //       },
  //       {
  //         id: 7,
  //         name: "Denim Jeans",
  //         price: 39.99,
  //         image: [{ url: "https://picsum.photos/500/500?random=9" }],
  //       },
  //       {
  //         id: 8,
  //         name: "Denim Jeans",
  //         price: 39.99,
  //         image: [{ url: "https://picsum.photos/500/500?random=10" }],
  //       },
  //     ];

  //     setProducts(fetchedProducts);
  //     setLoading(false);
  //   }, 1000);

  //   return () => clearTimeout(timer);
  // }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:hidden">
        <button
          onClick={toggleSidebar}
          className="border p-2 flex items-center justify-center rounded-md"
        >
          <FaFilter className="mr-2" />
          Filter
        </button>
      </div>

      <div
        ref={sidebarRef}
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 bg-white overflow-y-auto transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0`}
      >
        <FilterSidebar />
      </div>
      <div className="flex-grow p-4">
        <h2 className="text-2xl uppercase mb-4">All Collections</h2>
        {/* sort option */}
        <Sortoption />
        {/* product grid */}
        <ProductGrid products={products} loading={loading} error={error} />
      </div>

      {/* <main className="flex-1">
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            Loading products...
          </div>
        ) : products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="py-12 text-center text-gray-500">
            No products found.
          </div>
        )}
      </main> */}
    </div>
  );
};

export default CollectionPage;
