import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, ShoppingBag, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const popularCategories = [
    { name: "Electronics", icon: "📱", count: "2.1M+ products" },
    { name: "Fashion", icon: "👕", count: "1.8M+ products" },
    { name: "Home & Garden", icon: "🏠", count: "890K+ products" },
    { name: "Sports", icon: "⚽", count: "645K+ products" },
    { name: "Books", icon: "📚", count: "1.2M+ products" },
    { name: "Automotive", icon: "🚗", count: "450K+ products" },
  ];

  const valuePropositions = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Compare Prices",
      description: "Find the best deals across multiple marketplaces"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Track Deals",
      description: "Get notified when prices drop on your favorite items"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Save Money",
      description: "Our users save an average of $127 per month"
    }
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
           }} />
      
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="text-center space-y-8">
          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Find the{" "}
              <span className="text-gradient">Best Deals</span>
              <br />
              Across Marketplaces
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Compare prices, track deals, and save money with Truetag - 
              the ultimate e-commerce aggregator platform.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSearch} className="relative">
              <div className="search-enhanced p-2">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="h-5 w-5 text-muted-foreground ml-2" />
                  <Input
                    type="search"
                    placeholder="Search millions of products across eBay, Amazon, and more..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 bg-transparent text-lg py-4 px-2 focus:ring-0 focus:outline-none"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="btn-hero mr-2"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Search Deals
                  </Button>
                </div>
              </div>
            </form>
            <p className="mt-2 text-sm text-muted-foreground">
              💡 Try searching: "iPhone 15", "Gaming Laptop", "Coffee Maker"
            </p>
          </div>

          {/* Value Propositions */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-4xl mx-auto mt-12">
            {valuePropositions.map((item, index) => (
              <div
                key={index}
                className="card-elevated text-center hover-glow"
              >
                <div className="flex justify-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-white">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Popular Categories */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8">Popular Categories</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 max-w-4xl mx-auto">
              {popularCategories.map((category, index) => (
                <div
                  key={index}
                  className="card-product text-center group cursor-pointer hover:border-primary/30"
                >
                  <div className="text-3xl mb-3">{category.icon}</div>
                  <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{category.count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Button size="lg" className="btn-hero">
              Start Shopping Now
            </Button>
            <Button size="lg" variant="outline" className="btn-outline-hero">
              Learn How It Works
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 max-w-2xl mx-auto mt-16 pt-8 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient">2.1M+</div>
              <div className="text-sm text-muted-foreground">Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient">50+</div>
              <div className="text-sm text-muted-foreground">Marketplaces</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient">$127</div>
              <div className="text-sm text-muted-foreground">Avg. Savings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient">24/7</div>
              <div className="text-sm text-muted-foreground">Price Tracking</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;