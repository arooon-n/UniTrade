import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server directory
dotenv.config({ path: path.join(__dirname, "../.env") });

// Now import after loading env vars
import { supabase } from "../lib/supabase.js";
import {
  initializeDatabase,
  createUser,
  createProduct,
  getProducts,
} from "../config/database.js";

const testSupabaseConnectivity = async () => {
  console.log("🔍 Testing Supabase connectivity...\n");

  try {
    // Test 1: Basic connection
    console.log("1. Testing basic connection...");
    await initializeDatabase();
    console.log("✅ Basic connection successful\n");

    // Test 2: Test users table
    console.log("2. Testing users table...");
    const { data: usersTest, error: usersError } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (usersError && usersError.code !== "PGRST116") {
      throw new Error(`Users table error: ${usersError.message}`);
    }
    console.log("✅ Users table accessible");

    // Test 3: Test products table
    console.log("3. Testing products table...");
    const { data: productsTest, error: productsError } = await supabase
      .from("products")
      .select("count")
      .limit(1);

    if (productsError && productsError.code !== "PGRST116") {
      throw new Error(`Products table error: ${productsError.message}`);
    }
    console.log("✅ Products table accessible\n");

    return true;
  } catch (error) {
    console.error("❌ Connectivity test failed:", error);
    return false;
  }
};

const insertDummyData = async () => {
  console.log("📝 Inserting dummy data...\n");

  try {
    // Create dummy users with valid Amrita email addresses
    console.log("1. Creating dummy users...");

    const dummyUsers = [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "john.doe@cb.students.amrita.edu",
        name: "John Doe",
        role: "student",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        email: "jane.smith@cb.students.amrita.edu",
        name: "Jane Smith",
        role: "student",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        email: "admin.user@cb.students.amrita.edu",
        name: "Admin User",
        role: "admin",
      },
    ];

    const createdUsers = [];
    for (const userData of dummyUsers) {
      try {
        const result = await createUser(userData);
        console.log(`✅ Created user: ${userData.name} (${userData.email})`);
        createdUsers.push(result);
      } catch (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          console.log(`ℹ️  User already exists: ${userData.name}`);
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("email", userData.email)
            .single();
          createdUsers.push(data);
        } else {
          console.error(
            `❌ Failed to create user ${userData.name}:`,
            error.message
          );
        }
      }
    }

    // Create dummy products
    console.log("\n2. Creating dummy products...");
    const dummyProducts = [
      {
        title: 'MacBook Pro 13" 2020',
        description:
          "Excellent condition MacBook Pro with M1 chip. Perfect for students and professionals.",
        price: 1200.0,
        category: "Electronics",
        owner_id: createdUsers[0].id,
        product_status: "available",
      },
      {
        title: "Calculus Textbook - Stewart",
        description:
          "Stewart Calculus 8th Edition. Minimal highlighting, great condition.",
        price: 45.0,
        category: "Books",
        owner_id: createdUsers[1].id,
        product_status: "available",
      },
      {
        title: "Study Desk with Chair",
        description:
          "Wooden study desk with matching chair. Perfect for dorm room.",
        price: 150.0,
        category: "Furniture",
        owner_id: createdUsers[0].id,
        product_status: "available",
      },
      {
        title: "iPhone 13 Pro",
        description:
          "Unlocked iPhone 13 Pro, 256GB. Minor scratches, works perfectly.",
        price: 800.0,
        category: "Electronics",
        owner_id: createdUsers[1].id,
        product_status: "available",
      },
    ];

    const createdProducts = [];
    for (const productData of dummyProducts) {
      try {
        const result = await createProduct(productData);
        console.log(`✅ Created product: ${productData.title}`);
        createdProducts.push(result);
      } catch (error) {
        console.error(
          `❌ Failed to create product ${productData.title}:`,
          error.message
        );
      }
    }

    console.log(
      `\n✅ Successfully created ${createdUsers.length} users and ${createdProducts.length} products`
    );
    return { users: createdUsers, products: createdProducts };
  } catch (error) {
    console.error("❌ Failed to insert dummy data:", error);
    throw error;
  }
};

const verifyData = async () => {
  console.log("\n🔍 Verifying inserted data...\n");

  try {
    // Check users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*");

    if (usersError) throw usersError;
    console.log(`📊 Total users in database: ${users.length}`);
    users.forEach((user) => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });

    // Check products
    const products = await getProducts();
    console.log(`\n📊 Total products in database: ${products.length}`);
    products.forEach((product) => {
      console.log(
        `   - ${product.title} - $${product.price} (${product.category})`
      );
    });

    return { users, products };
  } catch (error) {
    console.error("❌ Failed to verify data:", error);
    throw error;
  }
};

const runFullTest = async () => {
  console.log("🚀 Starting Supabase Database Test\n");
  console.log("=".repeat(50));

  try {
    // Test connectivity
    const isConnected = await testSupabaseConnectivity();
    if (!isConnected) {
      throw new Error("Database connectivity failed");
    }

    // Insert dummy data
    await insertDummyData();

    // Verify data
    await verifyData();

    console.log("\n" + "=".repeat(50));
    console.log("🎉 All tests completed successfully!");
    console.log("✅ Database is properly connected and functional");
    console.log("✅ Dummy data inserted and verified");
    console.log("\nEmail domain requirement: @cb.students.amrita.edu");
    console.log("Your Supabase database is ready for development! 🚀");
  } catch (error) {
    console.log("\n" + "=".repeat(50));
    console.error("💥 Test failed:", error.message);
    console.log("\nPlease check your Supabase configuration and try again.");
  }
};

// Run the test
runFullTest();
