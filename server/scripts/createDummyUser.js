import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

import { supabase } from "../lib/supabase.js";

const createDummyUser = async () => {
  console.log("🚀 Creating dummy user for testing...\n");

  try {
    // Step 1: Create auth user first
    console.log("1. Creating auth user...");
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: "test.user@cb.students.amrita.edu",
        password: "testpassword123",
        email_confirm: true,
        user_metadata: {
          name: "Test User",
        },
      });

    if (authError) {
      if (authError.message.includes("already registered")) {
        console.log("ℹ️  User already exists, fetching existing user...");
        // Get existing user
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(
          (u) => u.email === "test.user@cb.students.amrita.edu"
        );

        if (existingUser) {
          console.log("✅ Found existing auth user:", existingUser.email);

          // Check if profile exists
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", existingUser.id)
            .single();

          if (profile) {
            console.log("✅ Profile already exists!");
            console.log("📋 User Details:");
            console.log(`   ID: ${profile.id}`);
            console.log(`   Email: ${profile.email}`);
            console.log(`   Name: ${profile.name}`);
            console.log(`   Role: ${profile.role}`);
            return profile;
          } else {
            // Create profile for existing auth user
            authData = { user: existingUser };
          }
        }
      } else {
        console.error("❌ Error creating auth user:", authError);
        return null;
      }
    } else {
      console.log("✅ Auth user created successfully:", authData.user.email);
    }

    // Step 2: Create user profile
    console.log("2. Creating user profile...");
    const userProfile = {
      id: authData.user.id,
      email: authData.user.email,
      name: "Test User",
      role: "student",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .upsert([userProfile], {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (profileError) {
      console.error("❌ Error creating profile:", profileError);
      return null;
    }

    console.log("✅ User profile created successfully!");
    console.log("📋 User Details:");
    console.log(`   ID: ${profileData.id}`);
    console.log(`   Email: ${profileData.email}`);
    console.log(`   Name: ${profileData.name}`);
    console.log(`   Role: ${profileData.role}`);

    // Step 3: Create test products
    console.log("\n3. Creating test products...");
    const testProducts = [
      {
        title: "Test Laptop",
        description: "A test laptop for marketplace testing",
        price: 500.0,
        category: "Electronics",
        condition: "good",
        owner_id: profileData.id,
        product_status: "available",
      },
      {
        title: "Test Book",
        description: "A test textbook",
        price: 25.0,
        category: "Books",
        condition: "like_new",
        owner_id: profileData.id,
        product_status: "available",
      },
    ];

    for (const product of testProducts) {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .upsert([product], {
          onConflict: "title,owner_id",
        })
        .select()
        .single();

      if (!productError) {
        console.log(
          `✅ Created product: ${productData.title} - $${productData.price}`
        );
      } else {
        console.log(
          `⚠️  Product creation failed: ${product.title} - ${productError.message}`
        );
      }
    }

    console.log("\n🎉 Test environment ready!");
    console.log("\n� Login Credentials:");
    console.log("   Email: test.user@cb.students.amrita.edu");
    console.log("   Password: testpassword123");
    console.log("\n📝 API Testing Commands:");
    console.log("1. Test signin:");
    console.log("   curl -X POST http://localhost:3001/api/auth/signin \\");
    console.log('     -H "Content-Type: application/json" \\');
    console.log(
      '     -d \'{"email":"test.user@cb.students.amrita.edu","password":"testpassword123"}\''
    );
    console.log("\n2. Test products:");
    console.log("   curl http://localhost:3001/api/products");
    console.log("\n3. Test user profile:");
    console.log(`   curl http://localhost:3001/api/users/${profileData.id}`);

    return profileData;
  } catch (error) {
    console.error("💥 Failed to create dummy user:", error);
    return null;
  }
};

// Run the script
createDummyUser();
