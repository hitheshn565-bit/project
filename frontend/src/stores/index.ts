import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiEndpoints } from '@/services/api';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Product {
  id: string;
  title: string;
  image: string;
  currentPrice: number;
  originalPrice?: number;
  marketplace: string;
  rating: number;
  reviewCount: number;
  isOnSale?: boolean;
  savingsPercent?: number;
  condition?: string;
  brand?: string;
  product_url?: string;
  category?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface PriceAlert {
  id: string;
  productId: string;
  productTitle: string;
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: string;
}

// Auth Store
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        try {
          const response = await apiEndpoints.login({ email, password });
          const { user, token } = response.data;
          
          set({ 
            user, 
            token, 
            isAuthenticated: true 
          });
        } catch (error: any) {
          console.error('Login failed:', error);
          throw new Error(error.response?.data?.message || 'Login failed');
        }
      },
      register: async (name: string, email: string, password: string) => {
        try {
          const response = await apiEndpoints.register({ name, email, password });
          const { user, token } = response.data;
          
          set({ 
            user, 
            token, 
            isAuthenticated: true 
          });
        } catch (error: any) {
          console.error('Registration failed:', error);
          throw new Error(error.response?.data?.message || 'Registration failed');
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
      setUser: (user: User) => {
        set({ user });
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Product Store
interface ProductState {
  products: Product[];
  searchResults: Product[];
  searchQuery: string;
  filters: {
    priceRange: [number, number];
    brands: string[];
    categories: string[];
    condition: string[];
    marketplaces: string[];
    sortBy: string;
  };
  isLoading: boolean;
  setProducts: (products: Product[]) => void;
  setSearchResults: (results: Product[]) => void;
  setSearchQuery: (query: string) => void;
  updateFilters: (filters: Partial<ProductState['filters']>) => void;
  searchProducts: (query: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  searchResults: [],
  searchQuery: '',
  filters: {
    priceRange: [0, 10000],
    brands: [],
    categories: [],
    condition: [],
    marketplaces: [],
    sortBy: 'relevance'
  },
  isLoading: false,
  setProducts: (products) => set({ products }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  updateFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  searchProducts: async (query: string) => {
    set({ isLoading: true, searchQuery: query });
    try {
      const response = await apiEndpoints.searchProducts(query, { limit: 20 });
      
      // Transform scraper API response to match frontend format
      const transformScrapedProduct = (item: any): Product => {
        // Extract price numbers from strings like "₹1,999" or "$29.99"
        const extractPrice = (priceStr: string): number => {
          if (!priceStr) return 0;
          const numStr = priceStr.replace(/[^\d.]/g, '');
          return parseFloat(numStr) || 0;
        };

        const currentPrice = extractPrice(item.price);
        const originalPrice = item.original_price ? extractPrice(item.original_price) : undefined;

        return {
          id: item.product_url || `${item.marketplace}-${Date.now()}-${Math.random()}`,
          title: item.title,
          image: item.image_url || "/placeholder.svg",
          currentPrice,
          originalPrice,
          marketplace: item.marketplace,
          rating: item.rating ? parseFloat(item.rating) : 4.5,
          reviewCount: item.reviews_count ? parseInt(item.reviews_count.replace(/[^\d]/g, '')) : Math.floor(Math.random() * 1000) + 100,
          isOnSale: originalPrice ? currentPrice < originalPrice : false,
          savingsPercent: originalPrice && currentPrice < originalPrice ? 
            Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0,
          condition: "New", // Default condition
          brand: item.title?.split(' ')[0],
          product_url: item.product_url || item.url // Add product URL for "View Deal" button
        };
      };

      if (response.data?.combined) {
        // Using combined results from Amazon + Myntra
        const searchResults = response.data.combined.map(transformScrapedProduct);
        set({ searchResults, isLoading: false });
      } else if (response.data?.products) {
        // Fallback to single marketplace results
        const searchResults = response.data.products.map(transformScrapedProduct);
        set({ searchResults, isLoading: false });
      } else {
        set({ searchResults: [], isLoading: false });
      }
    } catch (error) {
      console.error('Search error:', error);
      set({ searchResults: [], isLoading: false });
    }
  }
}));

// Cart Store
interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        const { items } = get();
        const existingItem = items.find(item => item.id === product.id);
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          });
        } else {
          set({
            items: [...items, { ...product, quantity }]
          });
        }
      },
      removeItem: (productId) => {
        set(state => ({
          items: state.items.filter(item => item.id !== productId)
        }));
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        set(state => ({
          items: state.items.map(item =>
            item.id === productId ? { ...item, quantity } : item
          )
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotalPrice: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.currentPrice * item.quantity), 0);
      },
      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage'
    }
  )
);

// Wishlist Store
interface WishlistState {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addToWishlist: (product) => {
        const { items } = get();
        if (!items.find(item => item.id === product.id)) {
          set({ items: [...items, product] });
        }
      },
      removeFromWishlist: (productId) => {
        set(state => ({
          items: state.items.filter(item => item.id !== productId)
        }));
      },
      isInWishlist: (productId) => {
        const { items } = get();
        return items.some(item => item.id === productId);
      }
    }),
    {
      name: 'wishlist-storage'
    }
  )
);

// Price Alerts Store
interface AlertsState {
  alerts: PriceAlert[];
  addAlert: (productId: string, productTitle: string, targetPrice: number, currentPrice: number) => void;
  removeAlert: (alertId: string) => void;
  updateAlert: (alertId: string, updates: Partial<PriceAlert>) => void;
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set, get) => ({
      alerts: [],
      addAlert: (productId, productTitle, targetPrice, currentPrice) => {
        const newAlert: PriceAlert = {
          id: Date.now().toString(),
          productId,
          productTitle,
          targetPrice,
          currentPrice,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        set(state => ({ alerts: [...state.alerts, newAlert] }));
      },
      removeAlert: (alertId) => {
        set(state => ({
          alerts: state.alerts.filter(alert => alert.id !== alertId)
        }));
      },
      updateAlert: (alertId, updates) => {
        set(state => ({
          alerts: state.alerts.map(alert =>
            alert.id === alertId ? { ...alert, ...updates } : alert
          )
        }));
      }
    }),
    {
      name: 'alerts-storage'
    }
  )
);