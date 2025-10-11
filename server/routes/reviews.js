import express from "express";
import { supabase } from "../lib/supabase.js";
import { authenticate } from "../middleware/auth.js";
import { validateRequest, schemas } from "../middleware/validation.js";

const router = express.Router();

// Create review
router.post(
  "/:productId",
  authenticate,
  validateRequest(schemas.review),
  async (req, res) => {
    try {
      const { productId } = req.params;
      const { rating, comment } = req.body;
      const reviewer_id = req.user.id;

      // Check if user has purchased/rented this product
      console.log("Checking transaction for:", { productId, reviewer_id });

      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .select("*")
        .eq("product_id", productId)
        .eq("buyer_id", reviewer_id)
        .eq("payment_status", "completed")
        .single();

      console.log("Transaction check result:", {
        transaction,
        transactionError,
      });

      if (transactionError || !transaction) {
        return res.status(400).json({
          error: "You can only review products you have purchased",
          debug: {
            transactionError: transactionError?.message,
            productId,
            reviewer_id,
          },
        });
      }

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("reviewer_id", reviewer_id)
        .single();

      if (existingReview) {
        return res.status(400).json({
          error: "You have already reviewed this product",
        });
      }

      // Create review
      const { data: review, error: reviewError } = await supabase
        .from("reviews")
        .insert([
          {
            product_id: productId,
            reviewer_id: reviewer_id,
            rating: rating,
            comment: comment,
          },
        ])
        .select()
        .single();

      if (reviewError) {
        throw reviewError;
      }

      res.status(201).json({
        message: "Review created successfully",
        review,
      });
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({
        error: "Failed to create review",
        details: error.message,
      });
    }
  }
);

// Get reviews for a product
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        reviewer:reviewer_id (
          id,
          name,
          email
        )
      `
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ reviews });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({
      error: "Failed to fetch reviews",
      details: error.message,
    });
  }
});

// Update review
router.put(
  "/:id",
  authenticate,
  validateRequest(schemas.review),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const reviewer_id = req.user.userId;

      // Check if review belongs to user
      const { data: existingReview, error: checkError } = await supabase
        .from("reviews")
        .select("*")
        .eq("id", id)
        .eq("reviewer_id", reviewer_id)
        .single();

      if (checkError || !existingReview) {
        return res.status(404).json({
          error: "Review not found or access denied",
        });
      }

      // Update review
      const { data: review, error: updateError } = await supabase
        .from("reviews")
        .update({
          rating: rating,
          comment: comment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      res.json({
        message: "Review updated successfully",
        review,
      });
    } catch (error) {
      console.error("Update review error:", error);
      res.status(500).json({
        error: "Failed to update review",
        details: error.message,
      });
    }
  }
);

// Delete review
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const reviewer_id = req.user.userId;

    // Check if review belongs to user or user is admin
    const { data: review, error: checkError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", id)
      .single();

    if (checkError || !review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (review.reviewer_id !== reviewer_id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete review
    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({
      error: "Failed to delete review",
      details: error.message,
    });
  }
});

// Get reviews by seller (for seller's profile)
router.get("/seller/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Get all products by seller
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id")
      .eq("owner_id", sellerId);

    if (productsError) {
      throw productsError;
    }

    if (!products || products.length === 0) {
      return res.json({ reviews: [] });
    }

    const productIds = products.map((p) => p.id);

    // Get all reviews for seller's products
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select(
        `
        *,
        reviewer:reviewer_id (
          id,
          name,
          email
        ),
        product:product_id (
          id,
          title,
          image_urls
        )
      `
      )
      .in("product_id", productIds)
      .order("created_at", { ascending: false });

    if (reviewsError) {
      throw reviewsError;
    }

    res.json({ reviews: reviews || [] });
  } catch (error) {
    console.error("Get seller reviews error:", error);
    res.status(500).json({
      error: "Failed to fetch seller reviews",
      details: error.message,
    });
  }
});

export default router;
