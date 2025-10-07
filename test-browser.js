// Simple test script to check transaction endpoints
// Run this in browser console to test the actual API calls

const testEndpoints = async () => {
  const token = localStorage.getItem("token");
  console.log("Token exists:", !!token);

  if (!token) {
    console.log("No token found - user not logged in");
    return;
  }

  try {
    // Test /my endpoint
    const response1 = await fetch("http://localhost:3002/api/transactions/my", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("/my status:", response1.status);
    const data1 = await response1.text();
    console.log("/my response:", data1);

    // Test /sales endpoint
    const response2 = await fetch(
      "http://localhost:3002/api/transactions/sales",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("/sales status:", response2.status);
    const data2 = await response2.text();
    console.log("/sales response:", data2);
  } catch (error) {
    console.error("Test error:", error);
  }
};

// testEndpoints();
