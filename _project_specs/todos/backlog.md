# Backlog

Future work, prioritized. Move to active.md when starting.

---

## Phase 1: Foundation & Data Layer

### TODO-001: Set up Next.js project with TypeScript and Tailwind
**Priority**: P0 (Critical)
**Estimate**: Foundation setup

**Description**:
Initialize Next.js 14+ with App Router, TypeScript strict mode, Tailwind CSS, and essential dev tooling.

**Acceptance Criteria**:
- [ ] Next.js 14+ with App Router configured
- [ ] TypeScript in strict mode
- [ ] Tailwind CSS with design tokens
- [ ] ESLint + Prettier configured
- [ ] Vitest for testing
- [ ] Path aliases working (@/*)

**Test Cases**:
```typescript
// TC-001-1: App renders without errors
test('home page renders', async () => {
  render(<Home />);
  expect(screen.getByRole('main')).toBeInTheDocument();
});

// TC-001-2: TypeScript strict mode catches type errors
// Verify tsconfig.json has "strict": true

// TC-001-3: Tailwind classes apply correctly
test('tailwind classes work', () => {
  render(<div className="bg-blue-500" data-testid="styled" />);
  expect(screen.getByTestId('styled')).toHaveClass('bg-blue-500');
});
```

---

### TODO-002: Set up Supabase with authentication
**Priority**: P0 (Critical)
**Depends On**: TODO-001

**Description**:
Configure Supabase project with PostgreSQL database, authentication (email/password + OAuth), and Row Level Security.

**Acceptance Criteria**:
- [ ] Supabase project linked
- [ ] Auth with email/password working
- [ ] Google OAuth configured
- [ ] RLS policies for user data isolation
- [ ] Type generation from database schema
- [ ] Environment variables properly configured

**Test Cases**:
```typescript
// TC-002-1: User can sign up
test('user signup creates account', async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'securepassword123'
  });
  expect(error).toBeNull();
  expect(data.user).toBeDefined();
});

// TC-002-2: RLS prevents cross-user data access
test('user cannot access other user data', async () => {
  // Sign in as user A, try to read user B's data
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', 'other-user-id');
  expect(data).toHaveLength(0);
});

// TC-002-3: Types are generated correctly
// Verify types/supabase.ts exists and contains Database type
```

---

### TODO-003: Design and implement database schema
**Priority**: P0 (Critical)
**Depends On**: TODO-002

**Description**:
Create PostgreSQL schema to store marketplace connections, products, orders, and inventory data. Schema must support multi-marketplace data with normalized product catalog.

**Acceptance Criteria**:
- [ ] `marketplace_connections` table (credentials, API config per marketplace)
- [ ] `products` table (unified product catalog with marketplace-specific fields)
- [ ] `product_variants` table (SKU-level data: color, storage, condition)
- [ ] `orders` table (normalized order data from all marketplaces)
- [ ] `order_items` table (line items with product references)
- [ ] `inventory` table (stock levels per SKU per marketplace)
- [ ] Proper indexes for query performance
- [ ] Migrations created and tested

**Test Cases**:
```sql
-- TC-003-1: Products can be created with marketplace reference
INSERT INTO products (name, category, brand, user_id)
VALUES ('iPhone 15 Pro Max', 'iPhone', 'Apple', 'user-123');
-- Expect: Row inserted successfully

-- TC-003-2: Orders link to products correctly
INSERT INTO order_items (order_id, product_variant_id, quantity, price)
VALUES ('order-1', 'variant-1', 1, 2499.00);
-- Expect: Foreign key constraint satisfied

-- TC-003-3: Inventory updates atomically
UPDATE inventory SET quantity = quantity - 1
WHERE sku = 'IPHONE15PM-256-BLK' AND quantity > 0;
-- Expect: Row updated or no rows affected (not negative)
```

**Schema Design**:
```sql
-- Core tables
CREATE TABLE marketplace_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  marketplace TEXT NOT NULL, -- 'amazon', 'cartlow', 'revibe'
  credentials JSONB, -- encrypted API keys/tokens
  settings JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  description TEXT,
  base_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products NOT NULL,
  sku TEXT NOT NULL,
  color TEXT,
  storage TEXT,
  condition TEXT, -- 'new', 'excellent', 'very_good', 'good'
  price DECIMAL(10,2),
  cost DECIMAL(10,2),
  marketplace_skus JSONB, -- {"amazon": "1BIF-XXX", "cartlow": "123", "revibe": "456"}
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  marketplace TEXT NOT NULL,
  marketplace_order_id TEXT NOT NULL,
  status TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address JSONB,
  subtotal DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  tax DECIMAL(10,2),
  discount DECIMAL(10,2),
  total DECIMAL(10,2),
  currency TEXT DEFAULT 'AED',
  order_date TIMESTAMPTZ,
  ship_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, marketplace, marketplace_order_id)
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders NOT NULL,
  product_variant_id UUID REFERENCES product_variants,
  marketplace_sku TEXT,
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2)
);

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id UUID REFERENCES product_variants NOT NULL,
  marketplace TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  warehouse TEXT,
  last_synced_at TIMESTAMPTZ,
  UNIQUE(product_variant_id, marketplace, warehouse)
);
```

---

### TODO-004: Implement marketplace data parsers
**Priority**: P0 (Critical)
**Depends On**: TODO-003

**Description**:
Create parsers for each marketplace data format (Amazon TSV, Cartlow CSV, Revibe CSV) that normalize data into our unified schema.

**Acceptance Criteria**:
- [ ] Amazon TSV parser with field mapping
- [ ] Cartlow CSV parser with field mapping
- [ ] Revibe CSV parser with field mapping
- [ ] Common interface for all parsers
- [ ] Validation and error handling
- [ ] Date format normalization
- [ ] Status mapping to unified statuses

**Test Cases**:
```typescript
// TC-004-1: Amazon parser extracts orders correctly
test('parseAmazonOrder extracts all fields', () => {
  const row = 'order-id\titem-id\t2025-07-07T15:04:13+00:00\t...'
  const order = parseAmazonOrder(row);
  expect(order.marketplaceOrderId).toBe('order-id');
  expect(order.orderDate).toBeInstanceOf(Date);
  expect(order.status).toBe('delivered'); // normalized from "Delivered to Buyer"
});

// TC-004-2: Cartlow parser handles multi-line products
test('parseCartlowOrder handles multi-product field', () => {
  const row = { Products: '[1 x iPhone 15]\n[1 x AirPods]', ... };
  const order = parseCartlowOrder(row);
  expect(order.items).toHaveLength(2);
});

// TC-004-3: Revibe parser extracts condition correctly
test('parseRevibeOrder extracts condition', () => {
  const row = { 'Variation: Color, Storage, Condition': 'Black / 256 GB / Excellent' };
  const order = parseRevibeOrder(row);
  expect(order.items[0].condition).toBe('excellent');
});

// TC-004-4: Status normalization works across marketplaces
test('normalizeStatus maps correctly', () => {
  expect(normalizeStatus('Delivered to Buyer', 'amazon')).toBe('delivered');
  expect(normalizeStatus('RTO-RTN', 'cartlow')).toBe('returned');
  expect(normalizeStatus('Order created', 'revibe')).toBe('pending');
});
```

**Field Mappings**:
```typescript
// Amazon -> Unified
const amazonMapping = {
  'order-id': 'marketplaceOrderId',
  'purchase-date': 'orderDate',
  'item-price': 'subtotal',
  'shipment-status': 'status',
  'buyer-name': 'customerName',
  'buyer-email': 'customerEmail',
  'sku': 'marketplaceSku',
  'product-name': 'productName',
};

// Cartlow -> Unified
const cartlowMapping = {
  'id': 'marketplaceOrderId',
  'OrderDate': 'orderDate',
  'Cost': 'subtotal',
  'Status': 'status',
  'Products': 'productName',
  'SKU': 'marketplaceSku',
};

// Revibe -> Unified
const revibeMapping = {
  'id': 'marketplaceOrderId',
  'Date': 'orderDate',
  'Actual Cost': 'subtotal',
  'Shipment Status': 'status',
  'Model': 'productName',
  'Name': 'customerName',
  'Email': 'customerEmail',
};
```

---

### TODO-005: Build file upload and import flow
**Priority**: P1 (High)
**Depends On**: TODO-004

**Description**:
Create UI and API for uploading marketplace data files (CSV/TSV), parsing them, and importing into the database.

**Acceptance Criteria**:
- [ ] Drag-and-drop file upload UI
- [ ] File type detection (CSV vs TSV)
- [ ] Marketplace auto-detection from headers
- [ ] Preview of parsed data before import
- [ ] Progress indicator for large files
- [ ] Error display for failed rows
- [ ] Import summary (success/failed counts)

**Test Cases**:
```typescript
// TC-005-1: File upload accepts CSV and TSV
test('upload accepts csv and tsv', async () => {
  const csvFile = new File(['col1,col2'], 'data.csv', { type: 'text/csv' });
  const tsvFile = new File(['col1\tcol2'], 'data.tsv', { type: 'text/tab-separated-values' });

  expect(isValidFileType(csvFile)).toBe(true);
  expect(isValidFileType(tsvFile)).toBe(true);
});

// TC-005-2: Marketplace detection from headers
test('detectMarketplace identifies source', () => {
  const amazonHeaders = ['order-id', 'order-item-id', 'purchase-date'];
  const cartlowHeaders = ['id', 'Products', 'SKU', 'Cost'];
  const revibeHeaders = ['Shipment Status New', 'id', 'Model'];

  expect(detectMarketplace(amazonHeaders)).toBe('amazon');
  expect(detectMarketplace(cartlowHeaders)).toBe('cartlow');
  expect(detectMarketplace(revibeHeaders)).toBe('revibe');
});

// TC-005-3: Import creates database records
test('importOrders creates records', async () => {
  const orders = [{ marketplaceOrderId: '123', ... }];
  const result = await importOrders(orders, 'amazon');

  expect(result.success).toBe(1);
  expect(result.failed).toBe(0);

  const dbOrder = await supabase
    .from('orders')
    .select('*')
    .eq('marketplace_order_id', '123')
    .single();
  expect(dbOrder.data).toBeDefined();
});
```

---

## Phase 2: Core Features

### TODO-006: Build unified orders dashboard
**Priority**: P1 (High)
**Depends On**: TODO-005

**Description**:
Create a dashboard showing orders from all marketplaces with filtering, sorting, and search capabilities.

**Acceptance Criteria**:
- [ ] Table view with all orders
- [ ] Filter by marketplace, status, date range
- [ ] Search by order ID, customer name, product
- [ ] Sort by date, amount, status
- [ ] Pagination (20 orders per page)
- [ ] Status badges with color coding
- [ ] Click to view order details

**Test Cases**:
```typescript
// TC-006-1: Orders display with correct data
test('orders table shows all fields', async () => {
  render(<OrdersTable orders={mockOrders} />);

  expect(screen.getByText('405-8691434-5054708')).toBeInTheDocument();
  expect(screen.getByText('Amazon')).toBeInTheDocument();
  expect(screen.getByText('Delivered')).toBeInTheDocument();
});

// TC-006-2: Filters reduce displayed orders
test('marketplace filter works', async () => {
  render(<OrdersPage />);

  await userEvent.click(screen.getByRole('combobox', { name: /marketplace/i }));
  await userEvent.click(screen.getByText('Amazon'));

  expect(screen.queryByText('Cartlow')).not.toBeInTheDocument();
});

// TC-006-3: Search finds matching orders
test('search finds by customer name', async () => {
  render(<OrdersPage />);

  await userEvent.type(screen.getByRole('searchbox'), 'Mohammed');

  expect(screen.getAllByRole('row').length).toBeLessThan(mockOrders.length);
});
```

---

### TODO-007: Build product catalog with SKU mapping
**Priority**: P1 (High)
**Depends On**: TODO-005

**Description**:
Create a unified product catalog that maps SKUs across marketplaces to a single product entity.

**Acceptance Criteria**:
- [ ] Product list view with variants
- [ ] SKU mapping interface (link marketplace SKUs to product)
- [ ] Auto-suggest SKU matches based on product name
- [ ] Product detail page with all variants
- [ ] Cost and pricing by variant
- [ ] Condition tracking (New, Excellent, Good)

**Test Cases**:
```typescript
// TC-007-1: Product displays all variants
test('product shows variants', async () => {
  render(<ProductDetail productId="123" />);

  expect(screen.getByText('iPhone 15 Pro Max')).toBeInTheDocument();
  expect(screen.getByText('256 GB / Black / Excellent')).toBeInTheDocument();
  expect(screen.getByText('512 GB / White / Good')).toBeInTheDocument();
});

// TC-007-2: SKU mapping links marketplace SKUs
test('sku mapping creates link', async () => {
  render(<SkuMapper productVariantId="variant-1" />);

  await userEvent.type(screen.getByLabelText('Amazon SKU'), '1BIF-DCML-VT3W');
  await userEvent.click(screen.getByRole('button', { name: /save/i }));

  expect(screen.getByText('SKU mapped successfully')).toBeInTheDocument();
});

// TC-007-3: Auto-suggest finds similar products
test('auto-suggest matches by name', () => {
  const suggestions = suggestSkuMatches('iPhone 15 Pro', existingProducts);

  expect(suggestions).toContainEqual(
    expect.objectContaining({ name: 'iPhone 15 Pro Max' })
  );
});
```

---

### TODO-008: Build inventory management view
**Priority**: P1 (High)
**Depends On**: TODO-007

**Description**:
Create inventory view showing stock levels across all marketplaces with low-stock alerts.

**Acceptance Criteria**:
- [ ] Inventory grid by product/marketplace
- [ ] Total stock across all channels
- [ ] Low stock alerts (configurable threshold)
- [ ] Stock adjustment interface
- [ ] Audit log of inventory changes
- [ ] Export inventory report

**Test Cases**:
```typescript
// TC-008-1: Inventory grid shows all marketplaces
test('inventory shows cross-marketplace view', async () => {
  render(<InventoryGrid />);

  const row = screen.getByTestId('inventory-row-iphone15pm');
  expect(within(row).getByText('5')).toBeInTheDocument(); // Amazon stock
  expect(within(row).getByText('3')).toBeInTheDocument(); // Cartlow stock
  expect(within(row).getByText('8')).toBeInTheDocument(); // Total
});

// TC-008-2: Low stock alert appears
test('low stock shows warning', async () => {
  render(<InventoryGrid lowStockThreshold={3} />);

  const lowStockItem = screen.getByTestId('inventory-row-airpods');
  expect(within(lowStockItem).getByRole('alert')).toBeInTheDocument();
});

// TC-008-3: Stock adjustment updates database
test('adjust stock updates quantity', async () => {
  render(<StockAdjustment variantId="v1" marketplace="amazon" />);

  await userEvent.type(screen.getByLabelText('Quantity'), '-2');
  await userEvent.click(screen.getByRole('button', { name: /adjust/i }));

  const updated = await getInventory('v1', 'amazon');
  expect(updated.quantity).toBe(3); // Was 5, now 3
});
```

---

### TODO-009: Build analytics dashboard
**Priority**: P2 (Medium)
**Depends On**: TODO-006

**Description**:
Create analytics dashboard with sales, orders, and performance metrics across marketplaces.

**Acceptance Criteria**:
- [ ] Total sales by marketplace (chart)
- [ ] Orders over time (line chart)
- [ ] Top selling products
- [ ] Return rate by marketplace
- [ ] Average order value
- [ ] Revenue by product category
- [ ] Date range selector

**Test Cases**:
```typescript
// TC-009-1: Sales chart renders with data
test('sales chart displays marketplace breakdown', async () => {
  render(<SalesChart data={mockSalesData} />);

  expect(screen.getByText('Amazon')).toBeInTheDocument();
  expect(screen.getByText('AED 125,000')).toBeInTheDocument();
});

// TC-009-2: Date range updates data
test('date range filter updates metrics', async () => {
  render(<AnalyticsDashboard />);

  await userEvent.click(screen.getByRole('button', { name: /last 30 days/i }));
  await userEvent.click(screen.getByText('Last 7 days'));

  // Metrics should update
  await waitFor(() => {
    expect(screen.getByTestId('total-orders')).toHaveTextContent('45');
  });
});

// TC-009-3: Top products list is accurate
test('top products shows correct ranking', () => {
  const top = calculateTopProducts(mockOrders, 5);

  expect(top[0].name).toBe('iPhone 15 Pro Max');
  expect(top[0].totalSales).toBeGreaterThan(top[1].totalSales);
});
```

---

## Phase 3: AI Agent Features

### TODO-010: Set up Claude AI integration
**Priority**: P1 (High)
**Depends On**: TODO-002

**Description**:
Configure Anthropic Claude API for AI agent capabilities with proper error handling and rate limiting.

**Acceptance Criteria**:
- [ ] Claude API client configured
- [ ] Streaming responses for chat
- [ ] Rate limiting implementation
- [ ] Error handling with retries
- [ ] Token usage tracking
- [ ] System prompt management

**Test Cases**:
```typescript
// TC-010-1: Claude API responds to queries
test('claude generates response', async () => {
  const response = await callClaude({
    messages: [{ role: 'user', content: 'Hello' }],
  });

  expect(response.content).toBeDefined();
  expect(response.content.length).toBeGreaterThan(0);
});

// TC-010-2: Streaming works correctly
test('streaming returns chunks', async () => {
  const chunks: string[] = [];

  await streamClaude({
    messages: [{ role: 'user', content: 'Count to 5' }],
    onChunk: (chunk) => chunks.push(chunk),
  });

  expect(chunks.length).toBeGreaterThan(1);
  expect(chunks.join('')).toContain('5');
});

// TC-010-3: Rate limiting prevents overuse
test('rate limiter blocks excessive requests', async () => {
  // Make 10 rapid requests
  const requests = Array(10).fill(null).map(() => callClaude({ ... }));

  const results = await Promise.allSettled(requests);
  const rejected = results.filter(r => r.status === 'rejected');

  expect(rejected.length).toBeGreaterThan(0);
});
```

---

### TODO-011: Build AI agent with tool definitions
**Priority**: P1 (High)
**Depends On**: TODO-010, TODO-006, TODO-007, TODO-008

**Description**:
Create AI agent that can query orders, products, and inventory using tool-based function calling.

**Acceptance Criteria**:
- [ ] Tool definitions for order queries
- [ ] Tool definitions for product lookups
- [ ] Tool definitions for inventory checks
- [ ] Tool definitions for analytics queries
- [ ] Tool execution engine
- [ ] Context management for multi-turn conversations

**Tool Definitions**:
```typescript
const agentTools = [
  {
    name: 'search_orders',
    description: 'Search orders across all marketplaces',
    parameters: {
      marketplace: { type: 'string', enum: ['amazon', 'cartlow', 'revibe', 'all'] },
      status: { type: 'string' },
      dateFrom: { type: 'string', format: 'date' },
      dateTo: { type: 'string', format: 'date' },
      query: { type: 'string' },
    },
  },
  {
    name: 'get_product_info',
    description: 'Get product details including variants and inventory',
    parameters: {
      productId: { type: 'string' },
      sku: { type: 'string' },
    },
  },
  {
    name: 'check_inventory',
    description: 'Check inventory levels for a product',
    parameters: {
      sku: { type: 'string' },
      marketplace: { type: 'string' },
    },
  },
  {
    name: 'get_analytics',
    description: 'Get sales and performance analytics',
    parameters: {
      metric: { type: 'string', enum: ['sales', 'orders', 'returns', 'top_products'] },
      period: { type: 'string', enum: ['today', 'week', 'month', 'quarter'] },
      marketplace: { type: 'string' },
    },
  },
];
```

**Test Cases**:
```typescript
// TC-011-1: Agent uses correct tool for query
test('agent selects search_orders for order query', async () => {
  const response = await runAgent('Show me all orders from Amazon last week');

  expect(response.toolCalls).toContainEqual(
    expect.objectContaining({ name: 'search_orders' })
  );
});

// TC-011-2: Agent chains tools for complex queries
test('agent chains tools for inventory check', async () => {
  const response = await runAgent('How many iPhone 15 Pro Max do I have across all channels?');

  expect(response.toolCalls.length).toBeGreaterThanOrEqual(1);
  expect(response.toolCalls[0].name).toBe('check_inventory');
});

// TC-011-3: Agent provides natural language summary
test('agent summarizes results naturally', async () => {
  const response = await runAgent('What were my total sales this month?');

  expect(response.message).toMatch(/AED \d+/);
  expect(response.message).not.toContain('get_analytics'); // No raw tool names
});
```

---

### TODO-012: Build AI chat interface
**Priority**: P1 (High)
**Depends On**: TODO-011

**Description**:
Create chat UI for interacting with the AI agent with message history and real-time responses.

**Acceptance Criteria**:
- [ ] Chat input with send button
- [ ] Message history display
- [ ] Streaming response display
- [ ] Loading indicators
- [ ] Tool execution visualization
- [ ] Error handling with retry
- [ ] Suggested queries

**Test Cases**:
```typescript
// TC-012-1: Chat sends message and shows response
test('chat flow works end-to-end', async () => {
  render(<ChatInterface />);

  await userEvent.type(screen.getByRole('textbox'), 'Show my orders');
  await userEvent.click(screen.getByRole('button', { name: /send/i }));

  await waitFor(() => {
    expect(screen.getByText(/orders/i)).toBeInTheDocument();
  });
});

// TC-012-2: Loading state displays during response
test('loading indicator shows', async () => {
  render(<ChatInterface />);

  await userEvent.type(screen.getByRole('textbox'), 'Hello');
  await userEvent.click(screen.getByRole('button', { name: /send/i }));

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});

// TC-012-3: Message history persists
test('messages persist in history', async () => {
  render(<ChatInterface />);

  await userEvent.type(screen.getByRole('textbox'), 'Query 1');
  await userEvent.click(screen.getByRole('button', { name: /send/i }));
  await waitFor(() => screen.getByText(/response/i));

  await userEvent.type(screen.getByRole('textbox'), 'Query 2');
  await userEvent.click(screen.getByRole('button', { name: /send/i }));

  expect(screen.getByText('Query 1')).toBeInTheDocument();
  expect(screen.getByText('Query 2')).toBeInTheDocument();
});
```

---

## Phase 4: Marketplace API Integration (Future)

### TODO-013: Amazon SP-API integration
**Priority**: P3 (Future)
**Depends On**: TODO-005

**Description**:
Integrate with Amazon Selling Partner API for real-time order sync and inventory updates.

**Acceptance Criteria**:
- [ ] OAuth flow for SP-API authorization
- [ ] Orders API integration (pull orders)
- [ ] Inventory API integration (push updates)
- [ ] Notifications for new orders
- [ ] Rate limit handling
- [ ] Refresh token management

---

### TODO-014: Real-time inventory sync
**Priority**: P3 (Future)
**Depends On**: TODO-013

**Description**:
Implement real-time inventory synchronization across all connected marketplaces.

**Acceptance Criteria**:
- [ ] Inventory change triggers sync to all channels
- [ ] Conflict resolution for simultaneous updates
- [ ] Sync status dashboard
- [ ] Manual sync trigger
- [ ] Sync history/audit log

---

### TODO-015: Automated listing creation
**Priority**: P3 (Future)
**Depends On**: TODO-013

**Description**:
Use AI to generate and publish product listings across marketplaces.

**Acceptance Criteria**:
- [ ] AI-generated product descriptions
- [ ] Multi-marketplace listing format
- [ ] Image optimization
- [ ] Pricing suggestions
- [ ] One-click publish to all channels

---

## Technical Debt & Improvements

### TODO-016: Add comprehensive error boundary
**Priority**: P2 (Medium)
**Depends On**: TODO-001

**Description**:
Implement React error boundaries and global error handling for graceful degradation.

---

### TODO-017: Add E2E tests with Playwright
**Priority**: P2 (Medium)
**Depends On**: TODO-006

**Description**:
Set up Playwright for end-to-end testing of critical user flows.

---

### TODO-018: Performance optimization
**Priority**: P2 (Medium)
**Depends On**: TODO-009

**Description**:
Optimize database queries, add caching, and improve page load times.

---
