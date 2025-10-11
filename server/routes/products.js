import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { getProducts, createProduct } from "../config/database.js";
import { supabase } from "../lib/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Helper function to upload image to Supabase Storage
const uploadImageToSupabase = async (file, userId) => {
  const fileExt = file.originalname.split(".").pop();
  const fileName = `${userId}/${uuidv4()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    throw error;
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(fileName);

  return publicUrl;
};

// Get all products
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;

    console.log("Fetching products with filters:", { category, search });

    const filters = {};
    if (category) filters.category = category;
    if (search) filters.searchTerm = search;

    const products = await getProducts(filters);

    res.json({
      products,
      count: products.length,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch products",
    });
  }
});

// Create new product
router.post("/", authenticate, upload.array("images", 5), async (req, res) => {
  try {
    const { title, description, price, category } = req.body;

    console.log("Creating product:", { title, category, price });
    console.log("Files received:", req.files?.length || 0);

    // Get user ID from auth middleware (assuming auth middleware sets req.user)
    const owner_id = req.user?.id;

    if (!owner_id) {
      return res.status(401).json({
        error: "Authentication required",
        message: "User must be logged in to create a product",
      });
    }

    if (!title || !price || !category) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Title, price, and category are required",
      });
    }

    // Upload images to Supabase Storage
    let image_urls = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map((file) =>
          uploadImageToSupabase(file, owner_id)
        );
        image_urls = await Promise.all(uploadPromises);
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return res.status(500).json({
          error: "Image upload failed",
          message: "Failed to upload product images",
        });
      }
    }

    const productData = {
      title,
      description,
      price: parseFloat(price),
      category,
      owner_id,
      image_urls,
      product_status: "available",
    };

    const product = await createProduct(productData);

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create product",
    });
  }
});

// Get single product by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabase
      .from("products")
      .select(
        `
        *,
        users:owner_id (
          id,
          name,
          email
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({
          error: "Product not found",
          message: "The requested product does not exist",
        });
      }
      throw error;
    }

    res.json({ product });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch product",
    });
  }
});

// Get user's products
router.get("/user/:userId", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user can only access their own products or is admin
    if (req.user.id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only view your own products",
      });
    }

    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ products });
  } catch (error) {
    console.error("Get user products error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch user products",
    });
  }
});

// Update product
router.put(
  "/:id",
  authenticate,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, price, category } = req.body;

      // Check if product exists and user owns it
      const { data: existingProduct, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          return res.status(404).json({
            error: "Product not found",
            message: "The requested product does not exist",
          });
        }
        throw fetchError;
      }

      if (
        existingProduct.owner_id !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          error: "Access denied",
          message: "You can only edit your own products",
        });
      }

      // Handle image uploads
      let image_urls = existingProduct.image_urls || [];
      if (req.files && req.files.length > 0) {
        try {
          const uploadPromises = req.files.map((file) =>
            uploadImageToSupabase(file, req.user.id)
          );
          const newImageUrls = await Promise.all(uploadPromises);
          image_urls = [...image_urls, ...newImageUrls];
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          return res.status(500).json({
            error: "Image upload failed",
            message: "Failed to upload product images",
          });
        }
      }

      const updateData = {
        title: title || existingProduct.title,
        description: description || existingProduct.description,
        price: price ? parseFloat(price) : existingProduct.price,
        category: category || existingProduct.category,
        image_urls,
      };

      const { data: product, error: updateError } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      res.json({
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to update product",
      });
    }
  }
);

// Delete product
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists and user owns it
    const { data: existingProduct, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return res.status(404).json({
          error: "Product not found",
          message: "The requested product does not exist",
        });
      }
      throw fetchError;
    }

    if (existingProduct.owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only delete your own products",
      });
    }

    // Delete images from storage
    if (existingProduct.image_urls && existingProduct.image_urls.length > 0) {
      try {
        const deletePromises = existingProduct.image_urls.map((url) => {
          const fileName = url.split("/").pop();
          return supabase.storage
            .from("product-images")
            .remove([`${existingProduct.owner_id}/${fileName}`]);
        });
        await Promise.all(deletePromises);
      } catch (storageError) {
        console.error("Storage cleanup error:", storageError);
        // Continue with product deletion even if storage cleanup fails
      }
    }

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete product",
    });
  }
});

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Products routes are working!" });
});

export default router;
