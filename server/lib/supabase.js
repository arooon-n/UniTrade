import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Debug logging to see what's loaded
console.log("Environment check:");
console.log("- SUPABASE_URL:", supabaseUrl ? "[][] Set" : "[][] Missing");
console.log(
  "- SUPABASE_SERVICE_ROLE_KEY:",
  supabaseServiceKey ? "[][] Set" : "[][] Missing"
);
console.log("- SUPABASE_ANON_KEY:", supabaseAnonKey ? "[][] Set" : "[][] Missing");

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL environment variable is required");
}

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

if (!supabaseAnonKey) {
  throw new Error("SUPABASE_ANON_KEY environment variable is required");
}

// Create admin client with service role key
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create public client for auth verification
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

console.log("[][] Supabase clients initialized successfully");
