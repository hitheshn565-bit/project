import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface EbaySearchParams {
  keywords?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
}

export interface EbayItem {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  condition: string;
  itemWebUrl: string;
  image?: {
    imageUrl: string;
  };
  seller?: {
    username?: string;
    feedbackPercentage?: string;
    feedbackScore?: number;
  };
  shippingOptions?: Array<{
    shippingCost: {
      value: string;
      currency: string;
    };
    shippingServiceName?: string;
  }>;
  categories?: Array<{
    categoryId: string;
    categoryName: string;
  }>;
  shortDescription?: string;
  itemLocation?: {
    postalCode?: string;
    country?: string;
    city?: string;
  };
  leafCategoryIds?: string[];
  conditionId?: string;
  buyingOptions?: string[];
  legacyItemId?: string;
}

export interface EbaySearchResponse {
  href: string;
  total: number;
  next?: string;
  limit: number;
  offset: number;
  itemSummaries: EbayItem[];
}

class EbayConnector {
  private baseUrl: string;
  private oauthBaseUrl: string;
  private appId: string;
  private certId: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.baseUrl = env.ebay.sandbox 
      ? 'https://api.sandbox.ebay.com'
      : 'https://api.ebay.com';
    this.oauthBaseUrl = env.ebay.sandbox
      ? 'https://api.sandbox.ebay.com'
      : 'https://api.ebay.com';
    this.appId = env.ebay.appId;
    this.certId = env.ebay.certId;
    
    if (!this.appId || !this.certId) {
      throw new Error('eBay App ID and Cert ID are required');
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Get client credentials token for application access
      const credentials = Buffer.from(`${this.appId}:${this.certId}`).toString('base64');
      
      const response = await axios.post(
        `${this.oauthBaseUrl}/identity/v1/oauth2/token`,
        'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 90% of actual expiry to refresh before it expires
      this.tokenExpiry = Date.now() + (response.data.expires_in * 900);
      
      logger.info('eBay access token obtained', { 
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type 
      });
      
      return this.accessToken;
    } catch (error: any) {
      logger.error('Failed to get eBay access token', { 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(`Failed to authenticate with eBay: ${error.message}`);
    }
  }

  private async getHeaders() {
    const token = await this.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
    };
  }

  async searchItems(params: EbaySearchParams): Promise<EbaySearchResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.keywords) {
        searchParams.append('q', params.keywords);
      }
      
      if (params.categoryId) {
        searchParams.append('category_ids', params.categoryId);
      }
      
      searchParams.append('limit', (params.limit || 10).toString());
      searchParams.append('offset', (params.offset || 0).toString());
      
      // Add common filters
      searchParams.append('filter', 'buyingOptions:{FIXED_PRICE}');
      searchParams.append('filter', 'conditions:{NEW,USED_EXCELLENT,USED_VERY_GOOD,USED_GOOD}');
      
      const url = `${this.baseUrl}/buy/browse/v1/item_summary/search?${searchParams.toString()}`;
      
      logger.info('Making eBay API request', { url, params });
      
      const response = await axios.get(url, {
        headers: await this.getHeaders(),
        timeout: 10000
      });
      
      logger.info('eBay API response received', { 
        status: response.status, 
        total: response.data.total,
        itemCount: response.data.itemSummaries?.length || 0
      });
      
      return response.data;
    } catch (error: any) {
      logger.error('eBay API request failed', { 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async getItem(itemId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/buy/browse/v1/item/${itemId}`;
      
      logger.info('Getting eBay item details', { itemId, url });
      
      const response = await axios.get(url, {
        headers: await this.getHeaders(),
        timeout: 10000
      });
      
      logger.info('eBay item details received', { 
        status: response.status,
        itemId: response.data.itemId
      });
      
      return response.data;
    } catch (error: any) {
      logger.error('eBay get item failed', { 
        error: error.message,
        itemId,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Test with a simple search for "laptop"
      const result = await this.searchItems({ 
        keywords: 'laptop', 
        limit: 5 
      });
      
      return {
        success: true,
        message: `Successfully connected to eBay API. Found ${result.total} items.`,
        data: {
          total: result.total,
          itemCount: result.itemSummaries?.length || 0,
          sampleItems: result.itemSummaries?.slice(0, 2).map(item => ({
            title: item.title,
            price: item.price,
            itemId: item.itemId
          }))
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `eBay API connection failed: ${error.message}`,
        data: {
          error: error.response?.data || error.message,
          status: error.response?.status
        }
      };
    }
  }
}

export const ebayConnector = new EbayConnector();
