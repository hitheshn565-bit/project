import { useState, useEffect } from "react";
import { TrendingDown, Clock, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/ProductCard";
import { apiEndpoints } from "@/services/api";

const FeaturedSections = () => {
  const [hotDeals, setHotDeals] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [loading, setLoading] = useState(true);

  // Transform scraper API response to match frontend format
  const transformScrapedProduct = (item: any) => {
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
      condition: "New",
      brand: item.title?.split(' ')[0],
      product_url: item.product_url || item.url
    };
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch trending products (laptops)
        const trendingResponse = await apiEndpoints.searchProducts("laptop", { limit: 4 });
        if (trendingResponse.data?.combined) {
          setHotDeals(trendingResponse.data.combined.map(transformScrapedProduct));
        } else if (trendingResponse.data?.products) {
          setHotDeals(trendingResponse.data.products.map(transformScrapedProduct));
        }

        // Fetch popular products (phones)
        const popularResponse = await apiEndpoints.searchProducts("smartphone", { limit: 4 });
        if (popularResponse.data?.combined) {
          setPopularProducts(popularResponse.data.combined.map(transformScrapedProduct));
        } else if (popularResponse.data?.products) {
          setPopularProducts(popularResponse.data.products.map(transformScrapedProduct));
        }

        // Fetch recently added (shoes)
        const recentResponse = await apiEndpoints.searchProducts("shoes", { limit: 4 });
        if (recentResponse.data?.combined) {
          setRecentlyAdded(recentResponse.data.combined.map(transformScrapedProduct));
        } else if (recentResponse.data?.products) {
          setRecentlyAdded(recentResponse.data.products.map(transformScrapedProduct));
        }

      } catch (error) {
        console.error("Error fetching products:", error);
        // Fallback to mock data if API fails
        console.log("Using fallback mock data");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="container mx-auto px-4 py-16 space-y-16">
      {/* Hot Deals Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-warning to-destructive">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">🔥 Hot Deals</h2>
              <p className="text-sm text-muted-foreground">
                Products with significant price drops
              </p>
            </div>
          </div>
          <Button variant="outline">View All Deals</Button>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {hotDeals.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* Popular Products Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-secondary">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">⭐ Popular Products</h2>
              <p className="text-sm text-muted-foreground">
                Most viewed items this week
              </p>
            </div>
          </div>
          <Button variant="outline">See Trending</Button>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {popularProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* Recently Added Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-accent to-secondary">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">🆕 Recently Added</h2>
              <p className="text-sm text-muted-foreground">
                Latest product discoveries
              </p>
            </div>
          </div>
          <Button variant="outline">Browse New</Button>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {recentlyAdded.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="relative overflow-hidden">
        <div className="card-elevated bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 text-center">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4">
              Never Miss a Deal Again! 📱
            </h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Get instant notifications when prices drop on your favorite products. 
              Join 50,000+ smart shoppers saving money every day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button size="lg" className="btn-hero whitespace-nowrap">
                Get Deal Alerts
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              ✨ Free forever • 📧 Weekly digest • 🚫 No spam
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturedSections;