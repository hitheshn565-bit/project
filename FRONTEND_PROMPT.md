# 🎯 Truetag Frontend - Complete E-commerce Aggregator UI

## 📋 **Project Overview**
Build a modern, responsive e-commerce aggregator frontend that connects to the Truetag backend API. The app should aggregate products from multiple marketplaces (starting with eBay), show price comparisons, track price history, and provide personalized recommendations.

## 🛠️ **Tech Stack Requirements**
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: Zustand or React Query (TanStack Query)
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors
- **Charts**: Recharts for price history
- **Authentication**: JWT with refresh token handling
- **Build Tool**: Vite
- **Deployment**: Vercel/Netlify ready

## 🎨 **Design System**
- **Color Scheme**: Modern blue/purple gradient theme
- **Typography**: Inter font family
- **Components**: Clean, modern cards with subtle shadows
- **Layout**: Responsive grid system (mobile-first)
- **Icons**: Lucide React icons
- **Animations**: Framer Motion for smooth transitions

## 📱 **Core Pages & Features**

### 1. **Landing Page** (`/`)
```
Header:
- Logo: "Truetag" with tagline "Find the Best Deals Across Marketplaces"
- Navigation: Home, Categories, Deals, About, Login/Profile
- Search bar with autocomplete
- Shopping cart icon with count

Hero Section:
- Large search bar: "Search millions of products..."
- Popular categories grid (6-8 categories with icons)
- "Trending Products" carousel
- Value propositions: "Compare Prices", "Track Deals", "Save Money"

Featured Sections:
- "Hot Deals" - Products with significant price drops
- "Popular Products" - Most viewed items
- "Recently Added" - Latest product ingestions
- "Categories" - Grid of main product categories

Footer:
- Links, social media, newsletter signup
```

### 2. **Search Results Page** (`/search?q=...`)
```
Layout:
- Search bar at top with current query
- Filters sidebar (collapsible on mobile):
  * Price range slider
  * Brand checkboxes
  * Category dropdown
  * Condition (New, Used, Refurbished)
  * Marketplace (eBay, Amazon, etc.)
  * Sort by: Price, Popularity, Newest, Rating

Results Grid:
- Product cards showing:
  * Product image
  * Title (truncated)
  * Price comparison (current price + price from other sellers)
  * "Best Deal" badge for lowest price
  * Marketplace logos
  * Quick view button
  * Add to wishlist heart icon

Pagination:
- Load more button or infinite scroll
- Results count: "Showing 1-20 of 1,247 results"
```

### 3. **Product Detail Page** (`/product/:id`)
```
Layout (2-column):
Left Column:
- Image gallery with zoom
- Thumbnail navigation
- 360° view if available

Right Column:
- Product title
- Brand name
- Price comparison table:
  * Seller name
  * Price
  * Shipping cost
  * Total cost
  * "Go to Store" buttons
  * "Best Deal" highlighting

Product Information:
- Description
- Specifications table
- Condition details
- Category breadcrumbs

Interactive Elements:
- Price history chart (7-day, 30-day, 90-day tabs)
- Price alert setup (email notification)
- Add to wishlist
- Share buttons
- Similar products carousel
- Recently viewed products
```

### 4. **Categories Page** (`/categories`)
```
Layout:
- Category hierarchy breadcrumbs
- Grid of category cards with:
  * Category image/icon
  * Category name
  * Product count
  * "Popular in [Category]" preview

Subcategories:
- Expandable category tree
- Filter by marketplace
- Sort by popularity/name
```

### 5. **Deals Page** (`/deals`)
```
Sections:
- "Today's Best Deals" - Biggest price drops
- "Flash Deals" - Time-limited offers
- "Price Drop Alerts" - Recently reduced prices
- "Trending Deals" - Most popular discounted items

Deal Cards:
- Original price (strikethrough)
- Current price (highlighted)
- Discount percentage badge
- Time remaining (if applicable)
- "Deal Score" rating
```

### 6. **User Authentication**

**Login Page** (`/login`):
```
Form:
- Email input
- Password input
- "Remember me" checkbox
- "Forgot password?" link
- Login button
- "Sign up" link
- Social login options (Google, Facebook)

Features:
- Form validation
- Loading states
- Error handling
- Redirect after login
```

**Register Page** (`/register`):
```
Form:
- Full name
- Email
- Password (with strength indicator)
- Confirm password
- Interest categories (checkboxes)
- Terms & conditions checkbox
- Register button

Features:
- Real-time validation
- Password strength meter
- Interest selection for personalization
```

### 7. **User Dashboard** (`/dashboard`)
```
Sidebar Navigation:
- Profile
- Wishlist
- Price Alerts
- Order History
- Settings

Main Content:
- Welcome message with user name
- Quick stats: Saved items, Active alerts, Money saved
- Recent activity feed
- Personalized recommendations
- Price alert notifications
```

### 8. **Wishlist Page** (`/wishlist`)
```
Features:
- Grid of saved products
- Price change notifications
- Remove from wishlist
- Move to cart
- Share wishlist
- Create multiple wishlists
- Price tracking for each item
```

### 9. **Price Alerts Page** (`/alerts`)
```
Features:
- List of active price alerts
- Create new alert form
- Alert history
- Notification preferences
- Alert performance stats
```

## 🔧 **Technical Implementation**

### **API Integration**
```typescript
// API Base Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1'

// Endpoints to implement:
- GET /connectors/ebay/search - Product search
- GET /products/search - Canonical product search  
- GET /products/:id - Product details
- GET /products/:id/offers - Price comparison
- GET /prices/products/:id/history - Price history
- GET /recommendations/trending - Trending products
- GET /recommendations/cold-start - Personalized recommendations
- GET /cache/popular - Popular products
- POST /auth/login - User authentication
- POST /auth/register - User registration
- GET /users/profile - User profile
```

### **State Management Structure**
```typescript
// Store slices:
- authStore: user, token, isAuthenticated, login, logout
- productStore: products, searchResults, filters, pagination
- cartStore: items, addItem, removeItem, updateQuantity
- wishlistStore: items, addToWishlist, removeFromWishlist
- alertStore: priceAlerts, createAlert, deleteAlert
- uiStore: loading, errors, notifications, modals
```

### **Component Architecture**
```
src/
├── components/
│   ├── ui/ (shadcn components)
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── PriceComparison.tsx
│   │   └── PriceChart.tsx
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   ├── SearchFilters.tsx
│   │   └── SearchResults.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   └── common/
│       ├── Loading.tsx
│       ├── ErrorBoundary.tsx
│       ├── Pagination.tsx
│       └── Modal.tsx
├── pages/
├── hooks/
├── services/
├── stores/
├── types/
└── utils/
```

## 🎯 **Key Features to Implement**

### **1. Smart Search**
- Autocomplete with product suggestions
- Search history
- Voice search (optional)
- Barcode scanner (mobile)
- Advanced filters with URL persistence

### **2. Price Tracking**
- Interactive price history charts
- Price drop notifications
- Price comparison tables
- Deal alerts
- Savings calculator

### **3. User Experience**
- Infinite scroll or pagination
- Skeleton loading states
- Error boundaries
- Offline support (PWA)
- Dark/light mode toggle

### **4. Responsive Design**
- Mobile-first approach
- Touch-friendly interactions
- Swipe gestures for mobile
- Responsive images
- Adaptive layouts

### **5. Performance**
- Image lazy loading
- Code splitting
- Caching strategies
- Bundle optimization
- SEO optimization

## 🔐 **Authentication Flow**
```typescript
// JWT Token Management
- Store tokens in httpOnly cookies (secure)
- Automatic token refresh
- Redirect to login on 401
- Persist user session
- Logout on token expiry

// Protected Routes
- Dashboard pages require authentication
- Wishlist and alerts require login
- Guest checkout allowed
- Social login integration
```

## 📊 **Data Visualization**
```typescript
// Price History Charts
- Line charts for price trends
- Comparison charts for multiple sellers
- Deal timeline visualization
- Savings over time graphs
- Market trend indicators
```

## 🎨 **UI/UX Guidelines**

### **Color Palette**
```css
Primary: #3B82F6 (Blue)
Secondary: #8B5CF6 (Purple)
Success: #10B981 (Green)
Warning: #F59E0B (Amber)
Error: #EF4444 (Red)
Neutral: #6B7280 (Gray)
Background: #F9FAFB (Light Gray)
```

### **Typography**
```css
Headings: Inter Bold
Body: Inter Regular
Captions: Inter Medium
Code: JetBrains Mono
```

### **Component Styling**
- Rounded corners (8px default)
- Subtle shadows for depth
- Hover animations (scale, color)
- Loading skeletons
- Toast notifications
- Modal overlays

## 📱 **Mobile Optimization**
- Touch-friendly buttons (44px minimum)
- Swipe gestures for navigation
- Pull-to-refresh
- Bottom navigation for mobile
- Responsive breakpoints
- Mobile-specific features

## 🚀 **Deployment Configuration**
```json
// package.json scripts
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "deploy": "npm run build && vercel --prod"
}

// Environment variables
VITE_API_BASE_URL=https://api.truetag.com/api/v1
VITE_APP_NAME=Truetag
VITE_ENABLE_ANALYTICS=true
```

## 🔍 **SEO & Analytics**
- Meta tags for all pages
- Open Graph tags
- Structured data (JSON-LD)
- Google Analytics integration
- Performance monitoring
- Error tracking (Sentry)

## ✅ **Testing Strategy**
- Unit tests for utilities
- Component testing with React Testing Library
- E2E tests for critical flows
- Visual regression testing
- Performance testing
- Accessibility testing

## 🎯 **Success Metrics**
- Page load time < 2 seconds
- Mobile-friendly score > 95
- Accessibility score > 90
- SEO score > 85
- User engagement metrics
- Conversion tracking

---

## 🚀 **Final Prompt for Lovable AI**

**"Build a modern, responsive e-commerce aggregator frontend called 'Truetag' using React 18, TypeScript, Tailwind CSS, and Shadcn/ui. The app should have a clean, modern design with blue/purple gradient theme. Include all the pages and features listed above: landing page with hero section and product categories, search results with filters, detailed product pages with price comparison and history charts, user authentication, dashboard, wishlist, and price alerts. Implement proper state management, API integration with the provided endpoints, responsive design for mobile/desktop, and deploy-ready configuration. Focus on excellent UX with smooth animations, loading states, and error handling. Make it production-ready with SEO optimization and performance best practices."**

This frontend will perfectly complement your Truetag backend and create a complete, professional e-commerce aggregator platform! 🎉
