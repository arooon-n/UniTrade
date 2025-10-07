import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import { ContactSellerModal } from "@/components/ContactSellerModal";
import { BuyNowModal } from "@/components/BuyNowModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ShoppingCart,
  MessageCircle,
  Share,
  Calendar,
  Tag,
  User,
  ChevronLeft,
  ChevronRight,
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
  owner_id: string;
  users?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    bio?: string;
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
  const [showContactModal, setShowContactModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [seller, setSeller] = useState<any>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState(false);
  const [purchaseErrorMessage, setPurchaseErrorMessage] = useState("");

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProduct(id!);
      setProduct(response.product);

      // Fetch seller info for contact modal
      if (response.product.owner_id) {
        try {
          const sellerResponse = await apiService.getSellerInfo(
            response.product.owner_id
          );
          console.log("Seller info fetched:", sellerResponse.user);
          setSeller(sellerResponse.user);
        } catch (sellerError) {
          console.warn("Failed to fetch seller info:", sellerError);
          // Set a fallback seller object to prevent "anonymous seller"
          setSeller({
            id: response.product.owner_id,
            name: "Loading...",
            email: "Updating...",
          });

          // Retry after a delay
          setTimeout(async () => {
            try {
              const retryResponse = await apiService.getSellerInfo(
                response.product.owner_id!
              );
              console.log("Seller info retry successful:", retryResponse.user);
              setSeller(retryResponse.user);
            } catch (retryError) {
              console.error("Seller info retry failed:", retryError);
              setSeller({
                id: response.product.owner_id!,
                name: "Seller",
                email: "Contact via platform",
              });
            }
          }, 2000);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.id === product?.owner_id) {
      setPurchaseError(true);
      setPurchaseErrorMessage("You can't buy your own product!");
      setShowBuyModal(true);
      return;
    }

    setShowBuyModal(true);
  };

  const handleConfirmPurchase = async () => {
    try {
      setPurchasing(true);
      await apiService.purchaseProduct(product!.id);
      setPurchaseSuccess(true);
      setTimeout(() => {
        setShowBuyModal(false);
        navigate("/transactions");
      }, 2000);
    } catch (err) {
      setPurchaseError(true);
      setPurchaseErrorMessage(
        err instanceof Error ? err.message : "Failed to purchase product"
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleCloseBuyModal = () => {
    setShowBuyModal(false);
    setPurchaseSuccess(false);
    setPurchaseError(false);
    setPurchaseErrorMessage("");
    setPurchasing(false);
  };

  const handleContactSeller = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setShowContactModal(true);
  };

  const handleShare = async () => {
    if (navigator.share && navigator.canShare) {
      try {
        await navigator.share({
          title: product?.title,
          text: product?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
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
        return "bg-green-100 text-green-800";
      case "sold":
        return "bg-gray-100 text-gray-800";
      case "reserved":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const nextImage = () => {
    if (product?.image_urls) {
      setCurrentImageIndex((prev) =>
        prev === product.image_urls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product?.image_urls) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? product.image_urls.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading product...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Product not found</h2>
          <p className="text-gray-600 mb-4">
            {error || "This product does not exist."}
          </p>
          <Button onClick={() => navigate("/marketplace")}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === product.owner_id;
  const canPurchase = product.product_status === "available" && !isOwner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8"
    >
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft size={20} />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
            {product.image_urls && product.image_urls.length > 0 ? (
              <>
                <img
                  src={product.image_urls[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {product.image_urls.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-gray-400 text-center">
                  <Tag size={48} className="mx-auto mb-2" />
                  <p>No image available</p>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {product.image_urls && product.image_urls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.image_urls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    index === currentImageIndex
                      ? "border-blue-500"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={url}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{product.title}</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share size={16} />
                Share
              </Button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <p className="text-3xl font-bold text-blue-600">
                ₹{product.price}
              </p>
              <Badge className={getStatusColor(product.product_status)}>
                {product.product_status}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Tag size={16} />
                <span>{product.category}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>{new Date(product.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="font-medium">
                  {product.users?.name || "Anonymous Seller"}
                </p>
                <p className="text-sm text-gray-600">Seller</p>
              </div>
            </div>
          </Card>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {product.description || "No description provided."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {canPurchase && (
              <Button
                onClick={handleBuyNow}
                disabled={purchasing}
                className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                size="lg"
              >
                <ShoppingCart size={20} />
                {purchasing ? "Processing..." : "Buy Now"}
              </Button>
            )}

            {!isOwner && (
              <Button
                onClick={handleContactSeller}
                variant="outline"
                className="w-full flex items-center gap-2"
                size="lg"
              >
                <MessageCircle size={20} />
                Contact Seller
              </Button>
            )}

            {isOwner && (
              <div className="text-center text-sm text-gray-600 py-4">
                This is your product. You can edit it from "My Products".
              </div>
            )}

            {product.product_status !== "available" && !isOwner && (
              <div className="text-center text-sm text-red-600 py-4">
                This product is no longer available for purchase.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Seller Modal */}
      {seller && (
        <ContactSellerModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          seller={seller}
          productTitle={product.title}
        />
      )}

      {/* Buy Now Modal */}
      <BuyNowModal
        isOpen={showBuyModal}
        onClose={handleCloseBuyModal}
        onConfirm={handleConfirmPurchase}
        product={product}
        isProcessing={purchasing}
        showSuccess={purchaseSuccess}
        showError={purchaseError}
        errorMessage={purchaseErrorMessage}
      />
    </motion.div>
  );
};
