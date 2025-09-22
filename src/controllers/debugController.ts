import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export async function checkEbayConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const config = {
      hasAppId: !!env.ebay.appId,
      hasCertId: !!env.ebay.certId,
      hasDevId: !!env.ebay.devId,
      hasUserToken: !!env.ebay.userToken,
      sandbox: env.ebay.sandbox,
      appIdLength: env.ebay.appId?.length || 0,
      certIdLength: env.ebay.certId?.length || 0,
      // Don't expose actual values for security
      appIdPreview: env.ebay.appId ? `${env.ebay.appId.substring(0, 8)}...` : 'missing',
      certIdPreview: env.ebay.certId ? `${env.ebay.certId.substring(0, 8)}...` : 'missing'
    };
    
    res.status(200).json({
      message: 'eBay configuration check',
      config,
      notes: {
        required: 'App ID and Cert ID are required for OAuth client credentials flow',
        optional: 'Dev ID and User Token are for other eBay API operations',
        sandbox: 'Currently using sandbox environment'
      }
    });
  } catch (err) {
    next(err);
  }
}
