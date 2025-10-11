import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReviewModal } from "@/components/ReviewModal";
import { ShoppingBag, Calendar, Package, User, Star } from "lucide-react";

interface Transaction {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  transaction_status: "pending" | "completed" | "cancelled";
  transaction_type: "sale" | "rental";
  created_at: string;
  updated_at: string;
  product?: {
    title: string;
    image_urls: string[];
    category: string;
  };
  buyer?: {
    name: string;
    email: string;
  };
  seller?: {
    name: string;
    email: string;
  };
}

export const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"purchases" | "sales">(
    "purchases"
  );
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [success, setSuccess] = useState("");

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserTransactions(
        activeTab === "purchases" ? "buyer" : "seller"
      );
      console.log("Fetched transactions:", response.transactions);
      console.log("Active tab:", activeTab);
      setTransactions(response.transactions || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch transactions"
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, fetchTransactions]);

  const handleReviewClick = (productId: string, productTitle: string) => {
    setSelectedProduct({ id: productId, title: productTitle });
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!selectedProduct) return;

    try {
      await apiService.createReview(selectedProduct.id, { rating, comment });
      setSuccess("Review submitted successfully!");
      setReviewModalOpen(false);
      setSelectedProduct(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      throw err; // Let ReviewModal handle the error
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-slate-100 text-slate-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view your transactions.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Transaction History
          </h1>
          <p className="text-gray-600 mt-2">Track your purchases and sales</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("purchases")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "purchases"
                    ? "border-slate-500 text-slate-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <ShoppingBag className="h-4 w-4 inline mr-2" />
                My Purchases
              </button>
              <button
                onClick={() => setActiveTab("sales")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "sales"
                    ? "border-slate-500 text-slate-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Sales
              </button>
            </nav>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
          </div>
        ) : transactions.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">
                No {activeTab === "purchases" ? "purchases" : "sales"} yet
              </h3>
              <p className="mb-4">
                {activeTab === "purchases"
                  ? "Start shopping to see your purchases here!"
                  : "List products to start selling!"}
              </p>
              <Button
                onClick={() =>
                  (window.location.href =
                    activeTab === "purchases" ? "/" : "/add-product")
                }
              >
                {activeTab === "purchases"
                  ? "Browse Marketplace"
                  : "List a Product"}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex space-x-4 flex-1">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {transaction.product?.image_urls &&
                      transaction.product.image_urls.length > 0 ? (
                        <img
                          src={transaction.product.image_urls[0]}
                          alt={transaction.product.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Transaction Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {transaction.product?.title || "Unknown Product"}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">
                            {transaction.product?.category}
                          </p>

                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(
                                transaction.created_at
                              ).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {activeTab === "purchases"
                                ? `Seller: ${
                                    transaction.seller?.name || "Unknown"
                                  }`
                                : `Buyer: ${
                                    transaction.buyer?.name || "Unknown"
                                  }`}
                            </div>
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-xl font-bold text-gray-900 mb-2">
                            ₹{transaction.amount.toLocaleString()}
                          </div>
                          <Badge
                            className={getStatusColor(
                              transaction.transaction_status
                            )}
                          >
                            {transaction.transaction_status}
                          </Badge>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Transaction ID: {transaction.id.slice(0, 8)}...
                          <span className="ml-2 text-xs text-gray-400">
                            (Status: {transaction.transaction_status})
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {/* Debug info */}
                          <div className="text-xs text-gray-400 mr-2">
                            Tab: {activeTab} | Status:{" "}
                            {transaction.transaction_status}
                          </div>

                          {transaction.transaction_status === "pending" && (
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          )}
                          {transaction.transaction_status === "completed" &&
                            activeTab === "purchases" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleReviewClick(
                                    transaction.product_id,
                                    transaction.product?.title || "Product"
                                  )
                                }
                                className="flex items-center gap-1"
                              >
                                <Star size={14} />
                                Leave Review
                              </Button>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {selectedProduct && (
          <ReviewModal
            isOpen={reviewModalOpen}
            onClose={() => {
              setReviewModalOpen(false);
              setSelectedProduct(null);
            }}
            onSubmit={handleReviewSubmit}
            productTitle={selectedProduct.title}
          />
        )}
      </div>
    </div>
  );
};
