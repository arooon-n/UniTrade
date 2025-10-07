import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { User } from "lucide-react";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    product_status: string;
    image_urls: string[];
    users?: {
      name: string;
      rating?: number;
    };
    created_at: string;
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group"
    >
      <Link to={`/product/${product.id}`}>
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-white group-hover:shadow-2xl">
          <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
            {product.image_urls && product.image_urls.length > 0 ? (
              <img
                src={product.image_urls[0]}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm">No Image</span>
                </div>
              </div>
            )}

            {/* Enhanced badges with better positioning */}
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge
                variant="outline"
                className="bg-white/90 backdrop-blur-sm border-white text-gray-700 font-medium"
              >
                {product.category}
              </Badge>
              {product.product_status === "sold" && (
                <Badge
                  variant="secondary"
                  className="bg-red-500 text-white border-0 font-medium"
                >
                  Sold
                </Badge>
              )}
            </div>

            {/* Enhanced price tag */}
            <div className="absolute bottom-3 right-3">
              <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-xl px-4 py-2 text-lg font-bold shadow-lg">
                ₹{product.price.toLocaleString()}
              </div>
            </div>

            {/* Gradient overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          <div className="p-6">
            <h3 className="font-bold text-xl mb-2 line-clamp-1 text-gray-900 group-hover:text-slate-700 transition-colors duration-200">
              {product.title}
            </h3>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
              {product.description}
            </p>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-slate-600" />
                </div>
                <span className="font-medium">
                  {product.users?.name || "Anonymous"}
                </span>
              </div>
              <span className="text-gray-400 text-xs">
                {formatDate(product.created_at)}
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};
