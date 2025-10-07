import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  User,
  LogOut,
  Settings,
  PlusCircle,
  Store,
  CreditCard,
} from "lucide-react";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white/98 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg shadow-md">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              UniTrade
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className="px-4 py-2 text-gray-600 hover:text-slate-800 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <Store className="h-4 w-4" />
              Marketplace
            </Link>
            <Link
              to="/my-products"
              className="px-4 py-2 text-gray-600 hover:text-slate-800 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              My Products
            </Link>
            <Link
              to="/transactions"
              className="px-4 py-2 text-gray-600 hover:text-slate-800 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Transactions
            </Link>
            <Link to="/add-product" className="ml-2">
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <PlusCircle className="h-4 w-4" />
                List Product
              </Button>
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {user.name}
                      </span>
                      {user.role === "admin" && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Link to="/profile">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-gray-50 hover:border-gray-300"
                  >
                    <User className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Profile</span>
                  </Button>
                </Link>

                {user.role === "admin" && (
                  <Link to="/admin">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-gray-50 hover:border-gray-300"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                  </Link>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-gray-50 hover:border-gray-300"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950"
                  >
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
