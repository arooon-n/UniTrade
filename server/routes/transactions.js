import express from "express";
import { supabase } from "../lib/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get user's purchases - MUST come before /:id route
router.get("/my", authenticate, async (req, res) => {
  try {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("buyer_id", req.user.id)
      .order("transaction_date", { ascending: false });

    if (error) throw error;

    // Fetch additional data for each transaction
    const enrichedTransactions = await Promise.all(
      (transactions || []).map(async (transaction) => {
        const [productResult, sellerResult] = await Promise.all([
          supabase
            .from("products")
            .select("*")
            .eq("id", transaction.product_id)
            .single(),
          supabase
            .from("users")
            .select("name, email")
            .eq("id", transaction.seller_id)
            .single(),
        ]);

        return {
          ...transaction,
          product: productResult.data,
          seller: sellerResult.data,
        };
      })
    );

    res.json({ transactions: enrichedTransactions });
  } catch (error) {
    console.error("Get purchases error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch purchases",
    });
  }
});

// Get user's sales - MUST come before /:id route
router.get("/sales", authenticate, async (req, res) => {
  try {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("seller_id", req.user.id)
      .order("transaction_date", { ascending: false });

    if (error) throw error;

    // Fetch additional data for each transaction
    const enrichedTransactions = await Promise.all(
      (transactions || []).map(async (transaction) => {
        const [productResult, buyerResult] = await Promise.all([
          supabase
            .from("products")
            .select("*")
            .eq("id", transaction.product_id)
            .single(),
          supabase
            .from("users")
            .select("name, email")
            .eq("id", transaction.buyer_id)
            .single(),
        ]);

        return {
          ...transaction,
          product: productResult.data,
          buyer: buyerResult.data,
        };
      })
    );

    res.json({ transactions: enrichedTransactions });
  } catch (error) {
    console.error("Get sales error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch sales",
    });
  }
});

// Simple purchase endpoint
router.post("/purchase", authenticate, async (req, res) => {
  try {
    const { product_id } = req.body;
    const buyer_id = req.user.id;

    // First, check if product exists and is available
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", product_id)
      .single();

    if (productError) {
      if (productError.code === "PGRST116") {
        return res.status(404).json({
          error: "Product not found",
          message: "The requested product does not exist",
        });
      }
      throw productError;
    }

    if (product.owner_id === buyer_id) {
      return res.status(400).json({
        error: "Invalid purchase",
        message: "You cannot buy your own product",
      });
    }

    if (product.product_status !== "available") {
      return res.status(400).json({
        error: "Product unavailable",
        message: "This product is no longer available for purchase",
      });
    }

    // Create transaction (auto-completed for prototype)
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        product_id,
        buyer_id,
        seller_id: product.owner_id,
        amount: product.price,
        transaction_type: "purchase",
        transaction_status: "completed", // Auto-complete for prototype
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Update product status to sold
    const { error: updateError } = await supabase
      .from("products")
      .update({ product_status: "sold" })
      .eq("id", product_id);

    if (updateError) throw updateError;

    res.json({
      message: "Purchase completed successfully",
      transaction,
    });
  } catch (error) {
    console.error("Purchase error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to complete purchase",
    });
  }
});

// Create transaction (purchase or rental)
router.post("/", authenticate, async (req, res) => {
  try {
    const { product_id, transaction_type, rental_start_date, rental_end_date } =
      req.body;
    const buyer_id = req.user.id;

    // Get product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.owner_id === buyer_id) {
      return res.status(400).json({ error: "Cannot buy your own product" });
    }

    if (product.product_status !== "available") {
      return res.status(400).json({ error: "Product not available" });
    }

    let amount = product.price;

    // Create transaction (auto-completed for prototype)
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        product_id,
        buyer_id,
        seller_id: product.owner_id,
        amount,
        transaction_type: transaction_type || "purchase",
        transaction_status: "completed", // Auto-complete for prototype
        rental_start_date,
        rental_end_date,
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Transaction creation error:", transactionError);
      return res.status(500).json({ error: "Failed to create transaction" });
    }

    // Update product status
    const newStatus = transaction_type === "purchase" ? "sold" : "booked";
    const { error: updateError } = await supabase
      .from("products")
      .update({ product_status: newStatus })
      .eq("id", product_id);

    if (updateError) {
      console.error("Product update error:", updateError);
      return res.status(500).json({ error: "Failed to update product status" });
    }

    res.status(201).json({
      message: "Transaction created successfully",
      transaction,
    });
  } catch (error) {
    console.error("Transaction error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create transaction",
    });
  }
});

// Get user transactions
router.get("/user", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query; // 'buyer' or 'seller'

    let query = supabase.from("transactions").select("*");

    if (type === "buyer") {
      query = query.eq("buyer_id", userId);
    } else if (type === "seller") {
      query = query.eq("seller_id", userId);
    } else {
      query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
    }

    const { data: transactions, error } = await query.order(
      "transaction_date",
      {
        ascending: false,
      }
    );

    if (error) {
      console.error("Get transactions error:", error);
      return res.status(500).json({ error: "Failed to fetch transactions" });
    }

    // Fetch additional data for each transaction
    const enrichedTransactions = await Promise.all(
      (transactions || []).map(async (transaction) => {
        const [productResult, buyerResult, sellerResult] = await Promise.all([
          supabase
            .from("products")
            .select("*")
            .eq("id", transaction.product_id)
            .single(),
          supabase
            .from("users")
            .select("name, email")
            .eq("id", transaction.buyer_id)
            .single(),
          supabase
            .from("users")
            .select("name, email")
            .eq("id", transaction.seller_id)
            .single(),
        ]);

        return {
          ...transaction,
          product: productResult.data,
          buyer: buyerResult.data,
          seller: sellerResult.data,
        };
      })
    );

    res.json({ transactions: enrichedTransactions });
  } catch (error) {
    console.error("Get user transactions error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch transactions",
    });
  }
});

// Get transaction by ID - MUST come after specific routes like /my and /sales
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Transaction not found" });
      }
      console.error("Get transaction error:", error);
      return res.status(500).json({ error: "Failed to fetch transaction" });
    }

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Fetch additional data
    const [productResult, buyerResult, sellerResult] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("id", transaction.product_id)
        .single(),
      supabase
        .from("users")
        .select("name, email")
        .eq("id", transaction.buyer_id)
        .single(),
      supabase
        .from("users")
        .select("name, email")
        .eq("id", transaction.seller_id)
        .single(),
    ]);

    const enrichedTransaction = {
      ...transaction,
      product: productResult.data,
      buyer: buyerResult.data,
      seller: sellerResult.data,
    };

    res.json(enrichedTransaction);
  } catch (error) {
    console.error("Get transaction by ID error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch transaction",
    });
  }
});

// Update transaction status
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    const { data, error } = await supabase
      .from("transactions")
      .update({ payment_status })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Update transaction status error:", error);
      return res
        .status(500)
        .json({ error: "Failed to update transaction status" });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ message: "Transaction status updated successfully" });
  } catch (error) {
    console.error("Update transaction status error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update transaction status",
    });
  }
});

export default router;
