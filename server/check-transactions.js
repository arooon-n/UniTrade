import { supabase } from "./lib/supabase.js";

async function checkTransactionsTable() {
  try {
    console.log("Checking transactions table...");

    // Try to insert a minimal record to see what fields are required
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        product_id: "f24b5bb3-b4ef-4d80-a63a-0b8f45e573a3",
        buyer_id: "2ca4a9d2-7283-42b6-86ce-880012b9df44",
        seller_id: "c46722ee-6ec8-442f-904a-3e6ff4704513",
        amount: 100,
        transaction_type: "purchase",
      })
      .select();

    console.log("Insert result:", data);
    console.log("Insert error:", error);

    if (data && data.length > 0) {
      // Clean up test record
      await supabase.from("transactions").delete().eq("id", data[0].id);
      console.log("Test record cleaned up");
    }
  } catch (err) {
    console.error("Script error:", err);
  }
}

checkTransactionsTable();
