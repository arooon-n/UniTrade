import { supabase } from "./lib/supabase.js";

async function testProfileEndpoints() {
  try {
    console.log("Testing profile endpoints...");

    // Test 1: Check if users table has the expected columns
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .limit(1);

    console.log("Users table sample with all columns:", users?.[0]);
    if (error) console.log("Users table error:", error);

    if (users && users[0]) {
      console.log("Available columns:", Object.keys(users[0]));
    }

    // Test 2: Check if the authentication user exists
    const testUserId = "2ca4a9d2-7283-42b6-86ce-880012b9df44"; // From logs
    const { data: testUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", testUserId)
      .single();

    console.log("Test user exists:", !!testUser);
    console.log("Test user data:", testUser);
    if (userError) console.log("Test user error:", userError);
  } catch (err) {
    console.error("Test error:", err);
  }
}

testProfileEndpoints();
