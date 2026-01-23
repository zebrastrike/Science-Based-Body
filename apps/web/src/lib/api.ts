// Science Based Body - API Client
// Type-safe API client for frontend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// ============================================================================
// TYPES
// ============================================================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number;
  category: Category;
  variants: ProductVariant[];
  images: ProductImage[];
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
  unitPrice?: number;
  lineTotal?: number;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  shippingEstimate: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productName: string;
  variantName?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        statusCode: response.status,
        message: response.statusText,
      }));
      throw error;
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  // ============================================================================
  // AUTH
  // ============================================================================

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setAccessToken(response.accessToken);
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setAccessToken(response.accessToken);
    return response;
  }

  async logout() {
    this.setAccessToken(null);
    localStorage.removeItem('refreshToken');
  }

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await this.request<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      },
    );
    this.setAccessToken(response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // ============================================================================
  // CATALOG
  // ============================================================================

  async getProducts(params?: {
    category?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
  }): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, v));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
    }
    const query = searchParams.toString();
    return this.request<PaginatedResponse<Product>>(`/catalog/products${query ? `?${query}` : ''}`);
  }

  async getProduct(slug: string): Promise<Product> {
    return this.request<Product>(`/catalog/products/${slug}`);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return this.request<Product[]>('/catalog/featured');
  }

  async getBestsellers(): Promise<Product[]> {
    return this.request<Product[]>('/catalog/bestsellers');
  }

  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/catalog/categories');
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.request<Product[]>(`/catalog/search?q=${encodeURIComponent(query)}`);
  }

  // ============================================================================
  // CART
  // ============================================================================

  async validateCart(items: CartItem[]): Promise<Cart> {
    return this.request<Cart>('/cart/validate', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  async applyDiscountCode(items: CartItem[], code: string): Promise<Cart> {
    return this.request<Cart>('/cart/discount', {
      method: 'POST',
      body: JSON.stringify({ items, code }),
    });
  }

  async getShippingRates(items: CartItem[], postalCode: string): Promise<any[]> {
    return this.request<any[]>('/cart/shipping-rates', {
      method: 'POST',
      body: JSON.stringify({ items, postalCode }),
    });
  }

  // ============================================================================
  // CHECKOUT
  // ============================================================================

  async getCheckoutRequirements(): Promise<any> {
    return this.request<any>('/checkout/requirements');
  }

  async initializeCheckout(items: CartItem[]): Promise<any> {
    return this.request<any>('/checkout/initialize', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  async createOrder(data: {
    items: CartItem[];
    shippingAddress: any;
    billingAddress?: any;
    sameAsShipping?: boolean;
    shippingMethod: string;
    paymentMethod: string;
    discountCode?: string;
    customerNotes?: string;
    compliance: {
      researchPurposeOnly: boolean;
      ageConfirmation: boolean;
      noHumanConsumption: boolean;
      responsibilityAccepted: boolean;
      termsAccepted: boolean;
    };
    guestEmail?: string;
  }): Promise<{ order: Order; payment: any }> {
    const endpoint = this.accessToken ? '/checkout/create-order/authenticated' : '/checkout/create-order';
    return this.request<{ order: Order; payment: any }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================================================
  // ORDERS
  // ============================================================================

  async getOrders(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Order>> {
    return this.request<PaginatedResponse<Order>>(`/orders?page=${page}&limit=${limit}`);
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  // ============================================================================
  // BATCHES / COA
  // ============================================================================

  async getBatchByNumber(batchNumber: string): Promise<any> {
    return this.request<any>(`/batches/${batchNumber}`);
  }

  async getProductBatches(productId: string): Promise<any[]> {
    return this.request<any[]>(`/batches/product/${productId}`);
  }

  // ============================================================================
  // SUPPORT
  // ============================================================================

  async submitContactForm(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    type?: string;
  }): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/support/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async subscribeNewsletter(email: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/support/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getFAQs(): Promise<any[]> {
    return this.request<any[]>('/support/faq');
  }

  // ============================================================================
  // CONTENT
  // ============================================================================

  async getHomepageContent(): Promise<any> {
    return this.request<any>('/content/homepage');
  }

  async getAboutPage(): Promise<any> {
    return this.request<any>('/content/about');
  }

  async getAffiliatePage(): Promise<any> {
    return this.request<any>('/content/affiliate');
  }

  async getPartnersPage(): Promise<any> {
    return this.request<any>('/content/partners');
  }

  // ============================================================================
  // POLICIES
  // ============================================================================

  async getPolicy(type: 'terms' | 'privacy' | 'shipping' | 'refund'): Promise<any> {
    return this.request<any>(`/policies/${type}`);
  }

  // ============================================================================
  // LOYALTY
  // ============================================================================

  async getLoyaltyStatus(): Promise<any> {
    return this.request<any>('/loyalty/status');
  }

  async getLoyaltyHistory(): Promise<any[]> {
    return this.request<any[]>('/loyalty/history');
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

export default api;
