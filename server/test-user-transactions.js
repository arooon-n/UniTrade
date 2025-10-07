import { supabase } from "./lib/supabase.js";

async function testUserTransactions() {
  try {
    const userId = "2ca4a9d2-7283-42b6-86ce-880012b9df44"; // From your logs

    console.log("Testing user transactions for:", userId);

    // Test the /my endpoint logic
    console.log("\n=== Testing Purchases ===");
    const { data: purchases, error: purchasesError } = await supabase
      .from("transactions")
      .select("*")
      .eq("buyer_id", userId)
      .order("transaction_date", { ascending: false });

    console.log("Purchases found:", purchases?.length || 0);
    if (purchasesError) {
      console.log("Purchases error:", purchasesError);
    } else if (purchases && purchases.length > 0) {
      console.log("Sample purchase:", purchases[0]);

      // Test enrichment
      const transaction = purchases[0];
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

      console.log("Product enrichment success:", !!productResult.data);
      console.log("Seller enrichment success:", !!sellerResult.data);
      if (productResult.error)
        console.log("Product error:", productResult.error);
      if (sellerResult.error) console.log("Seller error:", sellerResult.error);
    }

    // Test the /sales endpoint logic
    console.log("\n=== Testing Sales ===");
    const { data: sales, error: salesError } = await supabase
      .from("transactions")
      .select("*")
      .eq("seller_id", userId)
      .order("transaction_date", { ascending: false });

    console.log("Sales found:", sales?.length || 0);
    if (salesError) {
      console.log("Sales error:", salesError);
    } else if (sales && sales.length > 0) {
      console.log("Sample sale:", sales[0]);
    }
  } catch (err) {
    console.error("Test error:", err);
  }
}

testUserTransactions();
