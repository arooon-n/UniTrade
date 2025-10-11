import { supabase } from "../lib/supabase.js";

export const initializeDatabase = async () => {
  try {
    console.log("[][] Testing Supabase connection...");

    // Test the Supabase connection
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "relation does not exist" which is fine for first run
      console.error("[][] Supabase connection failed:", error);
      throw error;
    }

    console.log("[][] Connected to Supabase database");
    console.log("[][] Database initialized successfully");

    return true;
  } catch (error) {
    console.error("[][] Error connecting to Supabase:", error);
    throw error;
  }
};

// Helper functions for database operations
export const createUser = async (userData) => {
  const { data, error } = await supabase
    .from("users")
    .insert([userData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserById = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
};

export const getUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
};

export const createProduct = async (productData) => {
  const { data, error } = await supabase
    .from("products")
    .insert([productData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getProducts = async (filters = {}) => {
  let query = supabase
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
    .eq("product_status", "available");

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.searchTerm) {
    query = query.or(
      `title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`
    );
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};
