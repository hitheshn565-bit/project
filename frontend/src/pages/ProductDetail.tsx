import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Heart, Share2, ShoppingCart, Bell, TrendingDown, Star, ExternalLink, ChevronLeft, ChevronRight, ZoomIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/product/ProductCard";
import { useWishlistStore, useCartStore, useAlertsStore } from "@/stores";
import { apiEndpoints } from "@/services/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [priceAlertTarget, setPriceAlertTarget] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { addAlert } = useAlertsStore();

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiEndpoints.getProduct(id);
        
        if (response.data) {
          // Transform scraped product to match our product detail format
          const scrapedProduct = response.data;
          const transformedProduct = {
            id: scrapedProduct.product_url || id,
            title: scrapedProduct.title,
            brand: scrapedProduct.title?.split(' ')[0] || 'Unknown',
            category: 'Electronics > General',
            image: scrapedProduct.image_url || '/placeholder.svg',
            images: [scrapedProduct.image_url || '/placeholder.svg'],
            currentPrice: parseFloat(scrapedProduct.price) || 0,
            originalPrice: scrapedProduct.original_price ? parseFloat(scrapedProduct.original_price) : undefined,
            rating: parseFloat(scrapedProduct.rating) || 4.5,
            reviewCount: parseInt(scrapedProduct.reviews_count) || 0,
            description: `${scrapedProduct.title} - Available on ${scrapedProduct.marketplace}`,
            specifications: {
              'Marketplace': scrapedProduct.marketplace,
              'Product URL': scrapedProduct.product_url || 'N/A',
              'Rating': scrapedProduct.rating || 'N/A',
              'Reviews': scrapedProduct.reviews_count || 'N/A'
            },
            condition: 'New',
            marketplace: scrapedProduct.marketplace,
            product_url: scrapedProduct.product_url
          };
          
          setProduct(transformedProduct);
        } else {
          setError('Product not found');
        }
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.response?.data?.error || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Mock fallback product data for when API fails
  const fallbackProduct = {
    id: id || '1',
    title: 'Apple iPhone 15 Pro Max 256GB Natural Titanium',
    brand: 'Apple',
    category: 'Electronics > Smartphones',
    image: '/placeholder.svg', // Add this for compatibility
    images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
    currentPrice: 1099,
    originalPrice: 1199,
    rating: 4.8,
    reviewCount: 2543,
    description: 'The iPhone 15 Pro Max features a 6.7-inch Super Retina XDR display, A17 Pro chip, and advanced camera system with 5x telephoto zoom.',
    specifications: {
      'Screen Size': '6.7 inches',
      'Storage': '256GB',
      'Color': 'Natural Titanium',
      'Camera': '48MP Main + 12MP Ultra Wide + 12MP Telephoto',
      'Battery': 'Up to 29 hours video playback',
      'Operating System': 'iOS 17'
    },
    condition: 'New',
    marketplace: 'eBay'
  };

  // Mock price offers
  const priceOffers = [
    { seller: 'eBay Store', price: 1099, shipping: 0, total: 1099, rating: 4.9, isBestDeal: true },
    { seller: 'Amazon', price: 1149, shipping: 0, total: 1149, rating: 4.8, isBestDeal: false },
    { seller: 'Best Buy', price: 1199, shipping: 0, total: 1199, rating: 4.7, isBestDeal: false },
    { seller: 'Apple Store', price: 1199, shipping: 0, total: 1199, rating: 4.9, isBestDeal: false },
  ];

  // Mock price history data
  const priceHistory = [
    { date: '2024-01-01', price: 1199 },
    { date: '2024-01-15', price: 1149 },
    { date: '2024-02-01', price: 1129 },
    { date: '2024-02-15', price: 1099 },
    { date: '2024-03-01', price: 1089 },
    { date: '2024-03-15', price: 1099 },
  ];

  // Mock similar products
  const similarProducts = [
    {
      id: '2',
      title: 'iPhone 15 Pro 256GB Blue Titanium',
      image: '/placeholder.svg',
      currentPrice: 999,
      originalPrice: 1099,
      marketplace: 'eBay',
      rating: 4.7,
      reviewCount: 1892,
      isOnSale: true,
      savingsPercent: 9
    },
    {
      id: '3',
      title: 'Samsung Galaxy S24 Ultra 256GB',
      image: '/placeholder.svg',
      currentPrice: 1049,
      marketplace: 'Amazon',
      rating: 4.6,
      reviewCount: 3421
    },
    {
      id: '4',
      title: 'Google Pixel 8 Pro 256GB',
      image: '/placeholder.svg',
      currentPrice: 899,
      originalPrice: 999,
      marketplace: 'Google Store',
      rating: 4.5,
      reviewCount: 876,
      isOnSale: true,
      savingsPercent: 10
    }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading product details...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">{error || 'The product you are looking for does not exist.'}</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);

  const handleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = () => {
    addItem(product);
  };

  const handlePriceAlert = () => {
    const targetPrice = parseFloat(priceAlertTarget);
    if (targetPrice && targetPrice < product.currentPrice) {
      addAlert(product.id, product.title, targetPrice, product.currentPrice);
      setPriceAlertTarget('');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <a href="/" className="hover:text-primary">Home</a>
          <span>/</span>
          <a href="/categories" className="hover:text-primary">Electronics</a>
          <span>/</span>
          <a href="/categories/smartphones" className="hover:text-primary">Smartphones</a>
          <span>/</span>
          <span className="text-foreground">iPhone 15 Pro Max</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
              <img
                src={product.images[currentImageIndex]}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.svg";
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm hover:bg-white"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              {/* Navigation arrows */}
              {product.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white"
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === 0 ? product.images.length - 1 : prev - 1
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white"
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === product.images.length - 1 ? 0 : prev + 1
                    )}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Thumbnail Navigation */}
            <div className="flex space-x-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden ${
                    currentImageIndex === index ? 'border-primary' : 'border-border'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <p className="text-lg text-muted-foreground">{product.brand}</p>
              
              {/* Rating */}
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.currentPrice)}
                </span>
                {product.originalPrice && product.originalPrice > product.currentPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                {product.originalPrice && product.originalPrice > product.currentPrice && (
                  <Badge className="bg-success text-success-foreground">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Save {formatPrice(product.originalPrice - product.currentPrice)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Condition & Marketplace */}
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Condition: {product.condition}</Badge>
              <Badge variant="secondary">From {product.marketplace}</Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {product.product_url && (
                <Button
                  onClick={() => window.open(product.product_url, '_blank')}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  View Deal on {product.marketplace}
                </Button>
              )}
              <Button
                onClick={handleAddToCart}
                size="lg"
                variant="outline"
                className="flex-1"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleWishlist}
                className={isWishlisted ? 'text-red-500 border-red-500' : ''}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Price Alert */}
            <div className="card-elevated">
              <h3 className="font-semibold mb-3 flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Price Alert
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Get notified when the price drops below your target
              </p>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Target price"
                  value={priceAlertTarget}
                  onChange={(e) => setPriceAlertTarget(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handlePriceAlert}>
                  Set Alert
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="offers" className="mb-12">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="offers">Price Comparison</TabsTrigger>
            <TabsTrigger value="details">Product Details</TabsTrigger>
            <TabsTrigger value="history">Price History</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Price Comparison */}
          <TabsContent value="offers" className="space-y-4">
            <div className="card-elevated">
              <h3 className="text-xl font-semibold mb-4">Compare Prices</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Shipping</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceOffers.map((offer, index) => (
                    <TableRow key={index} className={offer.isBestDeal ? 'bg-success/10' : ''}>
                      <TableCell className="font-medium">
                        {offer.seller}
                        {offer.isBestDeal && (
                          <Badge className="ml-2 bg-success text-success-foreground">
                            Best Deal
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatPrice(offer.price)}</TableCell>
                      <TableCell>{offer.shipping === 0 ? 'Free' : formatPrice(offer.shipping)}</TableCell>
                      <TableCell className="font-semibold">{formatPrice(offer.total)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          {offer.rating}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Go to Store
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Product Details */}
          <TabsContent value="details" className="space-y-4">
            <div className="card-elevated">
              <h3 className="text-xl font-semibold mb-4">Product Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{product.description}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Specifications</h4>
                  <Table>
                    <TableBody>
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium">{key}</TableCell>
                          <TableCell>{value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Price History */}
          <TabsContent value="history" className="space-y-4">
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Price History</h3>
                <div className="flex space-x-2">
                  {['7', '30', '90'].map((period) => (
                    <Button
                      key={period}
                      variant={selectedPeriod === period ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPeriod(period)}
                    >
                      {period} days
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [formatPrice(Number(value)), 'Price']} />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <Alert>
                <TrendingDown className="h-4 w-4" />
                <AlertDescription>
                  Price has dropped by {formatPrice(product.originalPrice! - product.currentPrice)} ({Math.round(((product.originalPrice! - product.currentPrice) / product.originalPrice!) * 100)}%) in the last 30 days
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews" className="space-y-4">
            <div className="card-elevated">
              <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-4" />
                <p>Reviews coming soon</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Similar Products */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {similarProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProductDetail;