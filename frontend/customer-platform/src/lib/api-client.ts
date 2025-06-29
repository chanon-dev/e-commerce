// Customer Platform - Independent API Client
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

class CustomerApiClient {
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
      return localStorage.getItem('customer_auth_token');
    }
    return null;
  }

  private handleAuthError(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('customer_auth_token');
      localStorage.removeItem('customer_user');
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

  // Customer-specific API methods
  async getProducts(params?: {
    page?: number;
    per_page?: number;
    category?: string;
    search?: string;
    sort?: string;
  }): Promise<ApiResponse<any>> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.get(`/products${queryString}`);
  }

  async getProduct(id: string): Promise<ApiResponse<any>> {
    return this.get(`/products/${id}`);
  }

  async getCategories(): Promise<ApiResponse<any>> {
    return this.get('/categories');
  }

  async getCart(): Promise<ApiResponse<any>> {
    return this.get('/cart');
  }

  async addToCart(productId: string, quantity: number): Promise<ApiResponse<any>> {
    return this.post('/cart/items', { product_id: productId, quantity });
  }

  async updateCartItem(itemId: string, quantity: number): Promise<ApiResponse<any>> {
    return this.put(`/cart/items/${itemId}`, { quantity });
  }

  async removeCartItem(itemId: string): Promise<ApiResponse<any>> {
    return this.delete(`/cart/items/${itemId}`);
  }

  async getOrders(): Promise<ApiResponse<any>> {
    return this.get('/orders');
  }

  async getOrder(id: string): Promise<ApiResponse<any>> {
    return this.get(`/orders/${id}`);
  }

  async createOrder(orderData: any): Promise<ApiResponse<any>> {
    return this.post('/orders', orderData);
  }

  async login(email: string, password: string): Promise<ApiResponse<any>> {
    return this.post('/auth/login', { email, password });
  }

  async register(userData: any): Promise<ApiResponse<any>> {
    return this.post('/auth/register', userData);
  }

  async logout(): Promise<ApiResponse<any>> {
    const response = await this.post('/auth/logout');
    this.handleAuthError();
    return response;
  }

  async getProfile(): Promise<ApiResponse<any>> {
    return this.get('/auth/profile');
  }

  async updateProfile(profileData: any): Promise<ApiResponse<any>> {
    return this.put('/auth/profile', profileData);
  }

  async getWishlist(): Promise<ApiResponse<any>> {
    return this.get('/wishlist');
  }

  async addToWishlist(productId: string): Promise<ApiResponse<any>> {
    return this.post('/wishlist', { product_id: productId });
  }

  async removeFromWishlist(productId: string): Promise<ApiResponse<any>> {
    return this.delete(`/wishlist/${productId}`);
  }

  async getReviews(productId: string): Promise<ApiResponse<any>> {
    return this.get(`/products/${productId}/reviews`);
  }

  async createReview(productId: string, reviewData: any): Promise<ApiResponse<any>> {
    return this.post(`/products/${productId}/reviews`, reviewData);
  }

  async searchProducts(query: string, filters?: any): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({ q: query, ...filters });
    return this.get(`/search/products?${params}`);
  }

  async getPromotions(): Promise<ApiResponse<any>> {
    return this.get('/promotions');
  }

  async applyCoupon(code: string): Promise<ApiResponse<any>> {
    return this.post('/cart/coupon', { code });
  }

  async getShippingOptions(address: any): Promise<ApiResponse<any>> {
    return this.post('/shipping/options', address);
  }

  async processPayment(paymentData: any): Promise<ApiResponse<any>> {
    return this.post('/payments/process', paymentData);
  }
}

// Export singleton instance
export const customerApi = new CustomerApiClient();
export default customerApi;
