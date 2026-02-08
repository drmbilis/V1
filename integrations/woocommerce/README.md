# WooCommerce Plugin Integration

## Overview
WordPress/WooCommerce plugin for automatic Google Ads integration.

## Features
- 🛒 Product catalog sync
- 📊 Conversion tracking
- 🎯 Smart Shopping campaigns
- 💳 Enhanced ecommerce tracking

## Setup

### 1. Plugin Structure
```
woocommerce-google-ads-ai/
├── google-ads-ai.php         - Main plugin file
├── includes/
│   ├── class-api-client.php  - Backend API client
│   ├── class-product-sync.php
│   └── class-conversion-tracking.php
├── admin/
│   ├── settings.php          - Settings page
│   └── dashboard.php         - Dashboard widget
└── assets/
    ├── css/admin.css
    └── js/admin.js
```

### 2. Plugin Header
```php
<?php
/**
 * Plugin Name: Google Ads AI Manager
 * Description: AI-powered Google Ads optimization for WooCommerce
 * Version: 1.0.0
 * Author: Your Name
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * WC tested up to: 8.0
 */
```

### 3. WooCommerce REST API
```php
// Product sync endpoint
add_action('rest_api_init', function() {
    register_rest_route('google-ads-ai/v1', '/products', [
        'methods' => 'GET',
        'callback' => 'sync_products_callback'
    ]);
});

function sync_products_callback($request) {
    $products = wc_get_products([
        'limit' => 100,
        'status' => 'publish'
    ]);
    
    $feed = array_map(function($product) {
        return [
            'id' => $product->get_id(),
            'title' => $product->get_name(),
            'description' => $product->get_description(),
            'price' => $product->get_price(),
            'image' => wp_get_attachment_url($product->get_image_id()),
            'link' => $product->get_permalink(),
            'stock' => $product->is_in_stock()
        ];
    }, $products);
    
    return new WP_REST_Response($feed, 200);
}
```

### 4. Conversion Tracking
```php
// Add to order completion
add_action('woocommerce_thankyou', 'send_conversion_to_google_ads');

function send_conversion_to_google_ads($order_id) {
    $order = wc_get_order($order_id);
    
    $conversion_data = [
        'order_id' => $order_id,
        'value' => $order->get_total(),
        'currency' => $order->get_currency(),
        'items' => array_map(function($item) {
            return [
                'product_id' => $item->get_product_id(),
                'quantity' => $item->get_quantity(),
                'price' => $item->get_total()
            ];
        }, $order->get_items())
    ];
    
    // Send to backend API
    wp_remote_post('https://api.your-domain.com/api/v1/conversions', [
        'body' => json_encode($conversion_data),
        'headers' => [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . get_option('google_ads_ai_api_key')
        ]
    ]);
}
```

### 5. Admin Settings Page
```php
add_action('admin_menu', 'google_ads_ai_menu');

function google_ads_ai_menu() {
    add_menu_page(
        'Google Ads AI',
        'Google Ads AI',
        'manage_options',
        'google-ads-ai',
        'google_ads_ai_settings_page',
        'dashicons-chart-line'
    );
}

function google_ads_ai_settings_page() {
    ?>
    <div class="wrap">
        <h1>Google Ads AI Settings</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('google_ads_ai_settings');
            do_settings_sections('google-ads-ai');
            submit_button();
            ?>
        </form>
    </div>
    <?php
}
```

## Backend API Endpoints

### Product Feed
```
GET  /api/v1/woocommerce/products
POST /api/v1/woocommerce/sync
```

### Conversions
```
POST /api/v1/woocommerce/conversions
```

### Authentication
```
POST /api/v1/woocommerce/connect
GET  /api/v1/woocommerce/status
```

## Implementation Steps

1. **Create Plugin Structure**
   ```bash
   mkdir -p woocommerce-google-ads-ai/{includes,admin,assets}
   ```

2. **Implement API Client**
   - Product sync
   - Conversion tracking
   - Authentication

3. **Build Admin Interface**
   - Settings page
   - Dashboard widget
   - Sync status

4. **Add Hooks**
   - Product create/update
   - Order completion
   - Stock changes

5. **Testing**
   - Local WordPress install
   - WooCommerce test orders
   - API integration tests

## Files Needed

```
backend/src/modules/woocommerce/
├── woocommerce.routes.js     - API endpoints
├── woocommerce.service.js    - Business logic
└── product-sync.worker.js    - Background sync
```

## Resources
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [WordPress Plugin Handbook](https://developer.wordpress.org/plugins/)
- [WooCommerce Action Reference](https://woocommerce.github.io/code-reference/)
