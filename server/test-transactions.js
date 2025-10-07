import { supabase } from "./lib/supabase.js";

async function testTransactionEndpoints() {
  try {
    console.log("Testing transaction endpoints...");

    // Test 1: Check if any transactions exist
    const { data: allTransactions, error: allError } = await supabase
      .from("transactions")
      .select("*")
      .limit(5);

    console.log("All transactions:", allTransactions?.length || 0);
    console.log("Sample transaction:", allTransactions?.[0]);

    if (allError) {
      console.log("Error fetching transactions:", allError);
      return;
    }

    if (allTransactions && allTransactions.length > 0) {
      const transaction = allTransactions[0];

      // Test 2: Check if we can fetch product details
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", transaction.product_id)
        .single();

      console.log("Product found:", !!product);
      if (productError) console.log("Product error:", productError);

      // Test 3: Check if we can fetch user details
      const { data: buyer, error: buyerError } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", transaction.buyer_id)
        .single();

      console.log("Buyer found:", !!buyer);
      if (buyerError) console.log("Buyer error:", buyerError);

      const { data: seller, error: sellerError } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", transaction.seller_id)
        .single();

      console.log("Seller found:", !!seller);
      if (sellerError) console.log("Seller error:", sellerError);
    }
  } catch (err) {
    console.error("Test error:", err);
  }
}

testTransactionEndpoints();
