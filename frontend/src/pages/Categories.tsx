import { useState } from "react";
import { Grid, List, TrendingUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Categories = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Mock categories data
  const mainCategories = [
    {
      id: 'electronics',
      name: 'Electronics',
      image: '/placeholder.svg',
      productCount: 2145623,
      icon: '📱',
      subcategories: ['Smartphones', 'Laptops', 'TVs', 'Cameras', 'Gaming']
    },
    {
      id: 'fashion',
      name: 'Fashion',
      image: '/placeholder.svg',
      productCount: 1892445,
      icon: '👕',
      subcategories: ['Clothing', 'Shoes', 'Accessories', 'Jewelry', 'Watches']
    },
    {
      id: 'home-garden',
      name: 'Home & Garden',
      image: '/placeholder.svg',
      productCount: 891234,
      icon: '🏠',
      subcategories: ['Furniture', 'Appliances', 'Decor', 'Kitchen', 'Garden']
    },
    {
      id: 'sports',
      name: 'Sports & Outdoors',
      image: '/placeholder.svg',
      productCount: 645789,
      icon: '⚽',
      subcategories: ['Fitness', 'Outdoor Gear', 'Sports Equipment', 'Athletic Wear']
    },
    {
      id: 'books',
      name: 'Books & Media',
      image: '/placeholder.svg',
      productCount: 1234567,
      icon: '📚',
      subcategories: ['Books', 'Movies', 'Music', 'Games', 'Magazines']
    },
    {
      id: 'automotive',
      name: 'Automotive',
      image: '/placeholder.svg',
      productCount: 456789,
      icon: '🚗',
      subcategories: ['Car Parts', 'Tools', 'Accessories', 'Motorcycles']
    },
    {
      id: 'health-beauty',
      name: 'Health & Beauty',
      image: '/placeholder.svg',
      productCount: 789123,
      icon: '💄',
      subcategories: ['Skincare', 'Makeup', 'Health Supplements', 'Personal Care']
    },
    {
      id: 'toys-games',
      name: 'Toys & Games',
      image: '/placeholder.svg',
      productCount: 345678,
      icon: '🎮',
      subcategories: ['Video Games', 'Board Games', 'Toys', 'Collectibles']
    }
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Browse Categories</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover millions of products across all major categories. 
            Find exactly what you're looking for with our organized marketplace sections.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">All Categories</h2>
            <Badge variant="secondary">
              {mainCategories.length} categories
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12" 
          : "space-y-4 mb-12"
        }>
          {mainCategories.map((category) => (
            <div key={category.id} className="card-product group cursor-pointer">
              {/* Category Image */}
              <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg mb-4 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl">{category.icon}</span>
                </div>
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-white/90 text-foreground">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                </div>
              </div>

              {/* Category Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Package className="h-4 w-4 mr-1" />
                    {formatNumber(category.productCount)}+ products
                  </p>
                </div>

                {/* Subcategories */}
                <div className="flex flex-wrap gap-1">
                  {category.subcategories.slice(0, 3).map((sub) => (
                    <Badge key={sub} variant="outline" className="text-xs">
                      {sub}
                    </Badge>
                  ))}
                  {category.subcategories.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{category.subcategories.length - 3} more
                    </Badge>
                  )}
                </div>

                <Button 
                  variant="outline" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  Browse {category.name}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Popular in Each Category */}
        <section className="space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Popular in Categories</h2>
            <p className="text-muted-foreground">
              Trending products in each category
            </p>
          </div>

          {mainCategories.slice(0, 3).map((category) => (
            <div key={`popular-${category.id}`} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="text-xl font-semibold">Popular in {category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Most viewed products this week
                    </p>
                  </div>
                </div>
                <Button variant="outline">
                  View All {category.name}
                </Button>
              </div>

              {/* Mock popular products in category */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card-product text-center group cursor-pointer">
                    <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                      <img
                        src="/placeholder.svg"
                        alt={`Popular ${category.name} item ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      Popular {category.name} Item {i + 1}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      From $99.99
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Newsletter CTA */}
        <section className="mt-16">
          <div className="card-elevated bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 text-center">
            <h3 className="text-2xl font-bold mb-4">Stay Updated on New Categories</h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Be the first to know when we add new product categories and marketplace integrations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
              />
              <Button className="btn-hero whitespace-nowrap">
                Subscribe
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Categories;