//import { useState } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Suspense, lazy } from "react";
import UserLayout from "./components/layout/UserLayout";
import { CartProvider } from "./components/cart/CartContext.jsx";
import { Provider } from "react-redux";
import store from "./redux/store";
import ClerkAuthBridge from "./components/auth/ClerkAuthBridge.jsx";
import RequireAuth from "./components/auth/RequireAuth";
import RequireAdmin from "./components/auth/RequireAdmin";

// Lazy load heavy pages for better performance
const Home = lazy(() => import("./Pages/Home"));
const Login = lazy(() => import("./Pages/Login"));
const LocalLogin = lazy(() => import("./Pages/LocalLogin"));
const Register = lazy(() => import("./Pages/Register"));
const Profile = lazy(() => import("./Pages/Profile"));
const CollectionPage = lazy(() => import("./Pages/CollectionPage"));
const Stylist = lazy(() => import("./Pages/Stylist"));
const CartCheckout = lazy(() => import("./components/cart/Checkout"));
const ProductsDetails = lazy(() => import("./components/products/ProductsDetails"));
const OrderConfirmation = lazy(() => import("./Pages/OrderConfirmation"));
const OrderDetailsPage = lazy(() => import("./Pages/OrderDetailsPage"));
const MyOrderPage = lazy(() => import("./Pages/MyOrderPage"));
const AdminOrderDetailsPage = lazy(() => import("./Pages/Admin/AdminOrderDetailsPage"));
const AdminLayout = lazy(() => import("./components/Admin/AdminLayout"));
const AdminHomePage = lazy(() => import("./Pages/AdminHomePage"));
const UserManagment = lazy(() => import("./components/Admin/UserManagment"));
const ProductManagement = lazy(() => import("./components/Admin/ProductManagement"));
const EditProductPage = lazy(() => import("./components/Admin/EditProductPage"));
const OrderManagement = lazy(() => import("./components/Admin/OrderManagement.jsx"));
const NotFound = lazy(() => import("./Pages/NotFound"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-stone-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-zyra-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-stone-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <Provider store={store}>
      <CartProvider>
        <BrowserRouter>
          <ClerkAuthBridge />
          <Toaster
            position="top-right"
            richColors={false}
            closeButton
            toastOptions={{
              duration: 3000,
              className:
                "!bg-black !text-white !border !border-zinc-700 !shadow-2xl !rounded-xl",
              style: {
                background: "#000000",
                color: "#ffffff",
                borderColor: "#404040",
                padding: "16px 18px 16px 16px",
              },
              classNames: {
                toast: "!bg-black !text-white !rounded-xl !shadow-2xl",
                content: "flex flex-col items-start gap-1 pr-10",
                title: "text-left text-white font-medium leading-snug",
                description: "text-left text-white/85 leading-snug",
                closeButton:
                  "!top-3 !right-3 !text-white !border-white !bg-transparent",
              },
            }}
          />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<UserLayout />}>
                <Route index element={<Home />} />
                <Route path="login/*" element={<Login />} />
                <Route path="local-login/*" element={<LocalLogin />} />
                <Route path="register/*" element={<Register />} />
                <Route
                  path="profile"
                  element={
                    <RequireAuth>
                      <Profile />
                    </RequireAuth>
                  }
                />
                <Route
                  path="collections/:collection"
                  element={<CollectionPage />}
                />
                <Route
                  path="stylist"
                  element={<Stylist />}
                />
                <Route
                  path="products/:id"
                  element={<ProductsDetails />}
                />
                <Route
                  path="checkout"
                  element={
                    <RequireAuth>
                      <CartCheckout />
                    </RequireAuth>
                  }
                />
                <Route
                  path="confirmation"
                  element={
                    <RequireAuth>
                      <OrderConfirmation />
                    </RequireAuth>
                  }
                />
                <Route
                  path="order/:id"
                  element={
                    <RequireAuth>
                      <OrderDetailsPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/my-orders"
                  element={
                    <RequireAuth>
                      <MyOrderPage />
                    </RequireAuth>
                  }
                />
              </Route>
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminLayout />
                  </RequireAdmin>
                }
              >
                <Route index element={<AdminHomePage />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="order/:id" element={<AdminOrderDetailsPage />} />
                <Route path="users" element={<UserManagment />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="products/new" element={<EditProductPage />} />
                <Route path="products/:id/edit" element={<EditProductPage />} />
              </Route>
              {/* 404 Catch-all - must be last */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </Provider>
  );
}

export default App;
