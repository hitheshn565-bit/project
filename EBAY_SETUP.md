# eBay API Setup Guide

## Getting eBay API Credentials

1. **Create eBay Developer Account**
   - Go to https://developer.ebay.com/
   - Sign up for a developer account
   - Accept the API License Agreement

2. **Create an Application**
   - Go to "My Account" > "Application Keys"
   - Click "Create an Application Key"
   - Fill in application details:
     - Application Title: "Truetag Product Aggregator"
     - Application Type: "Server-to-Server"
     - Application Use Case: "Product Search and Price Comparison"

3. **Get Your Credentials**
   After creating the application, you'll get:
   - **App ID (Client ID)**: Used for OAuth authentication
   - **Cert ID (Client Secret)**: Used with App ID for OAuth
   - **Dev ID**: Used for some legacy APIs (optional for Browse API)
   - **User Token**: For user-specific operations (optional for public search)

4. **Update .env File**
   Replace the placeholder values in your `.env` file:
   ```bash
   # eBay API Configuration
   EBAY_APP_ID=YourActualAppId-12345678-abcd-1234-efgh-123456789012
   EBAY_CERT_ID=YourActualCertId-12345678-abcd-1234-efgh-123456789012-AB
   EBAY_DEV_ID=your-actual-dev-id
   EBAY_USER_TOKEN=your-user-token-if-needed
   EBAY_SANDBOX=true  # Set to false for production
   ```

## API Endpoints We're Using

- **Browse API**: For searching and getting item details
  - Endpoint: `/buy/browse/v1/item_summary/search`
  - Scope: `https://api.ebay.com/oauth/api_scope`
  - Authentication: OAuth 2.0 Client Credentials

## Testing Your Setup

Once you have real credentials:

1. **Test Connection**:
   ```bash
   curl http://localhost:3000/api/v1/connectors/ebay/test
   ```

2. **Search Products**:
   ```bash
   curl "http://localhost:3000/api/v1/connectors/ebay/search?keywords=laptop&limit=5"
   ```

3. **Check Configuration**:
   ```bash
   curl http://localhost:3000/api/v1/connectors/ebay/config
   ```

## Troubleshooting

- **401 Unauthorized**: Check your App ID and Cert ID are correct
- **403 Forbidden**: Your application may not have the right permissions
- **Rate Limiting**: eBay has rate limits, especially in sandbox
- **Sandbox vs Production**: Make sure EBAY_SANDBOX matches your credentials

## Rate Limits

- **Sandbox**: 5,000 calls per day
- **Production**: Varies by API and application approval status

## Next Steps

After getting real credentials, the connector will:
1. Authenticate with eBay OAuth
2. Search for products
3. Normalize product data
4. Store in our canonical product format
5. Track price changes over time
