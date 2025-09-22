import { useState } from "react";
import { Clock, TrendingDown, Zap, Target, Star, Timer, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/product/ProductCard";

const Deals = () => {
  // Mock deals data
  const [todaysDeals] = useState([
    {
      id: '1',
      title: 'Apple MacBook Air M2 13-inch 256GB',
      image: '/placeholder.svg',
      currentPrice: 899,
      originalPrice: 1199,
      marketplace: 'Best Buy',
      rating: 4.8,
      reviewCount: 3421,
      isOnSale: true,
      savingsPercent: 25,
      timeLeft: '2h 45m'
    },
    {
      id: '2',
      title: 'Sony WH-1000XM5 Wireless Headphones',
      image: '/placeholder.svg',
      currentPrice: 279,
      originalPrice: 399,
      marketplace: 'Amazon',
      rating: 4.7,
      reviewCount: 1892,
      isOnSale: true,
      savingsPercent: 30,
      timeLeft: '5h 12m'
    },
    {
      id: '3',
      title: 'Nintendo Switch OLED Console',
      image: '/placeholder.svg',
      currentPrice: 299,
      originalPrice: 349,
      marketplace: 'GameStop',
      rating: 4.9,
      reviewCount: 5432,
      isOnSale: true,
      savingsPercent: 14,
      timeLeft: '1h 23m'
    },
    {
      id: '4',
      title: 'Samsung 65" QLED 4K Smart TV',
      image: '/placeholder.svg',
      currentPrice: 799,
      originalPrice: 1299,
      marketplace: 'Walmart',
      rating: 4.6,
      reviewCount: 876,
      isOnSale: true,
      savingsPercent: 38,
      timeLeft: '8h 34m'
    }
  ]);

  const [flashDeals] = useState([
    {
      id: '5',
      title: 'Apple AirPods Pro 2nd Gen',
      image: '/placeholder.svg',
      currentPrice: 199,
      originalPrice: 249,
      marketplace: 'Apple Store',
      rating: 4.8,
      reviewCount: 8765,
      isOnSale: true,
      savingsPercent: 20,
      timeLeft: '45m'
    },
    {
      id: '6',
      title: 'Dyson V15 Detect Vacuum',
      image: '/placeholder.svg',
      currentPrice: 549,
      originalPrice: 749,
      marketplace: 'Dyson',
      rating: 4.7,
      reviewCount: 2341,
      isOnSale: true,
      savingsPercent: 27,
      timeLeft: '1h 15m'
    }
  ]);

  const [priceDrops] = useState([
    {
      id: '7',
      title: 'Google Pixel 8 Pro 256GB',
      image: '/placeholder.svg',
      currentPrice: 799,
      originalPrice: 999,
      marketplace: 'Google Store',
      rating: 4.6,
      reviewCount: 432,
      isOnSale: true,
      savingsPercent: 20,
      dropAmount: 200
    },
    {
      id: '8',
      title: 'iPad Air 5th Gen 256GB',
      image: '/placeholder.svg',
      currentPrice: 649,
      originalPrice: 749,
      marketplace: 'Apple Store',
      rating: 4.8,
      reviewCount: 1234,
      isOnSale: true,
      savingsPercent: 13,
      dropAmount: 100
    }
  ]);

  const dealStats = [
    { label: 'Active Deals', value: '2,847', icon: <Target className="h-5 w-5" /> },
    { label: 'Avg. Savings', value: '32%', icon: <TrendingDown className="h-5 w-5" /> },
    { label: 'Flash Deals', value: '156', icon: <Zap className="h-5 w-5" /> },
    { label: 'Ending Soon', value: '23', icon: <Clock className="h-5 w-5" /> }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const DealCard = ({ deal, showTimer = false }: { deal: any, showTimer?: boolean }) => (
    <div className="card-product group cursor-pointer relative">
      {/* Timer Badge */}
      {showTimer && deal.timeLeft && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-destructive text-destructive-foreground animate-pulse">
            <Timer className="h-3 w-3 mr-1" />
            {deal.timeLeft}
          </Badge>
        </div>
      )}
      
      {/* Savings Badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge className="bg-success text-success-foreground">
          <TrendingDown className="h-3 w-3 mr-1" />
          {deal.savingsPercent}% OFF
        </Badge>
      </div>

      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-4">
        <img
          src={deal.image}
          alt={deal.title}
          className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder.svg";
          }}
        />
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {deal.title}
        </h3>

        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${
                i < Math.floor(deal.rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">
            ({deal.reviewCount})
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-primary">
              {formatPrice(deal.currentPrice)}
            </span>
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(deal.originalPrice)}
            </span>
          </div>
          <p className="text-xs text-success font-medium">
            Save {formatPrice(deal.originalPrice - deal.currentPrice)}
            {deal.dropAmount && ` (${formatPrice(deal.dropAmount)} price drop)`}
          </p>
        </div>

        <Badge variant="secondary" className="text-xs">
          {deal.marketplace}
        </Badge>

        <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
          Claim Deal
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gradient">
            🔥 Best Deals & Discounts
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover incredible savings across all categories. Limited-time offers, 
            flash deals, and price drops updated in real-time.
          </p>
        </div>

        {/* Deal Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {dealStats.map((stat, index) => (
            <div key={index} className="card-elevated text-center">
              <div className="flex justify-center mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-white">
                  {stat.icon}
                </div>
              </div>
              <div className="text-2xl font-bold text-gradient">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Deals Tabs */}
        <Tabs defaultValue="today" className="mb-12">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">Today's Deals</TabsTrigger>
            <TabsTrigger value="flash">Flash Deals</TabsTrigger>
            <TabsTrigger value="drops">Price Drops</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          {/* Today's Best Deals */}
          <TabsContent value="today" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Today's Best Deals</h2>
                <p className="text-muted-foreground">Biggest price drops ending today</p>
              </div>
              <Button variant="outline">View All</Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {todaysDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} showTimer />
              ))}
            </div>
          </TabsContent>

          {/* Flash Deals */}
          <TabsContent value="flash" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center">
                  <Zap className="h-6 w-6 mr-2 text-warning" />
                  Flash Deals
                </h2>
                <p className="text-muted-foreground">Limited time offers - act fast!</p>
              </div>
              <Button variant="outline">View All</Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {flashDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} showTimer />
              ))}
            </div>

            {/* Flash Deal Alert */}
            <div className="card-elevated bg-gradient-to-r from-warning/10 to-destructive/10 border-warning/20">
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning text-warning-foreground">
                  <Zap className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Flash Deal Alert!</h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified instantly when new flash deals go live
                  </p>
                </div>
                <Button className="btn-hero">Enable Alerts</Button>
              </div>
            </div>
          </TabsContent>

          {/* Price Drops */}
          <TabsContent value="drops" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center">
                  <TrendingDown className="h-6 w-6 mr-2 text-success" />
                  Recent Price Drops
                </h2>
                <p className="text-muted-foreground">Prices just dropped on these items</p>
              </div>
              <Button variant="outline">View All</Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {priceDrops.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </TabsContent>

          {/* Trending Deals */}
          <TabsContent value="trending" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center">
                  <Star className="h-6 w-6 mr-2 text-primary" />
                  Trending Deals
                </h2>
                <p className="text-muted-foreground">Most popular deals right now</p>
              </div>
              <Button variant="outline">View All</Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...todaysDeals, ...flashDeals].slice(0, 4).map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Deal Subscription CTA */}
        <section className="mt-16">
          <div className="card-elevated bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-white">
                <Bell className="h-8 w-8" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4">Never Miss a Deal Again!</h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Set up personalized deal alerts and get notified when products you want go on sale. 
              Join 100,000+ smart shoppers saving money every day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email for deal alerts"
                className="flex-1"
              />
              <Button size="lg" className="btn-hero whitespace-nowrap">
                Get Deal Alerts
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              ⚡ Instant notifications • 🎯 Personalized deals • 🚫 No spam
            </p>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Deals;