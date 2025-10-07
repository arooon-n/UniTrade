const API_URL = "http://localhost:3002/api";

class ApiService {
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem("token");
    console.log(
      "API Token debug:",
      token ? token.substring(0, 20) + "..." : "null"
    );
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeader(),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  }

  // Authentication
  async register(userData: { email: string; password: string; name: string }) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  // Products
  async getProducts(
    params: {
      category?: string;
      type?: "sale" | "rental";
      min_price?: number;
      max_price?: number;
      search?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    return this.request(`/products?${queryParams.toString()}`);
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData: FormData | object) {
    // Handle FormData for file uploads
    if (productData instanceof FormData) {
      const response = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          ...this.getAuthHeader(),
        } as HeadersInit,
        body: productData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Request failed");
      }

      return response.json();
    }

    return this.request("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: any) {
    return this.request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: "DELETE",
    });
  }

  async getUserProducts(userId: string) {
    return this.request(`/products/user/${userId}`);
  }

  // Transactions
  async createTransaction(transactionData: any) {
    return this.request("/transactions", {
      method: "POST",
      body: JSON.stringify(transactionData),
    });
  }

  async getUserTransactions(type?: "buyer" | "seller") {
    const params = type ? `?type=${type}` : "";
    return this.request(`/transactions/user${params}`);
  }

  async getTransaction(id: string) {
    return this.request(`/transactions/${id}`);
  }

  // Reviews
  async createReview(productId: string, reviewData: any) {
    return this.request(`/reviews/${productId}`, {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
  }

  async getProductReviews(productId: string) {
    return this.request(`/reviews/product/${productId}`);
  }

  async updateReview(reviewId: string, reviewData: any) {
    return this.request(`/reviews/${reviewId}`, {
      method: "PUT",
      body: JSON.stringify(reviewData),
    });
  }

  async deleteReview(reviewId: string) {
    return this.request(`/reviews/${reviewId}`, {
      method: "DELETE",
    });
  }

  // Reports
  async createReport(reportData: any) {
    return this.request("/reports", {
      method: "POST",
      body: JSON.stringify(reportData),
    });
  }

  async getUserReports() {
    return this.request("/reports/user");
  }

  async getAllReports(status?: string) {
    const params = status ? `?status=${status}` : "";
    return this.request(`/reports${params}`);
  }

  async updateReportStatus(reportId: string, status: string) {
    return this.request(`/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ report_status: status }),
    });
  }

  // Admin
  async getAdminStats() {
    return this.request("/admin/stats");
  }

  async getAdminAnalytics(period?: string) {
    const params = period ? `?period=${period}` : "";
    return this.request(`/admin/analytics${params}`);
  }

  async getUsers(
    params: {
      search?: string;
      role?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    return this.request(`/admin/users?${queryParams.toString()}`);
  }

  // Profile
  async getProfile() {
    return this.request("/users/profile");
  }

  async updateProfile(profileData: { name: string; phone?: string }) {
    return this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  // Transactions
  async purchaseProduct(productId: string) {
    return this.request("/transactions/purchase", {
      method: "POST",
      body: JSON.stringify({ product_id: productId }),
    });
  }

  async getMyTransactions() {
    return this.request("/transactions/my");
  }

  async getSalesTransactions() {
    return this.request("/transactions/sales");
  }

  // Seller info
  async getSellerInfo(sellerId: string) {
    return this.request(`/users/${sellerId}`);
  }
}

export const apiService = new ApiService();
