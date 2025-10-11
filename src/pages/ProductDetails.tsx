import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MessageCircle,
  Share,
  Calendar,
  Tag,
  User,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_urls: string[];
  product_status: "available" | "sold" | "reserved";
  created_at: string;
  updated_at: string;
  owner_id: string;
  users?: {
    id: string;
    name: string;
    email: string;
  };
}

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getProduct(id!);
      setProduct(response.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch product");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id, fetchProduct]);

  const handleContactSeller = () => {
    if (product?.users?.email) {
      window.location.href = `mailto:${product.users.email}?subject=Interest in ${product.title}`;
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: `Check out this ${product?.category.toLowerCase()} on UniTrade`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-slate-100 text-slate-800";
      case "sold":
        return "bg-gray-100 text-gray-800";
      case "reserved":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Product Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "The product you are looking for does not exist."}
            </p>
            <Link to="/">
              <Button>Back to Marketplace</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const isOwner = user?.user_id === product.owner_id;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              {product.image_urls && product.image_urls.length > 0 ? (
                <div className="relative">
                  <img
                    src={product.image_urls[currentImageIndex]}
                    alt={product.title}
                    className="w-full h-96 object-cover"
                  />
                  {product.image_urls.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      {currentImageIndex + 1} / {product.image_urls.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </Card>

            {/* Thumbnail Gallery */}
            {product.image_urls && product.image_urls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.image_urls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative rounded-lg overflow-hidden ${
                      index === currentImageIndex ? "ring-2 ring-slate-500" : ""
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {product.title}
                </h1>
                <Badge className={getStatusColor(product.product_status)}>
                  {product.product_status}
                </Badge>
              </div>

              <div className="text-3xl font-bold text-slate-700 mb-6">
                ₹{product.price.toLocaleString()}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <Tag className="h-4 w-4 mr-2" />
                  <span>{product.category}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Listed {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>

              {/* Action Buttons */}
              {!isOwner && product.product_status === "available" && (
                <div className="flex gap-3 mb-6">
                  <Button
                    onClick={handleContactSeller}
                    className="flex-1 bg-slate-700 hover:bg-slate-800"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Seller
                  </Button>
                  <Button variant="outline" onClick={handleShare}>
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {isOwner && (
                <div className="flex gap-3 mb-6">
                  <Link to={`/product/${product.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Edit Product
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={handleShare}>
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>

            {/* Seller Information */}
            {product.users && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Seller Information
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium">{product.users.name}</p>
                    <p className="text-sm text-gray-600">
                      {product.users.email}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Safety Tips */}
            <Card className="p-6 bg-slate-50">
              <h3 className="text-lg font-semibold mb-2">Safety Tips</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Meet in a public place for transactions</li>
                <li>• Inspect the item before payment</li>
                <li>• Use secure payment methods</li>
                <li>• Trust your instincts</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
