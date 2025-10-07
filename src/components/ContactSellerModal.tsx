import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, User } from "lucide-react";
import { Button } from "./ui/button";

interface SellerInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
}

interface ContactSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: SellerInfo;
  productTitle: string;
}

export const ContactSellerModal: React.FC<ContactSellerModalProps> = ({
  isOpen,
  onClose,
  seller,
  productTitle,
}) => {
  const handleEmailClick = () => {
    const subject = encodeURIComponent(`Inquiry about: ${productTitle}`);
    const body = encodeURIComponent(
      `Hi ${seller.name},\n\nI'm interested in your product "${productTitle}". Could you please provide more details?\n\nThanks!`
    );
    window.open(`mailto:${seller.email}?subject=${subject}&body=${body}`);
  };

  const handlePhoneClick = () => {
    if (seller.phone) {
      window.open(`tel:${seller.phone}`);
    }
  };

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
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    Contact Seller
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Product Info with enhanced styling */}
                <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    Product Inquiry:
                  </p>
                  <p className="font-medium text-gray-900 text-lg">
                    {productTitle}
                  </p>
                </div>

                {/* Enhanced Seller Info */}
                <div className="space-y-5">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center shadow-lg">
                      <User size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        {seller.name}
                      </p>
                      {seller.bio && (
                        <p className="text-sm text-gray-600 mt-1">
                          {seller.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Contact Options */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleEmailClick}
                      className="w-full flex items-center gap-4 justify-start bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 p-4 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Mail size={20} />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-base">
                          Send Email
                        </div>
                        <div className="text-sm opacity-90 truncate">
                          {seller.email}
                        </div>
                      </div>
                    </Button>

                    {seller.phone && (
                      <Button
                        onClick={handlePhoneClick}
                        variant="outline"
                        className="w-full flex items-center gap-4 justify-start border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 p-4 h-auto rounded-xl transition-all duration-200"
                      >
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Phone size={20} className="text-slate-600" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-semibold text-base">
                            Call Seller
                          </div>
                          <div className="text-sm opacity-90">
                            {seller.phone}
                          </div>
                        </div>
                      </Button>
                    )}
                  </div>

                  {!seller.phone && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-sm text-yellow-800 text-center">
                        📞 Phone number not provided by seller
                      </p>
                    </div>
                  )}
                </div>

                {/* Enhanced Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50 font-medium"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
