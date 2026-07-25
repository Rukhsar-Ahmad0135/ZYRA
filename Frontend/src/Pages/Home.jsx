/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import Hero from "../components/layout/Hero";
import GenderProductSection from "../components/products/GenderProductSection";
import NewArrivals from "../components/products/NewArrivals";
import ProdcutDetails from "../components/products/ProductsDetails";
import ProductGrid from "../components/products/ProductGrid";
import FeaturedCollection from "../components/products/FeaturedCollection";
import FeaturesSection from "../components/products/FeaturesSection";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByCollection } from "../redux/slices/productSlice";
import { useEffect } from "react";
import { useState } from "react";
import axios from "axios";
// const placeholderProducts = [
//   {
//     id: 1,
//     name: "Casual Shirt",
//     price: 19.99,
//     image: [{ url: "https://picsum.photos/500/500?random=3" }],
//   },
//   {
//     id: 2,
//     name: "Denim Jeans",
//     price: 39.99,
//     image: [{ url: "https://picsum.photos/500/500?random=4" }],
//   },
//   {
//     id: 3,
//     name: "Denim Jeans",
//     price: 39.99,
//     image: [{ url: "https://picsum.photos/500/500?random=5" }],
//   },
//   {
//     id: 4,
//     name: "Denim Jeans",
//     price: 39.99,
//     image: [{ url: "https://picsum.photos/500/500?random=6" }],
//   },
//   {
//     id: 5,
//     name: "Casual Shirt",
//     price: 19.99,
//     image: [{ url: "https://picsum.photos/500/500?random=7" }],
//   },
//   {
//     id: 6,
//     name: "Denim Jeans",
//     price: 39.99,
//     image: [{ url: "https://picsum.photos/500/500?random=8" }],
//   },
//   {
//     id: 7,
//     name: "Denim Jeans",
//     price: 39.99,
//     image: [{ url: "https://picsum.photos/500/500?random=9" }],
//   },
//   {
//     id: 8,
//     name: "Denim Jeans",
//     price: 39.99,
//     image: [{ url: "https://picsum.photos/500/500?random=10" }],
//   },
// ];

const Home = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const [bestSellersProduct, setBestSellersProduct] = useState(null);
  useEffect(() => {
    //fetch products for a specfic collection
    dispatch(
      fetchProductsByCollection({
        gender: "Women",
        category: "Top Wear",
        limit: 8,
      }),
    );
    //Fetch best sellers products
    const fetchBestSeller = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/products/best-seller`,
        );
        setBestSellersProduct(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchBestSeller();
  }, [dispatch]);
  return (
    <div>
      <Hero></Hero>
      <GenderProductSection></GenderProductSection>
      <NewArrivals></NewArrivals>
      {/* best sellers */}
      <h2 className="text-3xl text-center font-bold mb-4">Best Seller</h2>
      {bestSellersProduct ? (
        <ProdcutDetails productId={bestSellersProduct._id}></ProdcutDetails>
      ) : (
        <p className="text-3xl text-center  font-bold mb-4">Loading best seller Products...</p>
      )}

      <div className="continer mx-auto">
        <h2 className="text-3xl text-center font-bold mb-4">Top Wears for Women</h2>
        <ProductGrid products={products} loading={loading} error={error}></ProductGrid>
      </div>
      <FeaturedCollection></FeaturedCollection>
      <FeaturesSection></FeaturesSection>
    </div>
  );
};

export default Home;
