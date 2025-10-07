import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import { Upload, X } from "lucide-react";

interface ProductForm {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  images: FileList | null;
}

const categories = [
  "Electronics",
  "Books",
  "Clothing",
  "Furniture",
  "Sports",
  "Vehicles",
  "Others",
];

const conditions = ["New", "Like New", "Good", "Fair", "Poor"];

export const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const isEditMode = Boolean(id);

  const [form, setForm] = useState<ProductForm>({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "",
    images: null,
  });

  // Load existing product data when in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadProductData(id);
    }
  }, [isEditMode, id]);

  const loadProductData = async (productId: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.getProduct(productId);
      const product = response.product; // Extract product from nested response

      setForm({
        title: product.title,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        condition: "Good", // Default since condition isn't stored in DB
        images: null,
      });

      setExistingImages(product.image_urls || []);
      setImagePreviews(product.image_urls || []);
    } catch (err) {
      console.error("Error loading product data:", err);
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setForm((prev) => ({ ...prev, images: files }));

      // Create preview URLs
      const previews: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            previews.push(e.target.result as string);
            if (previews.length === files.length) {
              setImagePreviews(previews);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);

    if (form.images) {
      const dt = new DataTransfer();
      Array.from(form.images).forEach((file, i) => {
        if (i !== index) {
          dt.items.add(file);
        }
      });
      setForm((prev) => ({ ...prev, images: dt.files }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate form
      if (
        !form.title ||
        !form.description ||
        !form.price ||
        !form.category ||
        !form.condition
      ) {
        throw new Error("Please fill in all required fields");
      }

      const price = parseFloat(form.price);
      if (isNaN(price) || price <= 0) {
        throw new Error("Please enter a valid price");
      }

      if (isEditMode && id) {
        // Update existing product
        const updateData = {
          title: form.title,
          description: form.description,
          price: price,
          category: form.category,
          // Note: condition is not stored in database, so we don't send it
        };

        await apiService.updateProduct(id, updateData);
        navigate("/my-products");
      } else {
        // Create new product
        const formData = new FormData();
        formData.append("title", form.title);
        formData.append("description", form.description);
        formData.append("price", price.toString());
        formData.append("category", form.category);
        formData.append("condition", form.condition);

        if (form.images) {
          Array.from(form.images).forEach((file) => {
            formData.append(`images`, file);
          });
        }

        await apiService.createProduct(formData);
        navigate("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to list a product.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? "Edit Product" : "List a Product"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditMode
              ? "Update your product details"
              : "Share what you want to sell with the campus community"}
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Product Title *
              </label>
              <Input
                id="title"
                name="title"
                type="text"
                required
                value={form.title}
                onChange={handleInputChange}
                placeholder="e.g., iPhone 13 Pro Max"
                className="w-full"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                value={form.description}
                onChange={handleInputChange}
                placeholder="Describe your product in detail..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Price (₹) *
                </label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={form.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="condition"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Condition *
              </label>
              <select
                id="condition"
                name="condition"
                required
                value={form.condition}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="">Select condition</option>
                {conditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="images"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Product Images
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="images" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload product images
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      PNG, JPG, GIF up to 10MB each
                    </span>
                  </label>
                  <input
                    id="images"
                    name="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-slate-700 hover:bg-slate-800"
              >
                {isLoading
                  ? isEditMode
                    ? "Updating Product..."
                    : "Listing Product..."
                  : isEditMode
                  ? "Update Product"
                  : "List Product"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
