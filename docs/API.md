# API Documentation

This document describes the API endpoints available in SoukHub.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://soukhub.vercel.app/api`

## Authentication

All API endpoints require authentication via Supabase session cookies. The session is automatically included when making requests from the browser after login.

For server-to-server requests, use the Supabase service role key.

---

## Chat API

### POST /api/chat

Send a message to the AI assistant and receive a response with optional action buttons.

**Request Headers:**
```
Content-Type: application/json
Cookie: sb-access-token=...  (automatic from browser)
```

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Show me pending orders"
    }
  ],
  "userId": "uuid-of-user"
}
```

**Response:**
```json
{
  "response": "I found 5 pending orders that need attention:\n\n1. **Order #123-456** - Amazon - AED 299\n2. **Order #789-012** - Cartlow - AED 150\n...",
  "actions": [
    {
      "id": "bulk-ship-1703721600000",
      "label": "Mark 5 as Shipped",
      "type": "bulk_update",
      "data": {
        "orderIds": ["uuid1", "uuid2", "uuid3"],
        "updates": { "status": "shipped" }
      }
    }
  ],
  "usage": {
    "input_tokens": 150,
    "output_tokens": 200
  }
}
```

**Action Types:**

| Type | Description | Data Structure |
|------|-------------|----------------|
| `update_order` | Update single order | `{ orderId, updates }` |
| `bulk_update` | Update multiple orders | `{ orderIds[], updates }` |
| `navigate` | Navigate to URL | `{ url }` |

**Available AI Tools:**

| Tool | Description |
|------|-------------|
| `get_order_stats` | Get order statistics and metrics |
| `search_orders` | Search orders by status, marketplace, or text |
| `update_order_status` | Update an order's status |
| `get_order_details` | Get detailed info about an order |
| `get_suggestions` | Get AI-powered business suggestions |

**Example Queries:**

```
"Show me pending orders"
"What's my revenue this month?"
"Mark order #123 as delivered"
"Show me returned orders from Amazon"
"What should I focus on today?"
```

---

## Orders API

### GET /api/orders/[id]

Get details of a specific order.

**Request:**
```
GET /api/orders/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid",
    "marketplace": "amazon",
    "marketplace_order_id": "123-4567890-1234567",
    "status": "pending",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+971501234567",
    "shipping_city": "Dubai",
    "shipping_country": "AE",
    "subtotal": 250.00,
    "shipping_cost": 15.00,
    "tax": 12.50,
    "discount": 0,
    "total": 277.50,
    "currency": "AED",
    "order_date": "2024-12-27T10:30:00Z",
    "tracking_number": null,
    "carrier": null,
    "notes": null,
    "created_at": "2024-12-27T10:30:00Z",
    "updated_at": "2024-12-27T10:30:00Z"
  }
}
```

**Error Response:**
```json
{
  "error": "Order not found"
}
```

### PATCH /api/orders/[id]

Update an order's status, tracking information, or notes.

**Request:**
```
PATCH /api/orders/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "status": "shipped",
  "tracking_number": "1234567890",
  "carrier": "Aramex",
  "notes": "Shipped via express delivery"
}
```

**Allowed Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Order status |
| `tracking_number` | string | Shipment tracking number |
| `carrier` | string | Shipping carrier name |
| `notes` | string | Internal notes |
| `ship_date` | string | Date order was shipped |
| `delivery_date` | string | Date order was delivered |

**Valid Status Values:**
```
pending
confirmed
processing
ready_to_ship
shipped
out_for_delivery
delivered
cancelled
returned
refunded
```

**Response:**
```json
{
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "shipped",
    "tracking_number": "1234567890",
    "carrier": "Aramex",
    ...
  }
}
```

**Error Responses:**

```json
// 401 - Unauthorized
{ "error": "Unauthorized" }

// 400 - No valid fields
{ "error": "No valid fields to update" }

// 400 - Database error
{ "error": "Invalid status value" }
```

---

## Error Handling

All API endpoints return consistent error responses:

**Error Response Format:**
```json
{
  "error": "Error message here"
}
```

**HTTP Status Codes:**

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not logged in |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Something went wrong |

---

## Rate Limiting

- **Chat API**: 60 requests per minute per user
- **Orders API**: 120 requests per minute per user

Exceeding limits returns:
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

---

## Webhooks (Future)

Planned webhook events:
- `order.created`
- `order.updated`
- `order.shipped`
- `order.delivered`

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Fetch order details
const response = await fetch('/api/orders/order-id');
const { order } = await response.json();

// Update order status
const updateResponse = await fetch('/api/orders/order-id', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'shipped' }),
});

// Send chat message
const chatResponse = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Show pending orders' }],
    userId: 'user-id',
  }),
});
```

### cURL

```bash
# Get order
curl -X GET https://soukhub.vercel.app/api/orders/order-id \
  -H "Cookie: sb-access-token=..."

# Update order
curl -X PATCH https://soukhub.vercel.app/api/orders/order-id \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"status": "shipped"}'

# Chat
curl -X POST https://soukhub.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"messages": [{"role": "user", "content": "Show orders"}], "userId": "..."}'
```
