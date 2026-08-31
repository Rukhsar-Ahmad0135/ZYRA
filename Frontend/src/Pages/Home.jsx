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
import apiClient from "../api/client.js";
import { requestWithRetry } from "../utils/requestWithRetry.js";

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
        const response = await requestWithRetry(
          () => apiClient.get("/api/products/best-seller"),
          { retries: 1, delayMs: 500 },
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
        <p className="text-3xl text-center  font-bold mb-4">
          Loading best seller Products...
        </p>
      )}

      <div className="continer mx-auto">
        <h2 className="text-3xl text-center font-bold mb-4">
          Top Wears for Women
        </h2>
        <ProductGrid
          products={products}
          loading={loading}
          error={error}
        ></ProductGrid>
      </div>
      <FeaturedCollection></FeaturedCollection>
      <FeaturesSection></FeaturesSection>
    </div>
  );
};

export default Home;
