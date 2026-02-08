# Shopify App Integration

## Overview
Sync Shopify products and orders to Google Ads campaigns automatically.

## Features
- 🛍️ Product feed sync
- 📦 Order tracking
- 🎯 Dynamic remarketing
- 💰 Conversion tracking

## Setup

### 1. Create Shopify App
```
https://partners.shopify.com
→ Apps → Create app
→ Public app
```

### 2. Required Scopes
```
read_products
read_orders
read_customers
```

### 3. Install Dependencies
```bash
npm install @shopify/shopify-api @shopify/shopify-app-express
```

### 4. Environment Variables
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,read_orders
SHOPIFY_HOST_NAME=your-domain.com
```

## Implementation

### Product Sync
```javascript
// Fetch Shopify products
const products = await shopify.product.list({ limit: 250 });

// Convert to Google Shopping feed
const feed = products.map(product => ({
  id: product.id,
  title: product.title,
  description: product.body_html,
  link: `https://yourstore.com/products/${product.handle}`,
  image_link: product.images[0]?.src,
  price: product.variants[0]?.price,
  availability: product.variants[0]?.inventory_quantity > 0 ? 'in stock' : 'out of stock'
}));

// Upload to Google Merchant Center
await googleMerchantAPI.uploadFeed(feed);
```

### Order Tracking
```javascript
// Webhook: orders/create
app.post('/webhooks/orders/create', async (req, res) => {
  const order = req.body;
  
  // Send conversion to Google Ads
  await googleAdsClient.uploadConversion({
    orderId: order.id,
    value: order.total_price,
    currency: order.currency,
    transactionId: order.order_number
  });
  
  res.status(200).send('OK');
});
```

## Routes

### Installation Flow
```
GET  /shopify/auth         - Start OAuth
GET  /shopify/callback     - OAuth callback
POST /shopify/install      - Complete installation
```

### Webhooks
```
POST /webhooks/products/create
POST /webhooks/products/update
POST /webhooks/orders/create
POST /webhooks/orders/paid
```

## Files to Create

```
shopify-app/
├── routes/
│   ├── auth.js           - OAuth flow
│   ├── webhooks.js       - Product/order webhooks
│   └── sync.js           - Manual sync endpoints
├── services/
│   ├── shopify.service.js   - Shopify API client
│   └── feed.service.js      - Feed generation
└── models/
    ├── shopify-store.model.js
    └── product-mapping.model.js
```

## Next Steps
1. Implement OAuth flow
2. Set up webhooks
3. Create product sync service
4. Build feed generator
5. Test with dev store

## Resources
- [Shopify API Docs](https://shopify.dev/api)
- [Google Merchant Center](https://merchants.google.com)
