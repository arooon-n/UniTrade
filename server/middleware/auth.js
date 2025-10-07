import { supabase } from "../lib/supabase.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  console.log("=== AUTH MIDDLEWARE DEBUG ===");
  console.log("Authorization header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ No valid auth header");
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.replace("Bearer ", "");
  console.log("Extracted token:", token.substring(0, 20) + "...");

  try {
    // Verify the token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    console.log("Supabase getUser result:");
    console.log("- User:", user ? user.id : "null");
    console.log("- Error:", error);

    if (error || !user) {
      console.log("❌ Invalid token or user not found");
      return res.status(401).json({ error: "Invalid token." });
    }

    // Fetch additional user data from our users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    console.log("Database user lookup:");
    console.log("- User data:", userData ? userData.email : "null");
    console.log("- Error:", userError);

    if (userError) {
      console.error("Error fetching user data:", userError);
      return res.status(500).json({ error: "Error fetching user data." });
    }

    req.user = userData;
    console.log("✅ Authentication successful for:", userData.email);
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(400).json({ error: "Invalid token." });
  }
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Access denied. Not authenticated." });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Access denied. Insufficient permissions." });
    }

    next();
  };
};
