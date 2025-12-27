# Data Import Guide

This guide explains how to import order data from different marketplaces into SoukHub.

## Supported Formats

| Marketplace | Format | Export Source |
|-------------|--------|---------------|
| Amazon UAE | TSV | Seller Central |
| Cartlow | CSV | Merchant Portal |
| Revibe | CSV | Seller Dashboard |

---

## Amazon UAE

### Export from Seller Central

1. Log in to [Amazon Seller Central](https://sellercentral.amazon.ae/)
2. Go to **Orders** → **Order Reports**
3. Click **Request Report**
4. Select report type: **All Orders**
5. Choose date range
6. Click **Request**
7. Download the TSV file when ready

### Required Columns

| Column | Description | Maps To |
|--------|-------------|---------|
| amazon-order-id | Order ID | marketplace_order_id |
| purchase-date | Order date | order_date |
| order-status | Status | status |
| buyer-name | Customer name | customer_name |
| buyer-email | Customer email | customer_email |
| ship-city | Shipping city | shipping_city |
| ship-country | Country code | shipping_country |
| item-price | Item price | subtotal |
| shipping-price | Shipping cost | shipping_cost |
| item-tax | Tax amount | tax |
| item-promotion-discount | Discount | discount |
| currency | Currency code | currency |
| fulfillment-channel | FBA/FBM | fulfillment |
| payment-method | Payment type | payment_method |

### Status Mapping

| Amazon Status | SoukHub Status |
|---------------|----------------|
| Pending | pending |
| Unshipped | confirmed |
| Shipped | shipped |
| Delivered | delivered |
| Cancelled | cancelled |
| Refunded | refunded |

---

## Cartlow

### Export from Merchant Portal

1. Log in to [Cartlow Merchant Portal](https://merchant.cartlow.com/)
2. Go to **Orders** → **Export**
3. Select date range
4. Choose format: **CSV**
5. Click **Download**

### Required Columns

| Column | Description | Maps To |
|--------|-------------|---------|
| Order ID | Order number | marketplace_order_id |
| Order Date | Date placed | order_date |
| Status | Order status | status |
| Customer Name | Buyer name | customer_name |
| Customer Phone | Phone number | customer_phone |
| City | Shipping city | shipping_city |
| Country | Country | shipping_country |
| Subtotal | Order subtotal | subtotal |
| Shipping Fee | Shipping cost | shipping_cost |
| Total | Order total | total |
| Currency | Currency | currency |
| Fulfillment Type | FBS/FBC | fulfillment |
| Payment Method | Payment type | payment_method |
| Tracking Number | Shipment tracking | tracking_number |
| Carrier | Shipping carrier | carrier |

### Status Mapping

| Cartlow Status | SoukHub Status |
|----------------|----------------|
| New | pending |
| Confirmed | confirmed |
| Processing | processing |
| Ready for Pickup | ready_to_ship |
| Shipped | shipped |
| Delivered | delivered |
| Cancelled | cancelled |
| Returned | returned |

---

## Revibe

### Export from Seller Dashboard

1. Log in to [Revibe Seller Dashboard](https://seller.revibe.me/)
2. Go to **Orders**
3. Click **Export** button
4. Select date range
5. Download CSV

### Required Columns

| Column | Description | Maps To |
|--------|-------------|---------|
| Order Number | Order ID | marketplace_order_id |
| Created At | Order date | order_date |
| Status | Order status | status |
| Customer | Customer name | customer_name |
| Email | Customer email | customer_email |
| Phone | Customer phone | customer_phone |
| City | Shipping city | shipping_city |
| Country | Country | shipping_country |
| Subtotal | Order subtotal | subtotal |
| Shipping | Shipping cost | shipping_cost |
| Tax | Tax amount | tax |
| Discount | Discount | discount |
| Total | Order total | total |
| Currency | Currency | currency |
| Payment | Payment method | payment_method |

### Status Mapping

| Revibe Status | SoukHub Status |
|---------------|----------------|
| Pending | pending |
| Confirmed | confirmed |
| Preparing | processing |
| Ready | ready_to_ship |
| Shipped | shipped |
| Out for Delivery | out_for_delivery |
| Delivered | delivered |
| Cancelled | cancelled |
| Returned | returned |
| Refunded | refunded |

---

## Import Process

### Step 1: Navigate to Import

1. Log in to SoukHub
2. Click **Import Data** in the sidebar
3. Or go directly to `/import`

### Step 2: Select Marketplace

Choose the marketplace that matches your export file:
- Amazon UAE
- Cartlow
- Revibe

### Step 3: Upload File

1. Click the upload area or drag and drop your file
2. Supported formats: CSV, TSV
3. Maximum file size: 10MB

### Step 4: Review Import

The system will show:
- Number of orders detected
- Preview of first few orders
- Any validation errors

### Step 5: Confirm Import

1. Review the summary
2. Click **Import Orders**
3. Wait for completion

### Step 6: Verify

1. Go to **Orders** page
2. Filter by the imported marketplace
3. Verify order counts and data

---

## Troubleshooting

### "Invalid file format"

- Ensure you're uploading CSV or TSV
- Check the file isn't corrupted
- Try re-exporting from the marketplace

### "Missing required columns"

- Verify your export includes all required fields
- Check column names match expected format
- Some marketplaces have different export options

### "Duplicate orders detected"

- Orders with same marketplace_order_id are skipped
- This prevents accidental duplicate imports
- Already imported orders won't be updated

### "Date parsing error"

- Dates should be in ISO format or common formats
- Examples: 2024-12-27, 12/27/2024, Dec 27, 2024

### "Currency mismatch"

- Default currency is AED
- USD, SAR, and other currencies are supported
- Currency is stored per-order

---

## Best Practices

1. **Regular Imports**
   - Import weekly or daily for accurate data
   - Set a reminder to keep data fresh

2. **Date Ranges**
   - Don't overlap date ranges
   - Or duplicates will be automatically skipped

3. **Data Verification**
   - Spot-check imported orders
   - Verify totals match marketplace

4. **Large Files**
   - Split very large exports (10k+ orders)
   - Import in batches if needed

5. **Backup**
   - Keep original export files
   - Useful for troubleshooting

---

## API Import (Advanced)

For automated imports, you can use the Supabase API directly:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, serviceKey);

// Insert orders
const { data, error } = await supabase
  .from('orders')
  .insert([
    {
      user_id: 'user-uuid',
      marketplace: 'amazon',
      marketplace_order_id: '123-456-789',
      status: 'pending',
      // ... other fields
    }
  ]);
```

See [API Documentation](./API.md) for more details.
