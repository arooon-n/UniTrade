import fetch from "node-fetch";

async function testTransactionEndpoints() {
  const baseUrl = "http://localhost:3002/api";

  // You'll need to get a real JWT token from the browser
  // For now, let's test without auth to see if the routes are accessible
  console.log("Testing transaction endpoints...");

  try {
    // Test 1: Try to access /my without auth (should get 401)
    const response1 = await fetch(`${baseUrl}/transactions/my`);
    console.log("/my endpoint status:", response1.status);
    console.log("/my response:", await response1.text());

    // Test 2: Try to access /sales without auth (should get 401)
    const response2 = await fetch(`${baseUrl}/transactions/sales`);
    console.log("/sales endpoint status:", response2.status);
    console.log("/sales response:", await response2.text());
  } catch (error) {
    console.error("Test error:", error);
  }
}

testTransactionEndpoints();
