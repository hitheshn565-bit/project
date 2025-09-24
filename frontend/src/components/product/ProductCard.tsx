import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, TrendingDown, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  id: string;
  title: string;
  image: string;
  currentPrice: number;
  originalPrice?: number;
  marketplace: string;
  rating?: number;
  reviewCount?: number;
  isOnSale?: boolean;
  savingsPercent?: number;
  marketplaceLogo?: string;
  product_url?: string; // External product URL for "View Deal"
}

const ProductCard = ({
  id,
  title,
  image,
  currentPrice,
  originalPrice,
  marketplace,
  rating = 4.5,
  reviewCount = 128,
  isOnSale = false,
  savingsPercent,
  marketplaceLogo,
  product_url
}: ProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const handleViewDeal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product_url) {
      window.open(product_url, '_blank');
    }
  };

  const handleProductClick = () => {
    // Create a unique product identifier from title and marketplace
    const productIdentifier = `${marketplace}-${title.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50)}`;
    
    // Store product data in sessionStorage for the product detail page
    sessionStorage.setItem(`product-${productIdentifier}`, JSON.stringify({
      id,
      title,
      image,
      currentPrice,
      originalPrice,
      marketplace,
      rating,
      reviewCount,
      product_url
    }));
    
    // Navigate to our internal product detail page
    navigate(`/product/${encodeURIComponent(productIdentifier)}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  return (
    <div className="card-product group cursor-pointer" onClick={handleProductClick}>
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted min-h-[200px]">
        {!imageLoaded && (
          <div className="absolute inset-0 loading-shimmer rounded-lg" />
        )}
        <img
          src={image}
          alt={title}
          className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder.svg";
            setImageLoaded(true);
          }}
        />
        
        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 backdrop-blur-sm hover:bg-white"
          onClick={handleWishlist}
        >
          <Heart 
            className={`h-4 w-4 ${
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`} 
          />
        </Button>

        {/* Sale Badge */}
        {isOnSale && savingsPercent && (
          <Badge className="absolute top-2 left-2 bg-success text-success-foreground">
            <TrendingDown className="h-3 w-3 mr-1" />
            {savingsPercent}% OFF
          </Badge>
        )}

        {/* Marketplace Badge */}
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="text-xs">
            {marketplace}
          </Badge>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-3 mt-4">
        {/* Title */}
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Rating */}
        <div className="flex items-center space-x-1">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {rating} ({reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-primary">
              {formatPrice(currentPrice)}
            </span>
            {originalPrice && originalPrice > currentPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
          {originalPrice && originalPrice > currentPrice && (
            <p className="text-xs text-success font-medium">
              Save {formatPrice(originalPrice - currentPrice)}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            onClick={handleViewDeal}
            disabled={!product_url}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View Deal
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="px-3"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Add to cart functionality
            }}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Compare */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-primary"
        >
          Compare Prices
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;