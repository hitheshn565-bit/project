import { logger } from '../utils/logger';
import { EbaySearchParams, EbaySearchResponse, EbayItem } from './ebayConnector';

// Mock eBay data for demonstration
const mockEbayItems: EbayItem[] = [
  {
    itemId: "v1|123456789|0",
    title: "Apple MacBook Pro 16-inch M3 Pro Chip 512GB SSD Space Black",
    price: {
      value: "2399.00",
      currency: "USD"
    },
    condition: "New",
    itemWebUrl: "https://www.ebay.com/itm/123456789",
    image: {
      imageUrl: "https://i.ebayimg.com/images/g/mockimage1.jpg"
    },
    seller: {
      username: "apple_authorized_dealer",
      feedbackPercentage: "99.8",
      feedbackScore: 15420
    },
    shippingOptions: [{
      shippingCost: {
        value: "0.00",
        currency: "USD"
      },
      shippingServiceName: "Free Standard Shipping"
    }]
  },
  {
    itemId: "v1|987654321|0",
    title: "Dell XPS 13 Laptop Intel i7 16GB RAM 512GB SSD",
    price: {
      value: "1299.99",
      currency: "USD"
    },
    condition: "New",
    itemWebUrl: "https://www.ebay.com/itm/987654321",
    image: {
      imageUrl: "https://i.ebayimg.com/images/g/mockimage2.jpg"
    },
    seller: {
      username: "dell_outlet_store",
      feedbackPercentage: "99.5",
      feedbackScore: 8930
    },
    shippingOptions: [{
      shippingCost: {
        value: "15.99",
        currency: "USD"
      },
      shippingServiceName: "Standard Shipping"
    }]
  },
  {
    itemId: "v1|456789123|0",
    title: "HP Pavilion Gaming Laptop AMD Ryzen 5 8GB RAM 256GB SSD",
    price: {
      value: "699.00",
      currency: "USD"
    },
    condition: "New",
    itemWebUrl: "https://www.ebay.com/itm/456789123",
    image: {
      imageUrl: "https://i.ebayimg.com/images/g/mockimage3.jpg"
    },
    seller: {
      username: "hp_direct",
      feedbackPercentage: "99.2",
      feedbackScore: 12450
    },
    shippingOptions: [{
      shippingCost: {
        value: "0.00",
        currency: "USD"
      },
      shippingServiceName: "Free Economy Shipping"
    }]
  },
  {
    itemId: "v1|789123456|0",
    title: "Lenovo ThinkPad X1 Carbon Business Laptop Intel i5 16GB",
    price: {
      value: "1599.99",
      currency: "USD"
    },
    condition: "Refurbished",
    itemWebUrl: "https://www.ebay.com/itm/789123456",
    image: {
      imageUrl: "https://i.ebayimg.com/images/g/mockimage4.jpg"
    },
    seller: {
      username: "lenovo_certified",
      feedbackPercentage: "98.9",
      feedbackScore: 6780
    },
    shippingOptions: [{
      shippingCost: {
        value: "25.00",
        currency: "USD"
      },
      shippingServiceName: "Express Shipping"
    }]
  },
  {
    itemId: "v1|321654987|0",
    title: "ASUS ROG Strix Gaming Laptop NVIDIA RTX 4060 32GB RAM",
    price: {
      value: "1899.00",
      currency: "USD"
    },
    condition: "New",
    itemWebUrl: "https://www.ebay.com/itm/321654987",
    image: {
      imageUrl: "https://i.ebayimg.com/images/g/mockimage5.jpg"
    },
    seller: {
      username: "asus_gaming_store",
      feedbackPercentage: "99.7",
      feedbackScore: 9340
    },
    shippingOptions: [{
      shippingCost: {
        value: "0.00",
        currency: "USD"
      },
      shippingServiceName: "Free 2-Day Shipping"
    }]
  }
];

export class EbayConnectorDemo {
  async searchItems(params: EbaySearchParams): Promise<EbaySearchResponse> {
    logger.info('Demo eBay search', { params });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredItems = [...mockEbayItems];
    
    // Filter by keywords if provided
    if (params.keywords) {
      const keywords = params.keywords.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.title.toLowerCase().includes(keywords)
      );
    }
    
    // Apply pagination
    const limit = params.limit || 10;
    const offset = params.offset || 0;
    const paginatedItems = filteredItems.slice(offset, offset + limit);
    
    return {
      href: `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${params.keywords || ''}`,
      total: filteredItems.length,
      limit,
      offset,
      next: offset + limit < filteredItems.length ? 
        `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${params.keywords || ''}&offset=${offset + limit}` : 
        undefined,
      itemSummaries: paginatedItems
    };
  }

  async getItem(itemId: string): Promise<EbayItem | null> {
    logger.info('Demo eBay get item', { itemId });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const item = mockEbayItems.find(item => item.itemId === itemId);
    return item || null;
  }

  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    logger.info('Demo eBay connection test');
    
    return {
      success: true,
      message: "Demo mode: eBay connector working with mock data",
      data: {
        mode: "demo",
        total: mockEbayItems.length,
        sampleItems: mockEbayItems.slice(0, 2).map(item => ({
          title: item.title,
          price: item.price,
          itemId: item.itemId
        }))
      }
    };
  }
}

export const ebayConnectorDemo = new EbayConnectorDemo();
