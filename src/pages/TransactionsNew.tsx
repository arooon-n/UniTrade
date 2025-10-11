import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiService } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Package,
  User,
  ShoppingBag,
  TrendingUp,
  Star,
} from "lucide-react";
import { ReviewModal } from "@/components/ReviewModal";

interface Transaction {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  payment_status: string;
  transaction_date: string;
  transaction_type: string;
  product: {
    title: string;
    image_urls: string[];
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
  const [purchases, setPurchases] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"purchases" | "sales">(
    "purchases"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [productReviews, setProductReviews] = useState<
    Record<string, { rating: number; comment: string; id: string }>
  >({});
  const [existingReview, setExistingReview] = useState<
    { rating: number; comment: string } | undefined
  >(undefined);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      setError("");

      console.log("Loading transactions...");

      const [purchaseData, salesData] = await Promise.all([
        apiService.getMyTransactions(),
        apiService.getSalesTransactions(),
      ]);

      console.log("Purchase data:", purchaseData);
      console.log("Sales data:", salesData);

      setPurchases(purchaseData.transactions || []);
      setSales(salesData.transactions || []);

      // Load existing reviews for purchased products
      const reviewsMap: Record<
        string,
        { rating: number; comment: string; id: string }
      > = {};
      for (const purchase of purchaseData.transactions || []) {
        try {
          const reviewData = await apiService.getProductReviews(
            purchase.product_id
          );
          const userReview = reviewData.reviews?.find(
            (r: { reviewer_id: string }) => r.reviewer_id === purchase.buyer_id
          );
          if (userReview) {
            reviewsMap[purchase.product_id] = userReview;
          }
        } catch (err) {
          // Ignore errors for individual reviews
          console.error(
            `Failed to load review for product ${purchase.product_id}:`,
            err
          );
        }
      }
      setProductReviews(reviewsMap);
    } catch (err) {
      console.error("Transaction loading error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load transactions"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleReviewClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    const existingReview = productReviews[transaction.product_id];
    setExistingReview(
      existingReview
        ? { rating: existingReview.rating, comment: existingReview.comment }
        : undefined
    );
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!selectedTransaction) return;

    try {
      const existingReview = productReviews[selectedTransaction.product_id];

      if (existingReview) {
        // Update existing review
        await apiService.updateReview(existingReview.id, {
          rating,
          comment,
        });
      } else {
        // Create new review
        await apiService.createReview(selectedTransaction.product_id, {
          rating,
          comment,
        });
      }

      setIsReviewModalOpen(false);
      setSelectedTransaction(null);
      setExistingReview(undefined);
      // Refresh transactions to show updated status
      await loadTransactions();
    } catch (err) {
      console.error("Failed to submit review:", err);
      throw err; // Re-throw so the modal can show the error
    }
  };

  const currentTransactions = activeTab === "purchases" ? purchases : sales;
  const totalAmount = currentTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading transactions...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Transactions</h1>
        <p className="text-gray-600">Track your purchases and sales</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6 max-w-md">
        <button
          onClick={() => setActiveTab("purchases")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === "purchases"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <ShoppingBag size={18} />
          Purchases ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab("sales")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === "sales"
              ? "bg-white text-green-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <TrendingUp size={18} />
          Sales ({sales.length})
        </button>
      </div>

      {/* Summary Card */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">
              {activeTab === "purchases" ? "Total Spent" : "Total Earned"}
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              ₹{totalAmount.toFixed(2)}
            </p>
          </div>
          <div
            className={`p-3 rounded-full ${
              activeTab === "purchases" ? "bg-blue-100" : "bg-green-100"
            }`}
          >
            {activeTab === "purchases" ? (
              <ShoppingBag className="text-blue-600" size={24} />
            ) : (
              <TrendingUp className="text-green-600" size={24} />
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          From {currentTransactions.length} transaction
          {currentTransactions.length !== 1 ? "s" : ""}
        </p>
      </Card>

      {/* Transactions List */}
      {currentTransactions.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mb-4">
            {activeTab === "purchases" ? (
              <ShoppingBag className="mx-auto text-gray-400" size={48} />
            ) : (
              <TrendingUp className="mx-auto text-gray-400" size={48} />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">No {activeTab} yet</h3>
          <p className="text-gray-600">
            {activeTab === "purchases"
              ? "When you buy products, they'll appear here."
              : "When you sell products, they'll appear here."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentTransactions.map((transaction) => (
            <Card key={transaction.id} className="p-6">
              <div className="flex items-start gap-4">
                {/* Product Image */}
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {transaction.product?.image_urls?.[0] ? (
                    <img
                      src={transaction.product.image_urls[0]}
                      alt={transaction.product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="text-gray-400" size={24} />
                    </div>
                  )}
                </div>

                {/* Transaction Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">
                      {transaction.product?.title || "Product Deleted"}
                    </h3>
                    <Badge
                      className={getStatusColor(transaction.payment_status)}
                    >
                      {transaction.payment_status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>₹{transaction.amount.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <span>{formatDate(transaction.transaction_date)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <User size={16} />
                      <span>
                        {activeTab === "purchases"
                          ? `Seller: ${transaction.seller?.name || "Unknown"}`
                          : `Buyer: ${transaction.buyer?.name || "Unknown"}`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-500">
                    Transaction ID: {transaction.id}
                  </div>

                  {/* Review Button - Only show for completed purchases */}
                  {activeTab === "purchases" &&
                    transaction.payment_status.toLowerCase() ===
                      "completed" && (
                      <div className="mt-4">
                        <Button
                          onClick={() => handleReviewClick(transaction)}
                          className={
                            productReviews[transaction.product_id]
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-slate-600 hover:bg-slate-700 text-white"
                          }
                        >
                          <Star className="mr-2 h-4 w-4" />
                          {productReviews[transaction.product_id]
                            ? "Edit Review"
                            : "Leave Review"}
                        </Button>
                      </div>
                    )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedTransaction && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setExistingReview(undefined);
          }}
          onSubmit={handleReviewSubmit}
          productTitle={selectedTransaction.product?.title || "Product"}
          existingReview={existingReview}
        />
      )}
    </motion.div>
  );
};
