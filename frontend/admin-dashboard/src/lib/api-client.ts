// Admin Dashboard - Independent API Client
// NO SHARED CODE - Each frontend has its own API client

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  errors?: string[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  };
}

interface ApiError {
  message: string;
  status: number;
  code?: string;
}

class AdminApiClient {
  private baseURL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8080/api';
  private timeout = 30000;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Add auth token if available
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          this.handleAuthError();
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`API Error: ${options.method || 'GET'} ${endpoint}`, error);
      throw {
        message: error.message || 'Network error',
        status: error.status || 0,
        code: error.code || 'NETWORK_ERROR',
      } as ApiError;
    }
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_auth_token');
    }
    return null;
  }

  private handleAuthError(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_auth_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/auth/login';
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Admin Authentication
  async adminLogin(email: string, password: string): Promise<ApiResponse<any>> {
    return this.post('/admin/auth/login', { email, password });
  }

  async adminLogout(): Promise<ApiResponse<any>> {
    const response = await this.post('/admin/auth/logout');
    this.handleAuthError();
    return response;
  }

  async getAdminProfile(): Promise<ApiResponse<any>> {
    return this.get('/admin/auth/profile');
  }

  // Dashboard Analytics
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.get('/admin/dashboard/stats');
  }

  async getSalesData(period: string = '30d'): Promise<ApiResponse<any>> {
    return this.get(`/admin/analytics/sales?period=${period}`);
  }

  async getOrdersData(period: string = '30d'): Promise<ApiResponse<any>> {
    return this.get(`/admin/analytics/orders?period=${period}`);
  }

  async getTopProducts(limit: number = 10): Promise<ApiResponse<any>> {
    return this.get(`/admin/analytics/top-products?limit=${limit}`);
  }

  async getCustomerActivity(): Promise<ApiResponse<any>> {
    return this.get('/admin/analytics/customer-activity');
  }

  // Product Management
  async getProducts(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    status?: string;
  }): Promise<ApiResponse<any>> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.get(`/admin/products${queryString}`);
  }

  async getProduct(id: string): Promise<ApiResponse<any>> {
    return this.get(`/admin/products/${id}`);
  }

  async createProduct(productData: any): Promise<ApiResponse<any>> {
    return this.post('/admin/products', productData);
  }

  async updateProduct(id: string, productData: any): Promise<ApiResponse<any>> {
    return this.put(`/admin/products/${id}`, productData);
  }

  async deleteProduct(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/admin/products/${id}`);
  }

  async bulkUpdateProducts(updates: any[]): Promise<ApiResponse<any>> {
    return this.post('/admin/products/bulk-update', { updates });
  }

  // Category Management
  async getCategories(): Promise<ApiResponse<any>> {
    return this.get('/admin/categories');
  }

  async createCategory(categoryData: any): Promise<ApiResponse<any>> {
    return this.post('/admin/categories', categoryData);
  }

  async updateCategory(id: string, categoryData: any): Promise<ApiResponse<any>> {
    return this.put(`/admin/categories/${id}`, categoryData);
  }

  async deleteCategory(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/admin/categories/${id}`);
  }

  // Order Management
  async getOrders(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<any>> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.get(`/admin/orders${queryString}`);
  }

  async getOrder(id: string): Promise<ApiResponse<any>> {
    return this.get(`/admin/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string): Promise<ApiResponse<any>> {
    return this.put(`/admin/orders/${id}/status`, { status });
  }

  async cancelOrder(id: string, reason: string): Promise<ApiResponse<any>> {
    return this.post(`/admin/orders/${id}/cancel`, { reason });
  }

  async refundOrder(id: string, amount: number, reason: string): Promise<ApiResponse<any>> {
    return this.post(`/admin/orders/${id}/refund`, { amount, reason });
  }

  // Customer Management
  async getCustomers(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<any>> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.get(`/admin/customers${queryString}`);
  }

  async getCustomer(id: string): Promise<ApiResponse<any>> {
    return this.get(`/admin/customers/${id}`);
  }

  async updateCustomer(id: string, customerData: any): Promise<ApiResponse<any>> {
    return this.put(`/admin/customers/${id}`, customerData);
  }

  async suspendCustomer(id: string, reason: string): Promise<ApiResponse<any>> {
    return this.post(`/admin/customers/${id}/suspend`, { reason });
  }

  async activateCustomer(id: string): Promise<ApiResponse<any>> {
    return this.post(`/admin/customers/${id}/activate`);
  }

  // Inventory Management
  async getInventory(params?: {
    page?: number;
    per_page?: number;
    low_stock?: boolean;
    out_of_stock?: boolean;
  }): Promise<ApiResponse<any>> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.get(`/admin/inventory${queryString}`);
  }

  async updateInventory(productId: string, quantity: number): Promise<ApiResponse<any>> {
    return this.put(`/admin/inventory/${productId}`, { quantity });
  }

  async getInventoryAlerts(): Promise<ApiResponse<any>> {
    return this.get('/admin/inventory/alerts');
  }

  async bulkUpdateInventory(updates: any[]): Promise<ApiResponse<any>> {
    return this.post('/admin/inventory/bulk-update', { updates });
  }

  // Payment Management
  async getPayments(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    method?: string;
  }): Promise<ApiResponse<any>> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.get(`/admin/payments${queryString}`);
  }

  async getPayment(id: string): Promise<ApiResponse<any>> {
    return this.get(`/admin/payments/${id}`);
  }

  async refundPayment(id: string, amount: number, reason: string): Promise<ApiResponse<any>> {
    return this.post(`/admin/payments/${id}/refund`, { amount, reason });
  }

  // Promotion Management
  async getPromotions(): Promise<ApiResponse<any>> {
    return this.get('/admin/promotions');
  }

  async createPromotion(promotionData: any): Promise<ApiResponse<any>> {
    return this.post('/admin/promotions', promotionData);
  }

  async updatePromotion(id: string, promotionData: any): Promise<ApiResponse<any>> {
    return this.put(`/admin/promotions/${id}`, promotionData);
  }

  async deletePromotion(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/admin/promotions/${id}`);
  }

  // Shipping Management
  async getShippingMethods(): Promise<ApiResponse<any>> {
    return this.get('/admin/shipping/methods');
  }

  async createShippingMethod(methodData: any): Promise<ApiResponse<any>> {
    return this.post('/admin/shipping/methods', methodData);
  }

  async updateShippingMethod(id: string, methodData: any): Promise<ApiResponse<any>> {
    return this.put(`/admin/shipping/methods/${id}`, methodData);
  }

  async getShipments(params?: {
    page?: number;
    per_page?: number;
    status?: string;
  }): Promise<ApiResponse<any>> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.get(`/admin/shipments${queryString}`);
  }

  // Review Management
  async getReviews(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    product_id?: string;
  }): Promise<ApiResponse<any>> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.get(`/admin/reviews${queryString}`);
  }

  async approveReview(id: string): Promise<ApiResponse<any>> {
    return this.post(`/admin/reviews/${id}/approve`);
  }

  async rejectReview(id: string, reason: string): Promise<ApiResponse<any>> {
    return this.post(`/admin/reviews/${id}/reject`, { reason });
  }

  // Content Management
  async getPages(): Promise<ApiResponse<any>> {
    return this.get('/admin/content/pages');
  }

  async createPage(pageData: any): Promise<ApiResponse<any>> {
    return this.post('/admin/content/pages', pageData);
  }

  async updatePage(id: string, pageData: any): Promise<ApiResponse<any>> {
    return this.put(`/admin/content/pages/${id}`, pageData);
  }

  async deletePage(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/admin/content/pages/${id}`);
  }

  // System Management
  async getSystemSettings(): Promise<ApiResponse<any>> {
    return this.get('/admin/system/settings');
  }

  async updateSystemSettings(settings: any): Promise<ApiResponse<any>> {
    return this.put('/admin/system/settings', settings);
  }

  async getSystemHealth(): Promise<ApiResponse<any>> {
    return this.get('/admin/system/health');
  }

  async getSystemLogs(params?: {
    level?: string;
    service?: string;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.get(`/admin/system/logs${queryString}`);
  }

  // Reports
  async generateReport(type: string, params: any): Promise<ApiResponse<any>> {
    return this.post(`/admin/reports/${type}`, params);
  }

  async getReports(): Promise<ApiResponse<any>> {
    return this.get('/admin/reports');
  }

  async downloadReport(id: string): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/admin/reports/${id}/download`, {
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });
    return response.blob();
  }
}

// Export singleton instance
export const adminApi = new AdminApiClient();
export default adminApi;
