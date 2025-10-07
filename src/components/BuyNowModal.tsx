import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingCart,
  CreditCard,
  Package,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "./ui/button";

interface Product {
  id: string;
  title: string;
  price: number;
  image_urls: string[];
  category: string;
}

interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  product: Product | null;
  isProcessing: boolean;
  showSuccess: boolean;
  showError: boolean;
  errorMessage: string;
}

export const BuyNowModal: React.FC<BuyNowModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  product,
  isProcessing,
  showSuccess,
  showError,
  errorMessage,
}) => {
  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Enhanced Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
          >
            {/* Enhanced Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Success State */}
              {showSuccess && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Purchase Successful!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Your order has been placed successfully. You can track it in
                    your transactions.
                  </p>
                  <Button
                    onClick={onClose}
                    className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900"
                  >
                    View Transactions
                  </Button>
                </div>
              )}

              {/* Error State */}
              {showError && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} className="text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Purchase Failed
                  </h2>
                  <p className="text-gray-600 mb-6">{errorMessage}</p>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {/* Confirmation State */}
              {!showSuccess && !showError && (
                <>
                  {/* Header with gradient */}
                  <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShoppingCart size={20} />
                        Confirm Purchase
                      </h2>
                      <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
                        disabled={isProcessing}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Product Details */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
                      <div className="flex items-start gap-4">
                        {product.image_urls && product.image_urls[0] ? (
                          <img
                            src={product.image_urls[0]}
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package size={24} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg mb-1">
                            {product.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {product.category}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-slate-700">
                              ₹{product.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Purchase Summary */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CreditCard size={16} />
                        Purchase Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Item Price:</span>
                          <span className="font-medium">
                            ₹{product.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Platform Fee:</span>
                          <span className="font-medium text-slate-600">
                            Free
                          </span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total Amount:</span>
                            <span className="text-slate-700">
                              ₹{product.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50"
                        disabled={isProcessing}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={onConfirm}
                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 font-semibold"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          "Confirm Purchase"
                        )}
                      </Button>
                    </div>

                    {/* Disclaimer */}
                    <p className="text-xs text-gray-500 text-center mt-4">
                      By confirming this purchase, you agree to the platform's
                      terms and conditions.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
