import { Request, Response, NextFunction } from 'express';
import { ebayConnector } from '../connectors/ebayConnector';
import { ebayConnectorDemo } from '../connectors/ebayConnectorDemo';
import { env } from '../config/env';

// Helper function to check if we have real eBay credentials
function hasRealEbayCredentials(): boolean {
  const hasValidAppId = env.ebay.appId && 
                       env.ebay.appId.length > 10 && 
                       !env.ebay.appId.startsWith('your-');
  const hasValidCertId = env.ebay.certId && 
                        env.ebay.certId.length > 10 && 
                        !env.ebay.certId.startsWith('your-');
  return !!(hasValidAppId && hasValidCertId);
}

export async function testEbayConnection(req: Request, res: Response, next: NextFunction) {
  try {
    const useDemo = !hasRealEbayCredentials();
    const connector = useDemo ? ebayConnectorDemo : ebayConnector;
    
    const result = await connector.testConnection();
    
    if (useDemo) {
      result.message = `${result.message} (using demo mode - add real eBay credentials to .env for live data)`;
    }
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    next(err);
  }
}

export async function searchEbayItems(req: Request, res: Response, next: NextFunction) {
  try {
    const { keywords, categoryId, limit = 10, offset = 0 } = req.query;
    const useDemo = !hasRealEbayCredentials();
    const connector = useDemo ? ebayConnectorDemo : ebayConnector;
    
    const result = await connector.searchItems({
      keywords: keywords as string,
      categoryId: categoryId as string,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10)
    });
    
    // Add demo indicator to response
    if (useDemo) {
      (result as any).demoMode = true;
      (result as any).note = "Using demo data - add real eBay credentials for live results";
    }
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getEbayItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { itemId } = req.params;
    const useDemo = !hasRealEbayCredentials();
    const connector = useDemo ? ebayConnectorDemo : ebayConnector;
    
    const result = await connector.getItem(itemId);
    
    if (!result) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Add demo indicator to response
    if (useDemo) {
      (result as any).demoMode = true;
      (result as any).note = "Using demo data - add real eBay credentials for live results";
    }
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
