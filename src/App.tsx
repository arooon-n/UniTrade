import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import { Marketplace } from "@/pages/Marketplace";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { AddProduct } from "@/pages/AddProduct";
import { MyProducts } from "@/pages/MyProducts";
import { ProductDetails } from "@/pages/ProductDetailsNew";
import { Transactions } from "@/pages/TransactionsNew";
import { Profile } from "@/pages/Profile";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/my-products"
              element={
                <ProtectedRoute>
                  <MyProducts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-product"
              element={
                <ProtectedRoute>
                  <AddProduct />
                </ProtectedRoute>
              }
            />

            <Route path="/product/:id" element={<ProductDetails />} />

            <Route
              path="/product/:id/edit"
              element={
                <ProtectedRoute>
                  <AddProduct />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen flex items-center justify-center">
                    <h1 className="text-2xl font-bold">
                      Admin Dashboard - Coming Soon
                    </h1>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
