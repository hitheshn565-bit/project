import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage');
    if (token) {
      try {
        const authData = JSON.parse(token);
        if (authData?.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`;
        }
      } catch (error) {
        console.error('Error parsing auth token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiEndpoints = {
  // Search & Products - Now using scraper service
  searchProducts: (query: string, filters?: any) => 
    api.get(`/scraper/search`, { params: { q: query, limit: filters?.limit || 20 } }),
  
  searchAmazon: (query: string, limit?: number) => 
    api.get(`/scraper/amazon/search`, { params: { q: query, limit: limit || 20 } }),
  
  searchMyntra: (query: string, limit?: number) => 
    api.get(`/scraper/myntra/search`, { params: { q: query, limit: limit || 20 } }),
  
  getProduct: (id: string) => 
    api.get(`/scraper/product/${encodeURIComponent(id)}`),
  
  getProductOffers: (id: string) => 
    api.get(`/products/${id}/offers`),
  
  getPriceHistory: (id: string, period: string = '30d') => 
    api.get(`/prices/products/${id}/history`, { params: { period } }),
  
  // Recommendations - Now using Python recommendation service
  getTrendingProducts: () => 
    api.get('/recommendations/trending'),
  
  getPersonalizedRecommendations: () => 
    api.get('/recommendations/personal'),
  
  getPopularProducts: () => 
    api.get('/recommendations/trending'),
  
  getSimilarProducts: (productId: string) =>
    api.get(`/recommendations/similar/${encodeURIComponent(productId)}`),
  
  trackInteraction: (interaction: any) =>
    api.post('/recommendations/track', interaction),
  
  updateUserInterests: (interests: any[]) =>
    api.put('/recommendations/interests', { interests }),
  
  // Authentication
  login: (credentials: { email: string; password: string }) => 
    api.post('/auth/login', credentials),
  
  register: (userData: { name: string; email: string; password: string }) => 
    api.post('/auth/register', userData),
  
  refreshToken: () => 
    api.post('/auth/refresh'),
  
  // User
  getUserProfile: () => 
    api.get('/users/profile'),
  
  updateUserProfile: (data: any) => 
    api.put('/users/profile', data),
  
  // Categories
  getCategories: () => 
    api.get('/categories'),
  
  getCategoryProducts: (categoryId: string) => 
    api.get(`/categories/${categoryId}/products`),
};

export default api;