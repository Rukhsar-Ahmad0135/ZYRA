/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import React, { useEffect } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
const NewArrivals = () => {
  const scrollRef = React.useRef(null);
  // Scroll helpers (used for showing can/cannot scroll state)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const [newArrivals, setNewArrivals] = useState([]);
  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl || typeof baseUrl !== "string") {
          console.error(
            "Missing or invalid VITE_BACKEND_URL. Set it in Frontend/.env (example: VITE_BACKEND_URL=http://localhost:5000/)."
          );
          return;
        }

        const normalizedBaseUrl = baseUrl.endsWith("/")
          ? baseUrl.slice(0, -1)
          : baseUrl;

        const response = await axios.get(
          `${normalizedBaseUrl}/api/products/new-arrivals`
        );
        setNewArrivals(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchNewArrivals();
  }, []);
  // // eslint-disable-next-line no-unused-vars
  // const newArrivals = [
  //   {
  //     _id: "1",
  //     name: "Stylish Jacket",
  //     price: 79.99,
  //     Image: [
  //       {
  //         url: "https://picsum.photos/500/500?random=1",
  //         altText: "Stylish Jacket",
  //       },
  //     ],
  //   },
  //   {
  //     _id: "2",
  //     name: "Stylish Shirt",
  //     price: 29.99,
  //     Image: [
  //       {
  //         url: "https://picsum.photos/500/500?random=2",
  //         altText: "Stylish Shirt",
  //       },
  //     ],
  //   },
  //   {
  //     _id: "3",
  //     name: "Stylish Pants",
  //     price: 49.99,
  //     Image: [
  //       {
  //         url: "https://picsum.photos/500/500?random=3",
  //         altText: "Stylish Pants",
  //       },
  //     ],
  //   },
  //   {
  //     _id: "4",
  //     name: "Skirt",
  //     price: 39.99,
  //     Image: [
  //       {
  //         url: "https://picsum.photos/500/500?random=4",
  //         altText: "Skirt",
  //       },
  //     ],
  //   },
  //   {
  //     _id: "5",
  //     name: "Coat",
  //     price: 45.99,
  //     Image: [
  //       {
  //         url: "https://picsum.photos/500/500?random=5",
  //         altText: "Coat",
  //       },
  //     ],
  //   },
  //   {
  //     _id: "6",
  //     name: "Long Coat",
  //     price: 32.99,
  //     Image: [
  //       {
  //         url: "https://picsum.photos/500/500?random=6",
  //         altText: "Long Coat",
  //       },
  //     ],
  //   },
  //   {
  //     _id: "7",
  //     name: "Baggy Pants",
  //     price: 19.99,
  //     Image: [
  //       {
  //         url: "https://picsum.photos/500/500?random=7",
  //         altText: "Baggy Pants",
  //       },
  //     ],
  //   },
  //   {
  //     _id: "8",
  //     name: "Boxey shirt",
  //     price: 14.99,
  //     Image: [
  //       {
  //         url: "https://picsum.photos/500/500?random=8",
  //         altText: "Boxey shirt",
  //       },
  //     ],
  //   },
  // ];

  const [isDragging, setIsDragging] = React.useState(false);
  const startXRef = React.useRef(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = x - startXRef.current;
    scrollRef.current.scrollLeft -= walk;
    startXRef.current = x;
  };
  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const scroll = (direction) => {
    const scrollAmount = direction === "left" ? -300 : 300;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  //update scroll buttons state
  const updateScrollButtons = () => {
    const container = scrollRef.current;
    if (container) {
      const leftScroll = container.scrollLeft;
      const rightScrollable =
        container.scrollWidth > leftScroll + container.clientWidth;
      setCanScrollLeft(leftScroll > 0);
      setCanScrollRight(rightScrollable);
    }
    // console.log({
    //   scrollLeft: container.scrollLeft,
    //   clientWidth: container.clientWidth,
    //   containerScrollWidth: container.scrollWidth,
    //   offsetLeft: scrollRef.current.offsetLeft,
    // });
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      updateScrollButtons(); // Initial check
      return () => container.removeEventListener("scroll", updateScrollButtons);
    }
  }, [newArrivals]);
  return (
    <section className="py-16 px-4 lg:px-0">
      <div className="container mx-auto text-center mb-10 relative">
        <h3 className="text-3xl font-bold mb-4"> Explore New Arrivals </h3>
        <p className="text-gray-500 text-sm mb-6">
          Discover the latest style straight off the runway, freshly added to
          keep your wardrobe on the cutting edge of fashion.
        </p>
        {/* scroll buttons */}
        <div className="absolute right-0 bottom-[-30px] flex space-x-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`p-2 rounded border ${
              canScrollLeft
                ? "bg-white text-black"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <FiChevronLeft className="text-2xl" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`p-2 rounded border ${
              canScrollRight
                ? "bg-white text-black"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <FiChevronRight className="text-2xl" />
          </button>
        </div>
      </div>
      {/* scrollable content */}
      <div
        ref={scrollRef}
        className={`container mx-auto overflow-x-scroll flex space-x-6 relative ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        {newArrivals.map((products) => (
          <div
            key={products._id}
            className="min-w-[100%] sm:min-w-[50%] lg:min-w-[30%] relative"
          >
            <img
              src={
                // backend model uses `images: [{ url, altText }]`
                products.images?.[0]?.url || products.Image?.[0]?.url
              }
              alt={
                products.images?.[0]?.altText ||
                products.Image?.[0]?.altText ||
                products.name
              }
              className="w-full h-[500px] object-cover rounded-lg"
              draggable="false"
              loading="lazy"
            />
            <div className="absolute bottom-0 left-0 right-0  bg-opacity-50 backdrop-blur-md text-white p-4 rounded-b-lg">
              <Link to={`/products/${products._id}`} className="block">
                <h4 className="font-medium">{products.name}</h4>
                <p className="mt-1">${products.price}</p>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NewArrivals;
