import { supabase } from "./lib/supabase.js";

async function testUserFetching() {
  try {
    console.log("Testing user fetching...");

    // Get a sample user ID from database
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, phone_number")
      .limit(2);

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    console.log("Available users:", users);

    if (users && users.length > 0) {
      // Test fetching each user via the API route simulation
      for (const user of users) {
        console.log(`\nTesting user ${user.id}:`);

        const { data: fetchedUser, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (fetchError) {
          console.error("Fetch error:", fetchError);
        } else {
          console.log("Fetched successfully:", {
            id: fetchedUser.id,
            name: fetchedUser.name,
            email: fetchedUser.email,
            phone: fetchedUser.phone_number,
          });
        }
      }
    }
  } catch (err) {
    console.error("Test error:", err);
  }
}

testUserFetching();
