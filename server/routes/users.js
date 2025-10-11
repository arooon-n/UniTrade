import express from "express";
import { supabase } from "../lib/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get current user's profile (authenticated route)
router.get("/profile", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("Fetching profile for user:", userId);

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Profile fetch error:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "Failed to fetch user profile",
      });
    }

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User profile does not exist",
      });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone_number,
        role: user.role,
        rating: user.rating,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch user profile",
    });
  }
});

// Update current user's profile (authenticated route)
router.put("/profile", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    console.log("Updating profile for user:", userId);

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        name,
        phone_number: phone,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "Failed to update user profile",
      });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone_number,
        role: updatedUser.role,
        rating: updatedUser.rating,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update user profile",
    });
  }
});

// Get user profile by ID (public route)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Fetching user:", id);

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    console.log("User fetch result:", { found: !!user, error: error?.message });

    if (error) {
      console.error("User fetch error:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "Failed to fetch user profile",
      });
    }

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User profile does not exist",
      });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone_number,
        role: user.role,
        rating: user.rating,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch user profile",
    });
  }
});

// Update user profile
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    console.log("Updating user:", id);

    const { data, error } = await supabase
      .from("users")
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        error: "Update failed",
        message: error.message,
      });
    }

    res.json({
      message: "Profile updated successfully",
      user: data,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update user profile",
    });
  }
});

// Test route
router.get("/test/ping", (req, res) => {
  res.json({ message: "Users routes are working!" });
});

export default router;
