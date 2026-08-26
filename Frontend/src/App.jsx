//import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import UserLayout from "./components/layout/UserLayout";
import Home from "./Pages/Home";
import { CartProvider } from "./components/cart/CartContext.jsx";
import Login from "./Pages/Login";
import LocalLogin from "./Pages/LocalLogin";
import Register from "./Pages/Register";
import Profile from "./Pages/Profile";
import CollectionPage from "./Pages/CollectionPage";
import CartCheckout from "./components/cart/Checkout";
import ProductsDetails from "./components/products/ProductsDetails";
import OrderConfirmation from "./Pages/OrderConfirmation";
import OrderDetailsPage from "./Pages/OrderDetailsPage";
import MyOrderPage from "./Pages/MyOrderPage";
import AdminOrderDetailsPage from "./Pages/Admin/AdminOrderDetailsPage";
import AdminLayout from "./components/Admin/AdminLayout";
import AdminHomePage from "./Pages/AdminHomePage";
import UserManagment from "./components/Admin/UserManagment";
import ProductManagement from "./components/Admin/ProductManagement";
import EditProductPage from "./components/Admin/EditProductPage";
import OrderManagement from "./components/Admin/OrderManagement.jsx";
import ClerkAuthBridge from "./components/auth/ClerkAuthBridge.jsx";
import { Provider } from "react-redux";
import store from "./redux/store";
import RequireAuth from "./components/auth/RequireAuth";
import RequireAdmin from "./components/auth/RequireAdmin";
function App() {
  return (
    <Provider store={store}>
      <CartProvider>
        <BrowserRouter>
          <ClerkAuthBridge />
          {/* Top-right cart notifications: black background, white text, white close button, auto-dismiss after 3s. */}
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
          {/* home
      product
      cart */}
          <Routes>
            <Route path="/" element={<UserLayout></UserLayout>}>
              <Route index element={<Home></Home>}></Route>
              <Route path="login/*" element={<Login></Login>}></Route>
              <Route path="local-login/*" element={<LocalLogin></LocalLogin>}></Route>
              <Route path="register/*" element={<Register></Register>}></Route>
              <Route
                path="profile"
                element={
                  <RequireAuth>
                    <Profile></Profile>
                  </RequireAuth>
                }
              ></Route>
              <Route
                path="/collections/:collection"
                element={<CollectionPage></CollectionPage>}
              ></Route>
              <Route
                path="products/:id"
                element={<ProductsDetails></ProductsDetails>}
              ></Route>
              <Route
                path="checkout"
                element={
                  <RequireAuth>
                    <CartCheckout></CartCheckout>
                  </RequireAuth>
                }
              ></Route>
              <Route
                path="confirmation"
                element={
                  <RequireAuth>
                    <OrderConfirmation></OrderConfirmation>
                  </RequireAuth>
                }
              ></Route>
              <Route
                path="order/:id"
                element={
                  <RequireAuth>
                    <OrderDetailsPage></OrderDetailsPage>
                  </RequireAuth>
                }
              ></Route>
              <Route
                path="/my-orders"
                element={
                  <RequireAuth>
                    <MyOrderPage></MyOrderPage>
                  </RequireAuth>
                }
              ></Route>
              {/* User layout  */}
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
            <Route>{/* Admin layout  */}</Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </Provider>
  );
}

export default App;
