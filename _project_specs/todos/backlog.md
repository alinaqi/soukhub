# Backlog

Future work, prioritized. Move to active.md when starting.

---

# Marketplace Pivot — Milestones M2–M6

Promote to active.md milestone by milestone. Full context: _project_specs/marketplace-pivot/evaluation.md.

---

## M2 — Transact

### TODO-048: Cart + guest checkout
**P0** · Guest-first checkout (name, phone, emirate/address, payment choice). Cart in localStorage + server draft order. Arabic parity. Tests: full checkout e2e, validation, guest→account claim flow.

### TODO-049: Payments v1 — COD + Stripe cards/Apple Pay
**P0** · Stripe PaymentIntents (AED) + COD option. `payment_intents` table + webhook (signed) → order confirmation. NEVER store card data. Tests: webhook signature, idempotent confirmation, COD path, refund entry.

### TODO-050: Marketplace orders → seller ops engine
**P0** · Buyer order creates the same `orders` rows sellers already manage (source='soukhub'); notification to seller (in-app + WhatsApp); statuses buyer-visible. Tests: order lands in seller console, status propagation both directions.

### TODO-051: Seller ledger + commission
**P0** · Immutable `ledger_entries` (sale, commission, refund, payout, cod_collected); balances view; per-store commission_bps. Payouts manual/batch UI for operator. Tests: ledger sums, refund reversal, COD accounting.

### TODO-052: Buyer order tracking page + notifications
**P1** · `/{locale}/track/{orderRef}` (guest-accessible via signed token), status timeline, WhatsApp/email updates. Tests: token security, status rendering.

## M3 — Trust & AI depth

### TODO-053: Reviews & ratings
**P1** · Verified-purchase reviews (order-linked), seller aggregate rating, moderation queue. AggregateRating JSON-LD. Tests: only purchasers review, aggregate math, moderation gate.

### TODO-054: AI listing creation (photo → listing, EN+AR)
**P0 for seller UX** · Gemini Flash multimodal: photos → {title, brand, model, storage, condition grade, description} EN+AR structured output; seller edits then publishes. Cost-logged. Tests: schema validation, rejection fallback to manual, prompt-injection-in-image resistance (output constrained to schema).

### TODO-055: Semantic search + auto cross-linking
**P0 for discovery** · Embeddings per listing (stored, pgvector) at publish; hybrid: FTS candidates → vector rerank; related-products + "compare with" blocks (statically rendered internal links). Tests: NN sanity on seed data, hybrid beats FTS on paraphrase queries, links rendered server-side.

### TODO-056: Query intent understanding
**P1** · Cerebras small-model JSON extraction: free-text query → {brand, model, price_range, condition, warranty} filter merge. <300ms budget; fallback = plain FTS. Tests: extraction fixtures (en/ar/mixed), latency budget, fallback path.

### TODO-057: AI support system (Cerebras-first)
**P1** · Storefront support widget: Cerebras fast responses over RAG (platform policies + store policies + order context if authed); escalation → seller WhatsApp / operator inbox; conversation logging + resolution tracking. Claude fallback for hard cases. Tests: RAG grounding (no hallucinated policies — answers must cite retrieved chunk), escalation trigger, auth-context isolation.

### TODO-058: Verified seller program
**P2** · Optional trade-license upload → badge; moderation UI. Tests: badge gating, doc storage private.

## M4 — Scale surface (SEO/GEO/perf)

### TODO-059: Category / brand / emirate hub pages
**P1** · Auto-generated `/c/{category}`, `/b/{brand}`, `/{emirate}/{category}` ISR pages with real content (counts, price ranges, top listings). Internal-link graph. Tests: only non-empty hubs indexed, canonical rules.

### TODO-060: Sitemaps, robots, llms.txt, OG images
**P1** · Segmented auto-regenerating sitemaps; llms.txt; per-product OG image generation. Tests: sitemap validity + freshness, OG image renders.

### TODO-061: Performance budgets in CI
**P1** · Lighthouse CI on PRs: product page LCP<1.5s/TBT/CLS budgets; bundle-size check (<150KB gz buyer routes); search p95 test. Failing budget fails CI.

## M5 — Payments+ / Delivery+

### TODO-062: Payout automation evaluation (Tap Marketplace vs Checkout.com) — spike + ADR
### TODO-063: BNPL (Tabby/Tamara) integration
**P2** · After volume.

### TODO-064: Courier adapter interface + Aramex + Quiqup
**P1** · `src/lib/delivery/` adapter pattern (quote, create shipment, label, webhook tracking); buyer timeline integration; courier-COD reconciliation. Tests: adapter contract suite runs against mock + sandbox.

## M6 — Languages

### TODO-065: Hindi, Urdu, Tagalog buyer surface
**P2** · Buyer-facing strings only; AI-assisted translation with human review file workflow.

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

**Acceptance Criteria**:
- [ ] ErrorBoundary component wrapping app
- [ ] Graceful fallback UI
- [ ] Error logging to monitoring service
- [ ] Recovery options for users

---

### TODO-017: Add E2E tests with Playwright
**Priority**: P2 (Medium)
**Depends On**: TODO-006

**Description**:
Set up Playwright for end-to-end testing of critical user flows.

**Acceptance Criteria**:
- [ ] Playwright configured with CI integration
- [ ] Login/logout flow tests
- [ ] Import flow tests
- [ ] Order management tests
- [ ] Chat interface tests

---

### TODO-018: Performance optimization
**Priority**: P2 (Medium)
**Depends On**: TODO-009

**Description**:
Optimize database queries, add caching, and improve page load times.

**Acceptance Criteria**:
- [ ] Dashboard loads under 2 seconds
- [ ] Database query optimization
- [ ] React Query caching strategy
- [ ] Slow query logging
- [ ] Lazy loading for heavy components

---

---

# Pre-pivot backlog (archived from active.md on 2026-08-24)

Most of Phases 5-8 below SHIPPED between Dec 2025 and the pivot (workflow config, suppliers, routing, WhatsApp, CRM, insights). Audit against the codebase before picking any of these up.


## Phase 5: Workflow & Supplier Management

### TODO-019: Workflow Configuration System

**Priority**: P0 (Critical)
**Estimated Complexity**: Large

**Description**:
Create a workflow configuration wizard that captures how each seller operates. The system must adapt to the seller's workflow, not the other way around. This is the foundation for all automation.

**User Story**:
As a seller, I want to configure how I source and fulfill products so the system works exactly like my business operates.

**Implementation Details**:

1. **Database Schema Changes**:
   ```sql
   -- Workflow configuration per user
   CREATE TABLE workflow_config (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES profiles(id),
     fulfillment_model TEXT CHECK (fulfillment_model IN ('self_fulfilled', 'supplier_fulfilled', 'hybrid')),
     packing_location TEXT,
     delivery_schedule JSONB, -- e.g., {"supplier_1": ["10:00", "16:00"], "supplier_2": ["14:00"]}
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Supplier management
   CREATE TABLE suppliers (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES profiles(id),
     name TEXT NOT NULL,
     whatsapp_number TEXT NOT NULL,
     email TEXT,
     delivery_times TEXT[], -- e.g., ['10:00 AM', '4:00 PM']
     notes TEXT,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Brand to supplier assignment rules
   CREATE TABLE supplier_brand_rules (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES profiles(id),
     supplier_id UUID REFERENCES suppliers(id),
     brand TEXT NOT NULL,
     category TEXT, -- optional: further narrow by category
     priority INTEGER DEFAULT 1, -- for fallback suppliers
     UNIQUE(user_id, brand, category, priority)
   );

   -- Extend products table
   ALTER TABLE products ADD COLUMN availability_type TEXT
     CHECK (availability_type IN ('in_stock', 'available_on_demand', 'discontinued'))
     DEFAULT 'available_on_demand';
   ALTER TABLE products ADD COLUMN preferred_supplier_id UUID REFERENCES suppliers(id);
   ```

2. **Onboarding Wizard Flow** (Mobile-first, max 5 taps per screen):
   - Screen 1: "How do you get your products?"
     - [ ] I keep stock myself
     - [ ] I order from suppliers when I get orders
     - [ ] Mix of both
   - Screen 2: "Add your suppliers" (if supplier-fulfilled)
     - Name + WhatsApp number (big input fields)
     - "Add another" button
   - Screen 3: "Which brands from which supplier?"
     - Visual brand logos → drag to supplier
     - Or simple dropdown per brand
   - Screen 4: "When do suppliers deliver?"
     - Simple time picker per supplier

3. **UI Components**:
   - `/src/app/(dashboard)/settings/workflow/page.tsx`
   - `/src/components/settings/WorkflowWizard.tsx`
   - `/src/components/settings/SupplierManager.tsx`
   - `/src/components/settings/BrandAssignment.tsx`

**Acceptance Criteria**:
- [ ] User can complete workflow setup in under 3 minutes
- [ ] Supplier CRUD with WhatsApp number validation (UAE format)
- [ ] Brand → Supplier rules can be created visually
- [ ] Products can be marked as "in stock" or "available on demand"
- [ ] Configuration persists and loads correctly
- [ ] Mobile-responsive with large touch targets
- [ ] Validation prevents incomplete setup

**Test Cases**:
- [ ] New user completes wizard → config saved correctly
- [ ] Edit existing supplier → changes persist
- [ ] Delete supplier with assigned brands → shows warning
- [ ] Brand with no supplier → flagged in UI
- [ ] WhatsApp number validation (UAE: +971 5x xxx xxxx)

---

### TODO-020: Supplier Management Dashboard

**Priority**: P0 (Critical)
**Depends On**: TODO-019

**Description**:
A dead-simple supplier management interface. Think "Contacts app" level simplicity. Large cards, big buttons, zero confusion.

**User Story**:
As a seller, I want to see all my suppliers at a glance and quickly contact them or see their assigned brands.

**Implementation Details**:

1. **Supplier Card Design**:
   ```
   ┌──────────────────────────────────────────┐
   │  👤 Ali Electronics                      │
   │  📱 +971 50 123 4567     [WhatsApp]     │
   │  ────────────────────────────────────── │
   │  📦 Apple, Samsung, Google              │
   │  🕐 Delivers: 10 AM, 4 PM               │
   │  ────────────────────────────────────── │
   │  Today: 5 orders pending                │
   │  [View Orders]  [Edit]  [Message]       │
   └──────────────────────────────────────────┘
   ```

2. **Files**:
   - `/src/app/(dashboard)/suppliers/page.tsx`
   - `/src/components/suppliers/SupplierCard.tsx`
   - `/src/components/suppliers/AddSupplierModal.tsx`
   - `/src/components/suppliers/EditSupplierModal.tsx`

3. **Features**:
   - One-tap WhatsApp call (deep link: `https://wa.me/971501234567`)
   - See pending orders per supplier
   - Quick edit name/number
   - Deactivate (not delete) supplier

**Acceptance Criteria**:
- [ ] Supplier list loads in <1 second
- [ ] One-tap to open WhatsApp chat with supplier
- [ ] Shows today's pending order count per supplier
- [ ] Add supplier takes max 3 fields (name, WhatsApp, brands)
- [ ] Edit inline without page navigation
- [ ] Works perfectly on mobile
- [ ] Empty state guides user to add first supplier

**Test Cases**:
- [ ] Add supplier → appears in list immediately
- [ ] Tap WhatsApp → opens correct chat
- [ ] Deactivate supplier → orders route to backup
- [ ] Supplier with no orders shows "No pending orders"

---

### TODO-021: Order Routing Engine

**Priority**: P0 (Critical)
**Depends On**: TODO-019, TODO-020

**Description**:
Automatically route incoming orders to the correct supplier based on brand rules. When an order comes in, the system should know exactly which supplier to contact.

**User Story**:
As a seller, when I receive an order, I want the system to automatically know which supplier should fulfill it.

**Implementation Details**:

1. **Database**:
   ```sql
   -- Track supplier orders
   CREATE TABLE supplier_orders (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES profiles(id),
     supplier_id UUID REFERENCES suppliers(id),
     order_id UUID REFERENCES orders(id),
     status TEXT CHECK (status IN (
       'pending_send',      -- Not yet sent to supplier
       'sent',              -- WhatsApp sent, awaiting reply
       'confirmed',         -- Supplier said yes
       'unavailable',       -- Supplier said no
       'alternative_offered', -- Supplier offered different item
       'delivered_to_seller', -- Supplier delivered to seller
       'packed',            -- Seller packed
       'shipped'            -- Handed to courier/fulfilled
     )) DEFAULT 'pending_send',
     sent_at TIMESTAMPTZ,
     supplier_response TEXT,
     alternative_product TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   ALTER TABLE orders ADD COLUMN supplier_order_id UUID REFERENCES supplier_orders(id);
   ALTER TABLE orders ADD COLUMN requires_supplier BOOLEAN DEFAULT true;
   ```

2. **Routing Logic** (`/src/lib/order-routing.ts`):
   ```typescript
   async function routeOrderToSupplier(order: Order): Promise<Supplier> {
     // 1. Check if product has preferred supplier
     // 2. Look up brand → supplier rules
     // 3. Check supplier is active
     // 4. If multiple matches, use priority
     // 5. Return supplier or throw if none found
   }
   ```

3. **Auto-routing on order import**:
   - When orders imported, auto-create supplier_orders
   - Show "Needs Supplier Assignment" for unroutable orders
   - Dashboard shows orders grouped by supplier

4. **UI**: Order list shows supplier assignment
   ```
   Order #12345 - iPhone 15 Pro
   └── 📦 Assigned to: Ali Electronics
       Status: ⏳ Pending confirmation
   ```

**Acceptance Criteria**:
- [ ] Orders auto-route to correct supplier on import
- [ ] Unroutable orders flagged prominently
- [ ] Manual override available for any order
- [ ] Routing rules respect priority for fallbacks
- [ ] Order detail shows full supplier journey

**Test Cases**:
- [ ] Apple order → routes to Apple supplier
- [ ] Unknown brand → flagged for manual assignment
- [ ] Supplier inactive → routes to backup
- [ ] Multiple orders same supplier → grouped correctly

---

## Phase 6: WhatsApp Automation

### TODO-022: WhatsApp Integration Setup

**Priority**: P1 (High)
**Depends On**: TODO-021

**Description**:
Set up WhatsApp Web automation using whatsapp-web.js. This runs as a separate service that connects to the seller's WhatsApp. One-time QR scan, then automated messaging.

**User Story**:
As a seller, I want to scan a QR code once and have the system automatically message my suppliers when orders come in.

**Implementation Details**:

1. **Architecture**:
   - Separate Node.js service (not in Next.js)
   - Communicates with main app via API/webhooks
   - Stores session to avoid re-scanning QR
   - Can be self-hosted or provided as service

2. **Project Structure** (`/whatsapp-service/`):
   ```
   /whatsapp-service
   ├── src/
   │   ├── client.ts         # WhatsApp client setup
   │   ├── message-handler.ts # Incoming message processing
   │   ├── message-sender.ts  # Outgoing message queue
   │   ├── api.ts            # HTTP API for main app
   │   └── ai-parser.ts      # Parse supplier replies
   ├── sessions/             # Stored auth sessions
   ├── package.json
   └── Dockerfile
   ```

3. **Connection Flow**:
   - User goes to Settings → WhatsApp
   - Shows QR code (from whatsapp-web.js)
   - User scans with phone
   - Connection established, status shows "Connected"
   - Session persisted for future use

4. **API Endpoints** (WhatsApp service):
   ```
   POST /send          - Send message to number
   GET  /status        - Connection status
   GET  /qr            - Get QR code for scanning
   POST /disconnect    - Disconnect session
   ```

5. **Database**:
   ```sql
   CREATE TABLE whatsapp_connections (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES profiles(id) UNIQUE,
     status TEXT CHECK (status IN ('disconnected', 'connecting', 'connected', 'error')),
     phone_number TEXT,
     last_connected_at TIMESTAMPTZ,
     session_data TEXT, -- Encrypted session
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

**Acceptance Criteria**:
- [ ] QR code displays in settings page
- [ ] Scanning QR connects successfully
- [ ] Connection persists across browser refresh
- [ ] Status shows clearly (connected/disconnected)
- [ ] Can disconnect and reconnect
- [ ] Works with UAE phone numbers

**Test Cases**:
- [ ] Fresh user → sees QR code
- [ ] Scan QR → status changes to connected
- [ ] Page refresh → still connected
- [ ] Disconnect → status updates, can rescan
- [ ] WhatsApp logged out on phone → auto-reconnect or alert

**Security Considerations**:
- Session data encrypted at rest
- WhatsApp service runs isolated
- Rate limiting on message sends
- User must explicitly enable automation

---

### TODO-023: Supplier Order Messaging

**Priority**: P1 (High)
**Depends On**: TODO-022

**Description**:
Automatically send order details to suppliers via WhatsApp. Messages should be clear, professional, and include all info supplier needs.

**User Story**:
As a seller, when an order comes in, I want the system to automatically WhatsApp my supplier with the order details.

**Implementation Details**:

1. **Message Templates** (stored in DB, user-editable):
   ```
   Default Template:
   ──────────────────
   🛒 *New Order*

   *Product:* {product_name}
   *Storage:* {storage}
   *Color:* {color}
   *Condition:* {condition}

   *Order ID:* {order_id}
   *Customer:* {customer_city}

   Please confirm availability:
   ✅ Reply "YES" if available
   ❌ Reply "NO" if not available
   🔄 Reply with alternative if different stock

   Need by: {delivery_cutoff_time}
   ──────────────────
   ```

2. **Batch Orders** (multiple orders to same supplier):
   ```
   🛒 *3 New Orders*

   1. iPhone 15 Pro 256GB Black
   2. iPhone 14 128GB White
   3. Samsung S24 Ultra 512GB

   Please confirm each:
   ✅ "1,2,3 YES" - all available
   ❌ "1 NO, 2,3 YES" - partial
   ```

3. **Database**:
   ```sql
   CREATE TABLE message_templates (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES profiles(id),
     name TEXT NOT NULL,
     template_type TEXT CHECK (template_type IN ('supplier_order', 'supplier_batch', 'customer_update')),
     content TEXT NOT NULL,
     is_default BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE whatsapp_messages (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES profiles(id),
     supplier_order_id UUID REFERENCES supplier_orders(id),
     direction TEXT CHECK (direction IN ('outgoing', 'incoming')),
     phone_number TEXT NOT NULL,
     message_content TEXT NOT NULL,
     status TEXT CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
     sent_at TIMESTAMPTZ,
     delivered_at TIMESTAMPTZ,
     read_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

4. **Sending Logic**:
   - On order import → create supplier_order → queue message
   - Batch orders going to same supplier (5-min window)
   - Retry failed messages with backoff
   - Mark orders as "sent" when WhatsApp confirms

5. **UI Elements**:
   - Settings page for template customization
   - Order detail shows message status
   - "Resend" button for failed messages

**Acceptance Criteria**:
- [ ] Orders auto-trigger WhatsApp to correct supplier
- [ ] Messages use template with order details filled
- [ ] Multiple orders batched into single message
- [ ] Message status tracked (sent/delivered/read)
- [ ] Failed messages can be resent manually
- [ ] Templates are customizable

**Test Cases**:
- [ ] Single order → single message sent
- [ ] 3 orders same supplier → batched message
- [ ] Message fails → retry after 5 minutes
- [ ] Custom template → used instead of default
- [ ] Order detail shows message history

---

### TODO-024: AI-Powered Reply Parser

**Priority**: P1 (High)
**Depends On**: TODO-023

**Description**:
Use Claude AI to understand supplier replies and automatically update order status. Suppliers reply in natural language (often Arabic/English mix), and the system must understand intent.

**User Story**:
As a seller, when my supplier replies on WhatsApp, I want the system to automatically understand if the product is available and update my orders.

**Implementation Details**:

1. **Reply Patterns to Handle**:
   ```
   Positive:
   - "Yes available"
   - "موجود" (available in Arabic)
   - "OK"
   - "✅"
   - "Yes all 3"
   - "Ready"

   Negative:
   - "No stock"
   - "مو موجود" (not available in Arabic)
   - "Out"
   - "❌"
   - "Only 2 available"

   Alternative:
   - "No black, have white"
   - "256GB out, 128GB available"
   - "Can give you S23 instead"

   Partial:
   - "1 and 3 yes, 2 no"
   - "First two ok"
   ```

2. **AI Parser** (`/src/lib/ai/parse-supplier-reply.ts`):
   ```typescript
   interface SupplierReplyParsed {
     understood: boolean;
     intent: 'confirmed' | 'unavailable' | 'alternative' | 'partial' | 'unclear';
     items: {
       order_id: string;
       status: 'confirmed' | 'unavailable' | 'alternative';
       alternative_offered?: string;
     }[];
     confidence: number;
     raw_reply: string;
   }

   async function parseSupplierReply(
     message: string,
     context: { orders: Order[], supplier: Supplier }
   ): Promise<SupplierReplyParsed>
   ```

3. **System Prompt for Claude**:
   ```
   You are parsing a supplier's WhatsApp reply about product availability.

   Context:
   - Orders requested: {orders_list}
   - Supplier: {supplier_name}

   The supplier may reply in English, Arabic, or mixed. Common patterns:
   - "Yes/OK/موجود/✅" = available
   - "No/Out/مو موجود/❌" = unavailable
   - Mentioning different specs = offering alternative

   Return JSON with your understanding of each order's status.
   If unclear, set understood: false so human can review.
   ```

4. **Auto-Update Flow**:
   - Incoming WhatsApp message received
   - Match to pending supplier_order by phone number
   - Parse reply with AI
   - If high confidence (>0.8): auto-update status
   - If low confidence: flag for manual review
   - Notify seller of status change

5. **Manual Review UI**:
   ```
   ┌────────────────────────────────────────────┐
   │ ⚠️ Needs Review                            │
   │                                            │
   │ Supplier said: "first one yes second wait" │
   │                                            │
   │ Order 1: iPhone 15 Pro   [✅ Confirm] [❌] │
   │ Order 2: Samsung S24     [✅ Confirm] [❌] │
   │                                            │
   │ [Apply Changes]                            │
   └────────────────────────────────────────────┘
   ```

**Acceptance Criteria**:
- [ ] Incoming WhatsApp messages parsed automatically
- [ ] High-confidence replies auto-update orders
- [ ] Low-confidence replies flagged for review
- [ ] Arabic replies understood correctly
- [ ] Partial confirmations handled
- [ ] Alternative offers captured and shown
- [ ] Manual review UI is simple and fast

**Test Cases**:
- [ ] "Yes" → all orders confirmed
- [ ] "موجود" (Arabic) → confirmed
- [ ] "No stock" → marked unavailable
- [ ] "First two yes" → partial update
- [ ] "Have 128GB instead" → alternative captured
- [ ] Gibberish → flagged for review

---

### TODO-025: Unavailable Product Handling

**Priority**: P1 (High)
**Depends On**: TODO-024

**Description**:
When a supplier says product is unavailable, guide the seller through next steps: offer alternative to customer OR cancel order. Make it foolproof.

**User Story**:
As a seller, when my supplier says a product isn't available, I want clear options for what to do next.

**Implementation Details**:

1. **Unavailable Product Flow**:
   ```
   Product Unavailable
         │
         ▼
   ┌─────────────────────────┐
   │ What would you like to  │
   │ do?                     │
   │                         │
   │ [Offer Alternative]     │◀── Opens product selector
   │ [Cancel Order]          │◀── Confirms cancellation
   │ [Check Other Supplier]  │◀── If backup exists
   └─────────────────────────┘
   ```

2. **Alternative Offer Flow**:
   - Show similar products (same brand, similar price)
   - AI suggests best alternatives
   - Generate customer message:
     ```
     "Hi! Unfortunately the iPhone 15 Pro Black
     is out of stock. We have iPhone 15 Pro
     White available at same price.
     Would you like this instead?"
     ```
   - Track customer response

3. **Database**:
   ```sql
   ALTER TABLE orders ADD COLUMN unavailable_handled BOOLEAN DEFAULT false;
   ALTER TABLE orders ADD COLUMN alternative_offered_product_id UUID REFERENCES products(id);
   ALTER TABLE orders ADD COLUMN customer_response TEXT
     CHECK (customer_response IN ('pending', 'accepted_alternative', 'cancelled', 'no_response'));
   ```

4. **Notification to Seller**:
   - Push notification: "⚠️ iPhone 15 Pro unavailable - action needed"
   - Dashboard shows urgent items prominently
   - Daily summary of unhandled unavailable orders

**Acceptance Criteria**:
- [ ] Unavailable orders prominently displayed
- [ ] One-tap access to handling options
- [ ] Alternative suggestions are relevant
- [ ] Customer message auto-generated
- [ ] Order status updates based on outcome
- [ ] Nothing falls through the cracks

**Test Cases**:
- [ ] Supplier says no → order flagged immediately
- [ ] Offer alternative → message template ready
- [ ] Cancel order → status updated, reason logged
- [ ] Try other supplier → routes to backup
- [ ] Unhandled after 24h → escalation alert

---

## Phase 7: CRM & Customer Intelligence

### TODO-026: Customer Database & Profiles

**Priority**: P1 (High)
**Depends On**: TODO-006

**Description**:
Build customer profiles from order history. Automatically detect repeat customers and surface relevant information when processing orders.

**User Story**:
As a seller, I want to know when a customer has ordered before and see their history so I can provide better service.

**Implementation Details**:

1. **Database Schema**:
   ```sql
   CREATE TABLE customers (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES profiles(id),
     -- Identity (may have multiple)
     email TEXT,
     phone TEXT,
     name TEXT,
     -- Computed/aggregated
     total_orders INTEGER DEFAULT 0,
     total_spent DECIMAL(12,2) DEFAULT 0,
     first_order_date TIMESTAMPTZ,
     last_order_date TIMESTAMPTZ,
     -- CRM fields
     tags TEXT[],
     notes TEXT,
     is_vip BOOLEAN DEFAULT false,
     preferred_contact_method TEXT,
     -- Addresses
     addresses JSONB DEFAULT '[]',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Link orders to customers
   ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES customers(id);

   -- Customer matching rules
   CREATE TABLE customer_match_rules (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES profiles(id),
     match_by TEXT CHECK (match_by IN ('email', 'phone', 'name_and_city')),
     priority INTEGER DEFAULT 1
   );
   ```

2. **Customer Matching Logic**:
   - On order import, try to match to existing customer
   - Match by: exact email > exact phone > name + city
   - If no match, create new customer
   - Merge duplicate customers tool

3. **Order View Enhancement**:
   ```
   ┌─────────────────────────────────────────────┐
   │ Order #12345                                │
   ├─────────────────────────────────────────────┤
   │ 👤 Ahmed Ali                    ⭐ REPEAT   │
   │    📧 ahmed@email.com                       │
   │    📱 +971 50 xxx xxxx                      │
   │                                             │
   │ 📊 Customer Stats:                          │
   │    • 5 previous orders                      │
   │    • AED 12,450 total spent                 │
   │    • Last order: 2 weeks ago                │
   │    • Favorite: Apple products               │
   │                                             │
   │ 📝 Notes: "Prefers evening delivery"        │
   │                                             │
   │ [View Full Profile] [Add Note]              │
   └─────────────────────────────────────────────┘
   ```

4. **Customer Profile Page**:
   - Full order history
   - Communication log
   - Notes/tags
   - VIP toggle
   - Preferred products

**Acceptance Criteria**:
- [ ] Customers auto-created from orders
- [ ] Repeat customers identified and flagged
- [ ] Customer stats calculated correctly
- [ ] Order view shows customer context
- [ ] Notes/tags editable
- [ ] Customer search works
- [ ] Duplicate detection and merge

**Test Cases**:
- [ ] First order → new customer created
- [ ] Second order same email → linked to existing
- [ ] Different email, same phone → linked correctly
- [ ] Customer stats update on new order
- [ ] VIP flag persists and shows on orders

---

### TODO-027: Repeat Customer Recognition & Personalization

**Priority**: P2 (Medium)
**Depends On**: TODO-026

**Description**:
Proactively recognize repeat customers and enable personalized touches like thank-you messages and special offers.

**User Story**:
As a seller, I want to automatically thank repeat customers and make them feel valued.

**Implementation Details**:

1. **Repeat Customer Detection Rules**:
   ```typescript
   interface RepeatCustomerRules {
     orders_threshold: number;      // e.g., 2+ orders = repeat
     spent_threshold: number;       // e.g., 5000+ AED = VIP
     recency_days: number;          // e.g., ordered in last 90 days = active
   }
   ```

2. **Personalization Options**:
   - Auto-generated thank you note (printed with package)
   - Custom message field per order
   - Referral code generation
   - Birthday/anniversary tracking (if captured)

3. **Thank You Note Generator**:
   ```
   ┌─────────────────────────────────────────┐
   │  🌟 Thank You, Ahmed!                   │
   │                                         │
   │  This is your 5th order with us!        │
   │  We truly appreciate your loyalty.      │
   │                                         │
   │  As a thank you, here's a special       │
   │  discount for your next purchase:       │
   │                                         │
   │  Code: AHMED10 (10% off)                │
   │                                         │
   │  - Your friends at Mobile Store         │
   └─────────────────────────────────────────┘
   ```

4. **Database**:
   ```sql
   CREATE TABLE referral_codes (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES profiles(id),
     customer_id UUID REFERENCES customers(id),
     code TEXT UNIQUE NOT NULL,
     discount_percent INTEGER,
     discount_amount DECIMAL(10,2),
     max_uses INTEGER,
     times_used INTEGER DEFAULT 0,
     expires_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE personalized_messages (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES profiles(id),
     order_id UUID REFERENCES orders(id),
     message_type TEXT CHECK (message_type IN ('thank_you', 'birthday', 'referral', 'custom')),
     content TEXT NOT NULL,
     printed BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

5. **Coupon Limitations** (from research):
   - **Amazon UAE**: Seller can create coupons in Seller Central ✅
   - **Cartlow**: Marketplace-controlled, no seller coupons ❌
   - **Revibe**: No commission model, marketplace controls pricing ❌
   - **Solution**: For non-Amazon, offer "message the seller" discount or next-purchase code

**Acceptance Criteria**:
- [ ] Repeat customers auto-tagged
- [ ] Thank you notes auto-generated
- [ ] Referral codes can be created
- [ ] Notes print with packing slip
- [ ] Works within marketplace limitations
- [ ] Seller can customize messages

**Test Cases**:
- [ ] 2nd order → "repeat" tag applied
- [ ] 5th order → VIP status suggested
- [ ] Thank you note includes order count
- [ ] Referral code generates unique code
- [ ] Code tracks usage

---

## Phase 8: Market Intelligence

### TODO-028: Sales Trend Analysis

**Priority**: P2 (Medium)
**Depends On**: TODO-009

**Description**:
Analyze the seller's own sales data to identify trends, hot products, slow movers, and seasonal patterns.

**User Story**:
As a seller, I want to know which products are selling well and which aren't so I can stock accordingly.

**Implementation Details**:

1. **Metrics to Calculate**:
   - Sales velocity (units/day over 7, 30, 90 days)
   - Revenue by product/brand/category
   - Trend direction (↑ increasing, → stable, ↓ declining)
   - Margin analysis (if cost data available)
   - Seasonal patterns (Ramadan, holidays, etc.)

2. **Hot Products Algorithm**:
   ```typescript
   interface ProductTrend {
     product_id: string;
     name: string;
     sales_7d: number;
     sales_30d: number;
     velocity_change: number; // % change in velocity
     trend: 'hot' | 'rising' | 'stable' | 'declining' | 'dead';
     revenue_7d: number;
     margin?: number;
   }

   // Hot = high velocity + increasing
   // Rising = moderate velocity + increasing trend
   // Declining = decreasing velocity
   // Dead = no sales in 30 days
   ```

3. **Dashboard Widget**:
   ```
   🔥 Hot Products This Week
   ┌────────────────────────────────────────┐
   │ 1. iPhone 15 Pro 256GB    ↑ 45% │ 23 sold │
   │ 2. Samsung S24 Ultra      ↑ 32% │ 18 sold │
   │ 3. AirPods Pro 2          ↑ 28% │ 31 sold │
   └────────────────────────────────────────┘

   ⚠️ Slow Movers (Consider discounting)
   ┌────────────────────────────────────────┐
   │ 1. Pixel 8 Pro            ↓ 60% │ 2 sold  │
   │ 2. OnePlus 12             ↓ 45% │ 3 sold  │
   └────────────────────────────────────────┘
   ```

4. **API Endpoints**:
   - `GET /api/intelligence/trends` - Product trends
   - `GET /api/intelligence/hot-products` - Top performers
   - `GET /api/intelligence/slow-movers` - Underperformers

**Acceptance Criteria**:
- [ ] Hot products identified correctly
- [ ] Trend direction calculated accurately
- [ ] Dashboard shows top/bottom performers
- [ ] Time range selectable (7d, 30d, 90d)
- [ ] Updates daily automatically

**Test Cases**:
- [ ] Product with 20+ sales/week → marked hot
- [ ] Product with 0 sales in 30d → marked dead
- [ ] Velocity change calculated correctly
- [ ] Seasonal products identified

---

### TODO-029: Market Research Integration

**Priority**: P2 (Medium)
**Depends On**: TODO-028

**Description**:
Augment internal sales data with external market research. Track what's trending in the broader market, competitor pricing, and new product launches.

**User Story**:
As a seller, I want to know what products are trending in the market overall, not just my own sales.

**Implementation Details**:

1. **Data Sources**:
   - Web scraping of marketplace bestseller pages
   - Google Trends for product interest
   - Social media trend tracking (optional)
   - New product launch tracking

2. **Market Trend Tracking**:
   ```typescript
   interface MarketTrend {
     product_name: string;
     brand: string;
     trend_score: number; // 0-100
     sources: string[]; // e.g., ['amazon_bestsellers', 'google_trends']
     price_range: { min: number; max: number };
     seller_has_product: boolean;
     recommendation: 'stock_up' | 'consider' | 'monitor';
   }
   ```

3. **Scheduled Jobs**:
   - Daily: Scrape marketplace bestsellers
   - Weekly: Google Trends analysis
   - On-demand: Specific product research

4. **AI Research Agent**:
   - Uses web search to find trending products
   - Summarizes market sentiment
   - Identifies opportunities seller is missing

5. **UI - Market Intelligence Page**:
   ```
   📈 Market Trends

   🔥 Trending Now (You don't have):
   ┌────────────────────────────────────────────┐
   │ iPhone 16 Pro Max - High demand on Amazon  │
   │ Market price: AED 4,200 - 4,800            │
   │ [Add to Catalog] [Research More]           │
   └────────────────────────────────────────────┘

   💡 Opportunity Alert:
   "Samsung Galaxy Z Fold 6 is trending. You sold
   3 last month at good margin. Consider stocking
   more from suppliers."
   ```

**Acceptance Criteria**:
- [ ] Marketplace bestsellers tracked daily
- [ ] Trends compared to seller's catalog
- [ ] Missing opportunities highlighted
- [ ] Price ranges shown
- [ ] Recommendations are actionable

**Test Cases**:
- [ ] Trending product not in catalog → flagged
- [ ] Trending product in catalog → "stock up" recommendation
- [ ] Price change detected → alert shown
- [ ] New product launch → notification

---

### TODO-030: Price Optimization Engine

**Priority**: P2 (Medium)
**Depends On**: TODO-028, TODO-029

**Description**:
Suggest optimal prices to maximize revenue while remaining competitive. Balance between margin and sales volume.

**User Story**:
As a seller, I want the system to suggest the best price for each product to maximize my profits.

**Implementation Details**:

1. **Price Optimization Factors**:
   - Competitor prices (if tracked)
   - Historical sales at different price points
   - Demand elasticity estimation
   - Target margin vs volume
   - Marketplace fees

2. **Optimization Algorithm**:
   ```typescript
   interface PriceSuggestion {
     product_id: string;
     current_price: number;
     suggested_price: number;
     reasoning: string;
     expected_impact: {
       sales_change_percent: number;
       margin_change_percent: number;
       revenue_change_percent: number;
     };
     confidence: number;
   }
   ```

3. **Seller Preferences**:
   ```sql
   CREATE TABLE pricing_preferences (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES profiles(id),
     strategy TEXT CHECK (strategy IN ('maximize_margin', 'maximize_volume', 'balanced')),
     min_margin_percent INTEGER DEFAULT 10,
     auto_apply_suggestions BOOLEAN DEFAULT false,
     price_update_frequency TEXT DEFAULT 'weekly',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

4. **UI - Price Suggestions**:
   ```
   💰 Price Optimization Suggestions

   ┌─────────────────────────────────────────────────┐
   │ iPhone 15 Pro 256GB                             │
   │ Current: AED 3,500  →  Suggested: AED 3,299    │
   │                                                 │
   │ Why: Competitors average AED 3,250. Lowering   │
   │ by 6% could increase sales by ~15%             │
   │                                                 │
   │ [Apply] [Ignore] [Set Custom Price]            │
   └─────────────────────────────────────────────────┘
   ```

5. **Competitor Price Tracking** (optional enhancement):
   - Periodic scraping of competitor prices
   - Alert when significantly undercut
   - Suggest matching or undercutting

**Acceptance Criteria**:
- [ ] Price suggestions generated for catalog
- [ ] Reasoning is clear and understandable
- [ ] Seller can apply with one tap
- [ ] Respects minimum margin settings
- [ ] History of price changes tracked

**Test Cases**:
- [ ] Product overpriced → lower price suggested
- [ ] Product underpriced → higher price suggested
- [ ] Apply suggestion → price updates
- [ ] Below min margin → warning shown

---

## Phase 9: Efficiency & Recommendations

### TODO-031: Workflow Efficiency Analyzer

**Priority**: P2 (Medium)
**Depends On**: TODO-019, TODO-021

**Description**:
Analyze the seller's workflow and proactively suggest improvements. Identify bottlenecks, time-wasters, and automation opportunities.

**User Story**:
As a seller, I want the system to tell me how I can work more efficiently.

**Implementation Details**:

1. **Metrics to Track**:
   - Order processing time (import → shipped)
   - Supplier response time
   - Time spent on manual tasks
   - Orders per day capacity
   - Bottleneck identification

2. **Efficiency Recommendations**:
   ```typescript
   interface EfficiencyRecommendation {
     id: string;
     type: 'automation' | 'process' | 'supplier' | 'inventory';
     title: string;
     description: string;
     impact: 'high' | 'medium' | 'low';
     effort: 'easy' | 'medium' | 'hard';
     time_saved_weekly: number; // minutes
     action?: () => void; // One-tap implementation
   }
   ```

3. **Example Recommendations**:
   - "Enable WhatsApp automation to save 45 min/day on supplier messaging"
   - "Supplier X takes 4 hours to respond on average. Consider backup supplier"
   - "You manually enter orders from Cartlow. Import automation available"
   - "30% of orders are iPhone 15 Pro - consider keeping 5 in stock"

4. **Dashboard Widget**:
   ```
   💡 Efficiency Tips

   ┌────────────────────────────────────────────┐
   │ ⚡ High Impact                              │
   │                                            │
   │ 🤖 Enable WhatsApp Automation              │
   │    Save ~45 min daily on supplier messages │
   │    [Enable Now]                            │
   │                                            │
   │ 📦 Stock Top Sellers                       │
   │    iPhone 15 Pro sells 3x daily. Keep 10   │
   │    in stock to avoid supplier delays.      │
   │    [View Stocking Suggestions]             │
   └────────────────────────────────────────────┘
   ```

**Acceptance Criteria**:
- [ ] Workflow analyzed automatically
- [ ] Bottlenecks identified with data
- [ ] Recommendations are specific and actionable
- [ ] One-tap to implement where possible
- [ ] Impact quantified (time/money saved)

**Test Cases**:
- [ ] No WhatsApp connected → suggests automation
- [ ] Slow supplier → suggests backup
- [ ] High-volume product → suggests stocking
- [ ] Recommendation implemented → removed from list

---

### TODO-032: Daily Operations Dashboard

**Priority**: P1 (High)
**Depends On**: TODO-021, TODO-024

**Description**:
A single screen that shows everything a seller needs to manage their day. Designed for the "extremely tech challenged" - think restaurant POS simplicity.

**User Story**:
As a seller, when I open the app in the morning, I want to see exactly what I need to do today.

**Implementation Details**:

1. **Morning Dashboard Layout**:
   ```
   ┌─────────────────────────────────────────────────────┐
   │  Good Morning! ☀️                    Dec 27, 2025   │
   ├─────────────────────────────────────────────────────┤
   │                                                     │
   │  📦 TODAY'S ORDERS                                  │
   │  ┌─────────────────────────────────────────────┐   │
   │  │ 🔴 8 Need Supplier Confirmation             │   │
   │  │ 🟡 5 Ready to Pack                          │   │
   │  │ 🟢 3 Ready to Ship                          │   │
   │  └─────────────────────────────────────────────┘   │
   │                                                     │
   │  📨 SUPPLIER STATUS                                 │
   │  ┌─────────────────────────────────────────────┐   │
   │  │ Ali Electronics: 4 pending (sent 9:00 AM)   │   │
   │  │ Mobile Hub: 4 pending (sent 9:15 AM)        │   │
   │  └─────────────────────────────────────────────┘   │
   │                                                     │
   │  ⚠️ NEEDS YOUR ATTENTION                           │
   │  ┌─────────────────────────────────────────────┐   │
   │  │ • 2 products unavailable - action needed    │   │
   │  │ • 1 customer waiting for response           │   │
   │  └─────────────────────────────────────────────┘   │
   │                                                     │
   │  🚚 DELIVERIES TODAY                                │
   │  ┌─────────────────────────────────────────────┐   │
   │  │ 10:00 AM - Ali Electronics (est. 6 items)   │   │
   │  │  4:00 PM - Mobile Hub (est. 4 items)        │   │
   │  └─────────────────────────────────────────────┘   │
   │                                                     │
   └─────────────────────────────────────────────────────┘
   ```

2. **One-Tap Actions**:
   - Tap "Need Supplier Confirmation" → see orders, resend messages
   - Tap "Ready to Pack" → packing checklist
   - Tap "Ready to Ship" → shipping labels/handoff
   - Tap supplier → see pending orders

3. **Progressive Disclosure**:
   - Summary view first
   - Tap to drill down
   - Never overwhelming
   - Always know "what's next"

**Acceptance Criteria**:
- [ ] Dashboard loads in <2 seconds
- [ ] Shows morning priorities clearly
- [ ] One tap to any action
- [ ] Updates in real-time
- [ ] Mobile-first design
- [ ] Zero learning curve

**Test Cases**:
- [ ] Morning load → shows today's orders
- [ ] New order comes in → count updates
- [ ] Supplier confirms → moves to "ready to pack"
- [ ] All done → shows "All caught up! 🎉"

---

## Phase 10: Packing & Shipping

### TODO-033: Packing Workflow

**Priority**: P1 (High)
**Depends On**: TODO-032

**Description**:
Simple packing workflow with checklist. When supplier delivers, seller can check off items as they pack.

**User Story**:
As a seller, when my supplier delivery arrives, I want a simple checklist to pack orders without mistakes.

**Implementation Details**:

1. **Packing Screen**:
   ```
   📦 Pack Orders - Ali Electronics Delivery

   Received at 10:15 AM • 6 items

   ☐ Order #1234 - iPhone 15 Pro 256GB Black
     Customer: Ahmed, Dubai
     [Mark Packed] [Issue?]

   ☑ Order #1235 - Samsung S24 128GB White
     Customer: Sara, Abu Dhabi
     ✅ Packed at 10:20 AM

   ☐ Order #1236 - AirPods Pro 2
     Customer: Mohammed, Sharjah
     [Mark Packed] [Issue?]

   ─────────────────────────────────
   Progress: 1/6 packed
   [Mark All Packed]
   ```

2. **Issue Handling**:
   - Wrong item received
   - Damaged item
   - Missing item
   - → Creates follow-up with supplier

3. **Packing Slip Generation**:
   - Auto-generate with order details
   - Include thank-you note for repeat customers
   - Include referral code if applicable
   - Print-ready format

**Acceptance Criteria**:
- [ ] Packing list generated from confirmed orders
- [ ] One-tap to mark packed
- [ ] Issues can be reported inline
- [ ] Packing slip printable
- [ ] Progress tracked

**Test Cases**:
- [ ] All items packed → ready to ship
- [ ] Issue reported → supplier notified
- [ ] Repeat customer → thank you note included

---

### TODO-034: Shipping & Handoff

**Priority**: P1 (High)
**Depends On**: TODO-033

**Description**:
Manage the shipping handoff - either to pickup service (Cartlow/Revibe) or self-delivery (Amazon).

**User Story**:
As a seller, I want to easily hand off packages to the right courier or fulfillment service.

**Implementation Details**:

1. **Shipping Groups**:
   ```
   🚚 Ready to Ship

   AMAZON (Self-Delivery) - 3 packages
   ┌────────────────────────────────────────┐
   │ ☐ #1234 - Dubai, Al Barsha             │
   │ ☐ #1235 - Dubai, Marina                │
   │ ☐ #1236 - Dubai, JLT                   │
   │                                        │
   │ [Print Labels] [Mark All Shipped]      │
   └────────────────────────────────────────┘

   CARTLOW (Pickup Coming ~2:00 PM) - 2 packages
   ┌────────────────────────────────────────┐
   │ ☐ #1237 - Awaiting pickup              │
   │ ☐ #1238 - Awaiting pickup              │
   │                                        │
   │ [Print Handoff Sheet]                  │
   └────────────────────────────────────────┘

   REVIBE (Pickup Coming ~3:00 PM) - 1 package
   ┌────────────────────────────────────────┐
   │ ☐ #1239 - Awaiting pickup              │
   │                                        │
   │ [Print Handoff Sheet]                  │
   └────────────────────────────────────────┘
   ```

2. **Handoff Confirmation**:
   - Mark when courier picks up
   - Record courier name/ID (optional)
   - Timestamp logged

3. **Self-Delivery Tracking**:
   - Route optimization (optional enhancement)
   - Delivery confirmation
   - Customer notification

**Acceptance Criteria**:
- [ ] Orders grouped by fulfillment method
- [ ] Pickup times shown
- [ ] One-tap handoff confirmation
- [ ] Shipping labels printable
- [ ] Status updates to order

**Test Cases**:
- [ ] Cartlow order → grouped in Cartlow section
- [ ] Amazon order → grouped in self-delivery
- [ ] Pickup confirmed → orders marked shipped

---

## Phase 11: Team Management & Roles

### TODO-035: Team Member Management

**Priority**: P1 (High)
**Depends On**: TODO-002 (Auth)

**Description**:
Allow business owners to invite team members (packers, managers) with role-based access. Each role sees only what they need. Designed for shared warehouse environments.

**User Story**:
As a business owner, I want to invite my packer to use the system with limited access so they can do their job without seeing sensitive business data.

**Implementation Details**:

1. **Database Schema**:
   ```sql
   -- Team members
   CREATE TABLE team_members (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES profiles(id),      -- The team member's auth
     organization_id UUID NOT NULL,              -- Business they belong to
     owner_user_id UUID REFERENCES profiles(id), -- Business owner
     role TEXT CHECK (role IN ('owner', 'manager', 'packer', 'viewer')) NOT NULL,
     name TEXT NOT NULL,
     email TEXT,
     phone TEXT,
     pin_code TEXT,                              -- 4-digit PIN for quick login
     is_active BOOLEAN DEFAULT true,
     permissions JSONB DEFAULT '{}',             -- Custom permission overrides
     last_active_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Organization (business)
   CREATE TABLE organizations (
     id UUID PRIMARY KEY,
     owner_user_id UUID REFERENCES profiles(id),
     name TEXT NOT NULL,
     settings JSONB DEFAULT '{}',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Session tracking for shared devices
   CREATE TABLE team_sessions (
     id UUID PRIMARY KEY,
     team_member_id UUID REFERENCES team_members(id),
     device_id TEXT,
     started_at TIMESTAMPTZ DEFAULT NOW(),
     ended_at TIMESTAMPTZ
   );
   ```

2. **Role Definitions**:
   ```typescript
   const ROLES = {
     owner: {
       label: 'Owner',
       description: 'Full access to everything',
       permissions: ['*'],
     },
     manager: {
       label: 'Manager',
       description: 'Manage orders, inventory, team. No billing.',
       permissions: [
         'orders.*', 'inventory.*', 'products.*',
         'suppliers.*', 'customers.*', 'team.view',
         'reports.*'
       ],
     },
     packer: {
       label: 'Packer',
       description: 'Pack and ship orders only',
       permissions: [
         'orders.view', 'orders.pack', 'orders.ship',
         'packing.*', 'shipping.*'
       ],
     },
     viewer: {
       label: 'Viewer',
       description: 'View only, no changes',
       permissions: ['*.view'],
     },
   };
   ```

3. **Invite Flow** (Dead simple):
   ```
   ┌─────────────────────────────────────────────┐
   │  👥 Add Team Member                         │
   ├─────────────────────────────────────────────┤
   │                                             │
   │  Name: [_______________________]            │
   │                                             │
   │  Role:                                      │
   │  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
   │  │ 👔      │ │ 📦      │ │ 👁      │      │
   │  │ Manager │ │ Packer  │ │ Viewer  │      │
   │  └─────────┘ └─────────┘ └─────────┘      │
   │                                             │
   │  How will they log in?                      │
   │  ○ Email invite (gets their own login)     │
   │  ● PIN code (for shared devices)           │
   │                                             │
   │  PIN: [1][2][3][4]                         │
   │                                             │
   │            [Cancel]  [Add Member]           │
   └─────────────────────────────────────────────┘
   ```

4. **PIN Login** (for warehouse shared devices):
   - Device registered to organization
   - Team member enters 4-digit PIN
   - Instant access to their role's interface
   - Auto-logout after 30 min inactivity

5. **UI Components**:
   - `/src/app/(dashboard)/settings/team/page.tsx`
   - `/src/components/team/TeamMemberCard.tsx`
   - `/src/components/team/InviteModal.tsx`
   - `/src/components/auth/PinLogin.tsx`

**Acceptance Criteria**:
- [ ] Owner can invite team members
- [ ] Role selection is visual and clear
- [ ] PIN login works on shared devices
- [ ] Team members only see their permitted screens
- [ ] Owner can deactivate members instantly
- [ ] Activity logged per team member

**Test Cases**:
- [ ] Invite packer → they see only packing view
- [ ] PIN login → correct role loaded
- [ ] Deactivate member → instant access revoked
- [ ] Manager tries billing → access denied
- [ ] Wrong PIN 3x → locked for 5 minutes

---

### TODO-036: Packer-Optimized Interface

**Priority**: P1 (High)
**Depends On**: TODO-035, TODO-033

**Description**:
A dedicated, ultra-simple interface for packers. One screen, big buttons, keyboard shortcuts. Optimized for speed - packers should process 100+ orders/day without fatigue.

**User Story**:
As a packer, I want a simple screen that shows me what to pack next and lets me mark items done with one click or keypress.

**Implementation Details**:

1. **Packer Dashboard Layout**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  📦 PACKING STATION          Ahmed (Packer)    [Switch User]│
   ├─────────────────────────────────────────────────────────────┤
   │                                                             │
   │  ┌─────────────────────────────────────────────────────┐   │
   │  │              CURRENT ORDER                          │   │
   │  │                                                     │   │
   │  │  #ORD-1234          ████████████  (scan barcode)   │   │
   │  │                                                     │   │
   │  │  ┌───────────────────────────────────────────┐     │   │
   │  │  │  📱 iPhone 15 Pro 256GB Black             │     │   │
   │  │  │     Condition: Excellent                   │     │   │
   │  │  │     Storage: 256GB                         │     │   │
   │  │  │                                            │     │   │
   │  │  │  📍 Dubai, Al Barsha                      │     │   │
   │  │  │  🚚 Amazon (Self-Delivery)                │     │   │
   │  │  │  ⭐ Repeat Customer (5th order)           │     │   │
   │  │  └───────────────────────────────────────────┘     │   │
   │  │                                                     │   │
   │  │  ┌─────────────────────────────────────────────┐   │   │
   │  │  │  [P] PACKED     [I] ISSUE     [S] SKIP     │   │   │
   │  │  └─────────────────────────────────────────────┘   │   │
   │  │                                                     │   │
   │  │  Press P, click, or scan product barcode           │   │
   │  └─────────────────────────────────────────────────────┘   │
   │                                                             │
   │  ┌──────────────────┐  ┌──────────────────┐               │
   │  │ 📋 Queue: 23     │  │ ✅ Done: 45      │               │
   │  │    orders        │  │    today         │               │
   │  └──────────────────┘  └──────────────────┘               │
   │                                                             │
   │  [Print Label]  [Print Slip]  [Print Both]                 │
   └─────────────────────────────────────────────────────────────┘
   ```

2. **Keyboard Shortcuts** (always shown on screen):
   ```
   P or Enter     = Mark as Packed (auto-advances)
   I              = Report Issue
   S              = Skip (come back later)
   L              = Print Label
   R              = Print Receipt/Slip
   B              = Print Both
   ←              = Previous order
   →              = Next order
   Esc            = Exit current order
   F              = Filter/Search
   ?              = Show all shortcuts
   ```

3. **Barcode Scanner Support**:
   - Scan order barcode → loads that order
   - Scan product barcode → verifies correct item
   - Mismatch → audio alert + red screen flash

4. **Auto-Advance Workflow**:
   ```
   Pack order → Auto-print label → Show next order
   ↓
   [Configurable: auto-print or manual]
   ```

5. **Issue Reporting** (Quick categories):
   ```
   ┌─────────────────────────────────┐
   │  What's the issue?             │
   │                                │
   │  [1] Wrong item received       │
   │  [2] Item damaged              │
   │  [3] Item missing              │
   │  [4] Wrong condition           │
   │  [5] Other: [___________]      │
   │                                │
   │  [Cancel]  [Report Issue]      │
   └─────────────────────────────────┘
   ```

6. **Audio/Visual Feedback**:
   - Success: Green flash + "ding" sound
   - Error: Red flash + "buzz" sound
   - Repeat customer: Yellow highlight
   - Urgent order: Pulsing red border

**Acceptance Criteria**:
- [ ] Packer processes order in <5 seconds average
- [ ] Keyboard shortcuts work reliably
- [ ] Barcode scanning works
- [ ] Auto-advance is configurable
- [ ] Print functions work with single key
- [ ] Audio feedback (can be disabled)
- [ ] Works on cheap Android tablets
- [ ] Queue shows next orders

**Test Cases**:
- [ ] Press P → order marked, next loads
- [ ] Scan wrong product → error shown
- [ ] Print L → label prints immediately
- [ ] 30 min idle → auto-logout
- [ ] Issue reported → manager notified

---

### TODO-037: Customizable Workflow Rules

**Priority**: P2 (Medium)
**Depends On**: TODO-035, TODO-036

**Description**:
Let users customize their workflow stages and what happens at each stage. Not everyone works the same way - some pack then print, others print then pack.

**User Story**:
As a business owner, I want to customize the packing workflow to match how my team actually works.

**Implementation Details**:

1. **Workflow Configuration UI**:
   ```
   ┌─────────────────────────────────────────────────────────┐
   │  ⚙️ Customize Packing Workflow                          │
   ├─────────────────────────────────────────────────────────┤
   │                                                         │
   │  When order is marked PACKED:                           │
   │  ☑ Auto-print shipping label                           │
   │  ☑ Auto-print packing slip                             │
   │  ☐ Require barcode scan to confirm                     │
   │  ☑ Auto-advance to next order                          │
   │                                                         │
   │  Order Priority:                                        │
   │  ○ First In, First Out (oldest first)                  │
   │  ● By delivery cutoff (urgent first)                   │
   │  ○ By marketplace (group Amazon, then Cartlow, etc.)   │
   │                                                         │
   │  Packer Actions Allowed:                                │
   │  ☑ Mark as packed                                      │
   │  ☑ Report issues                                       │
   │  ☐ Cancel orders (manager only)                        │
   │  ☐ Change order details (manager only)                 │
   │                                                         │
   │  Notifications:                                         │
   │  ☑ Sound on success                                    │
   │  ☑ Sound on error                                      │
   │  ☐ Voice announcements                                 │
   │                                                         │
   │  [Reset to Default]              [Save Changes]         │
   └─────────────────────────────────────────────────────────┘
   ```

2. **Database**:
   ```sql
   CREATE TABLE workflow_rules (
     id UUID PRIMARY KEY,
     organization_id UUID REFERENCES organizations(id),
     rule_type TEXT CHECK (rule_type IN ('packing', 'shipping', 'receiving')),
     config JSONB NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Example config:
   -- {
   --   "on_packed": {
   --     "auto_print_label": true,
   --     "auto_print_slip": true,
   --     "require_scan": false,
   --     "auto_advance": true
   --   },
   --   "order_priority": "delivery_cutoff",
   --   "packer_permissions": ["pack", "issue"],
   --   "sounds": { "success": true, "error": true }
   -- }
   ```

3. **Custom Stages** (Advanced):
   - Let users define their own stages
   - Example: Received → QC Checked → Packed → Labeled → Ready
   - Each stage can have its own actions/permissions

**Acceptance Criteria**:
- [ ] Workflow rules configurable per organization
- [ ] Changes apply immediately
- [ ] Sensible defaults provided
- [ ] Can reset to defaults
- [ ] Packers see updated behavior instantly

**Test Cases**:
- [ ] Disable auto-print → label doesn't print
- [ ] Enable barcode scan → forces verification
- [ ] Change order priority → queue reorders

---

## Phase 12: Unified Status Dashboard

### TODO-038: Real-Time Operations Overview

**Priority**: P0 (Critical)
**Depends On**: TODO-021, TODO-019

**Description**:
A single "command center" dashboard showing the complete picture: all inventory, all orders at every stage, all supplier statuses. Think airport departure board meets inventory management.

**User Story**:
As a business owner, I want to see at a glance where everything is - how much inventory I have, where every order is in the pipeline, and what needs attention.

**Implementation Details**:

1. **Dashboard Layout**:
   ```
   ┌─────────────────────────────────────────────────────────────────────┐
   │  🏪 Operations Overview                           Live • Updated 2s │
   ├─────────────────────────────────────────────────────────────────────┤
   │                                                                     │
   │  ┌─────────────────────── ORDER PIPELINE ──────────────────────┐   │
   │  │                                                              │   │
   │  │  ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐│ │
   │  │  │  NEW   │ → │SUPPLIER│ → │CONFIRMED│→ │ PACKED │ → │SHIPPED │ │ │
   │  │  │   12   │   │   8    │   │   15   │   │   5    │   │   43   │ │ │
   │  │  │        │   │ ⏳ 3   │   │        │   │        │   │  today │ │ │
   │  │  └────────┘   └────────┘   └────────┘   └────────┘   └────────┘│ │
   │  │     ↓            ↓                                             │ │
   │  │  [View]     [2 unavail]                                        │ │
   │  └──────────────────────────────────────────────────────────────────┘│
   │                                                                     │
   │  ┌─────────── INVENTORY ───────────┐  ┌────── SUPPLIERS ──────┐   │
   │  │                                  │  │                        │   │
   │  │  📦 Total Products:    156      │  │  Ali Electronics       │   │
   │  │  📱 Total Units:       342      │  │  └ 4 pending ⏳ 45min  │   │
   │  │  ⚡ Available:         298      │  │                        │   │
   │  │  📍 Reserved:           44      │  │  Mobile Hub            │   │
   │  │  ⚠️ Low Stock:          12      │  │  └ 4 pending ⏳ 20min  │   │
   │  │  🔴 Out of Stock:        3      │  │                        │   │
   │  │                                  │  │  [Message All]         │   │
   │  │  [View Inventory]               │  │                        │   │
   │  └──────────────────────────────────┘  └────────────────────────┘   │
   │                                                                     │
   │  ┌─────────────────── ALERTS & ACTIONS ────────────────────────┐   │
   │  │                                                              │   │
   │  │  🔴 2 orders unavailable - need decision                    │   │
   │  │  🟡 3 orders waiting >2 hours for supplier                  │   │
   │  │  🟡 Delivery arriving in 30 min (Ali Electronics)           │   │
   │  │  🔵 5 orders ready for Amazon self-delivery                 │   │
   │  │                                                              │   │
   │  └──────────────────────────────────────────────────────────────┘   │
   │                                                                     │
   │  ┌──────────── TODAY'S METRICS ────────────┐                       │
   │  │  Orders: 43 shipped │ Revenue: AED 12,450 │ Avg: AED 289      │   │
   │  └─────────────────────────────────────────────────────────────────┘│
   └─────────────────────────────────────────────────────────────────────┘
   ```

2. **Order Pipeline Detail** (click any stage):
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  📦 SUPPLIER CONFIRMATION (8 orders)                        │
   ├─────────────────────────────────────────────────────────────┤
   │  ┌─────────────────────────────────────────────────────┐   │
   │  │ 🟢 Sent • Waiting reply                             │   │
   │  ├─────────────────────────────────────────────────────┤   │
   │  │ #1234 iPhone 15 Pro    Ali Elec.    45 min ago     │   │
   │  │ #1235 Samsung S24      Ali Elec.    45 min ago     │   │
   │  │ #1236 iPhone 14        Mobile Hub   20 min ago     │   │
   │  └─────────────────────────────────────────────────────┘   │
   │                                                             │
   │  ┌─────────────────────────────────────────────────────┐   │
   │  │ 🔴 Unavailable • Needs action                       │   │
   │  ├─────────────────────────────────────────────────────┤   │
   │  │ #1237 Pixel 8 Pro      Ali Elec.    [Handle Now]   │   │
   │  │ #1238 OnePlus 12       Mobile Hub   [Handle Now]   │   │
   │  └─────────────────────────────────────────────────────┘   │
   │                                                             │
   │  ┌─────────────────────────────────────────────────────┐   │
   │  │ ⏳ Slow Response (>2 hours)                         │   │
   │  ├─────────────────────────────────────────────────────┤   │
   │  │ #1239 AirPods Pro      Ali Elec.    3.5 hrs        │   │
   │  │                                     [Resend] [Call]│   │
   │  └─────────────────────────────────────────────────────┘   │
   └─────────────────────────────────────────────────────────────┘
   ```

3. **Real-Time Updates**:
   - WebSocket/Server-Sent Events for live updates
   - Numbers animate when they change
   - New items pulse briefly
   - Sound notification for important changes (optional)

4. **Database Queries** (optimized views):
   ```sql
   -- Order pipeline counts (cached, refreshed every 30s)
   CREATE MATERIALIZED VIEW order_pipeline_counts AS
   SELECT
     user_id,
     COUNT(*) FILTER (WHERE status = 'new') as new_count,
     COUNT(*) FILTER (WHERE status = 'awaiting_supplier') as supplier_count,
     COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
     COUNT(*) FILTER (WHERE status = 'packed') as packed_count,
     COUNT(*) FILTER (WHERE status = 'shipped' AND shipped_at > CURRENT_DATE) as shipped_today
   FROM orders
   GROUP BY user_id;

   -- Inventory summary
   CREATE MATERIALIZED VIEW inventory_summary AS
   SELECT
     p.user_id,
     COUNT(DISTINCT p.id) as total_products,
     SUM(i.quantity) as total_units,
     SUM(i.quantity - i.reserved) as available_units,
     SUM(i.reserved) as reserved_units,
     COUNT(*) FILTER (WHERE i.quantity <= i.reorder_point AND i.quantity > 0) as low_stock,
     COUNT(*) FILTER (WHERE i.quantity = 0) as out_of_stock
   FROM products p
   LEFT JOIN product_variants pv ON pv.product_id = p.id
   LEFT JOIN inventory i ON i.variant_id = pv.id
   GROUP BY p.user_id;
   ```

5. **Mobile View** (simplified):
   ```
   ┌────────────────────────┐
   │ 📊 Overview            │
   ├────────────────────────┤
   │ Orders Today: 43       │
   │ ─────────────────────  │
   │ 🔴 Need Action: 5      │
   │ 🟡 Awaiting: 8         │
   │ 🟢 Ready: 15           │
   │ ✅ Shipped: 43         │
   ├────────────────────────┤
   │ [View All Orders]      │
   │ [Handle Urgent]        │
   └────────────────────────┘
   ```

**Acceptance Criteria**:
- [ ] Dashboard loads in <2 seconds
- [ ] Updates in real-time (no refresh needed)
- [ ] Click any number to drill down
- [ ] Alerts are prominent and actionable
- [ ] Works on mobile
- [ ] Shows data across all marketplaces combined

**Test Cases**:
- [ ] New order → "New" count increments live
- [ ] Supplier confirms → moves to "Confirmed" live
- [ ] Click "8" in supplier → shows those 8 orders
- [ ] Low stock alert → links to affected products
- [ ] Works with 500+ orders without lag

---

### TODO-039: Inventory Location Tracking

**Priority**: P2 (Medium)
**Depends On**: TODO-038

**Description**:
Track where inventory physically is: at supplier, in transit, at warehouse, reserved for order. Especially important for the "available on demand" model.

**User Story**:
As a seller, I want to know exactly where each product unit is - with supplier, coming to me, or in my hands.

**Implementation Details**:

1. **Inventory States**:
   ```typescript
   type InventoryLocation =
     | 'at_supplier'       // Supplier has it, available to order
     | 'ordered'           // Ordered from supplier, awaiting delivery
     | 'in_transit'        // Supplier dispatched, on the way
     | 'at_warehouse'      // In seller's possession
     | 'reserved'          // Allocated to an order
     | 'packed'            // In a packed box
     | 'shipped';          // Handed off to courier
   ```

2. **Enhanced Inventory View**:
   ```
   ┌────────────────────────────────────────────────────────────────┐
   │  📦 iPhone 15 Pro 256GB Black                                  │
   ├────────────────────────────────────────────────────────────────┤
   │                                                                │
   │  INVENTORY BREAKDOWN                                           │
   │  ┌────────────────────────────────────────────────────────┐   │
   │  │  📍 At Warehouse:     3 units                          │   │
   │  │  📦 Reserved:         1 unit (Order #1234)             │   │
   │  │  ─────────────────────────────────────────────────────│   │
   │  │  Available to Sell:   2 units                          │   │
   │  └────────────────────────────────────────────────────────┘   │
   │                                                                │
   │  SUPPLIER AVAILABILITY                                         │
   │  ┌────────────────────────────────────────────────────────┐   │
   │  │  Ali Electronics:     ✅ Usually available             │   │
   │  │  Last confirmed:      2 hours ago                      │   │
   │  │  Avg fulfillment:     4 hours                          │   │
   │  └────────────────────────────────────────────────────────┘   │
   │                                                                │
   │  INCOMING                                                      │
   │  ┌────────────────────────────────────────────────────────┐   │
   │  │  🚚 2 units arriving today (10 AM delivery)            │   │
   │  │     For: Order #1235, #1236                            │   │
   │  └────────────────────────────────────────────────────────┘   │
   │                                                                │
   └────────────────────────────────────────────────────────────────┘
   ```

3. **Database**:
   ```sql
   -- Track inventory movements
   CREATE TABLE inventory_movements (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES profiles(id),
     variant_id UUID REFERENCES product_variants(id),
     from_location TEXT,
     to_location TEXT,
     quantity INTEGER NOT NULL,
     order_id UUID REFERENCES orders(id),
     supplier_order_id UUID REFERENCES supplier_orders(id),
     notes TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Supplier availability cache
   CREATE TABLE supplier_product_availability (
     id UUID PRIMARY KEY,
     supplier_id UUID REFERENCES suppliers(id),
     product_name TEXT,
     brand TEXT,
     is_available BOOLEAN,
     last_confirmed_at TIMESTAMPTZ,
     avg_fulfillment_hours INTEGER,
     notes TEXT
   );
   ```

**Acceptance Criteria**:
- [ ] Every unit tracked from supplier to customer
- [ ] Dashboard shows breakdown by location
- [ ] Incoming inventory visible
- [ ] Supplier availability tracked
- [ ] Historical movements logged

**Test Cases**:
- [ ] Order placed → unit moves to "reserved"
- [ ] Supplier ships → unit moves to "in transit"
- [ ] Delivery received → unit moves to "at warehouse"
- [ ] Order shipped → unit moves to "shipped"

---

## Phase 13: Enhanced Supplier Management

### TODO-040: Multi-Channel Supplier Communication

**Priority**: P1 (High)
**Depends On**: TODO-020, TODO-022

**Description**:
Suppliers should have both WhatsApp AND email. User chooses primary contact method per supplier. Support sending via either channel with one click.

**User Story**:
As a seller, I want to contact my supplier via WhatsApp or email depending on urgency and their preference.

**Implementation Details**:

1. **Enhanced Supplier Schema**:
   ```sql
   ALTER TABLE suppliers ADD COLUMN email TEXT;
   ALTER TABLE suppliers ADD COLUMN preferred_contact TEXT
     CHECK (preferred_contact IN ('whatsapp', 'email', 'both'))
     DEFAULT 'whatsapp';
   ALTER TABLE suppliers ADD COLUMN secondary_whatsapp TEXT;
   ALTER TABLE suppliers ADD COLUMN secondary_email TEXT;
   ALTER TABLE suppliers ADD COLUMN contact_notes TEXT;
   ```

2. **Supplier Card with Contact Options**:
   ```
   ┌──────────────────────────────────────────────────────┐
   │  👤 Ali Electronics                                  │
   ├──────────────────────────────────────────────────────┤
   │                                                      │
   │  📱 WhatsApp: +971 50 123 4567  [Message] [Call]    │
   │  📧 Email: ali@electronics.ae   [Send Email]        │
   │                                                      │
   │  Preferred: WhatsApp (fast replies)                 │
   │  Backup: +971 55 987 6543 (Ali's partner)           │
   │                                                      │
   │  ─────────────────────────────────────────────────  │
   │  📦 Brands: Apple, Samsung, Google                  │
   │  🕐 Delivers: 10 AM, 4 PM                           │
   │                                                      │
   │  💬 Send Order Request:                              │
   │  ┌─────────────────────┬─────────────────────┐      │
   │  │  📱 WhatsApp        │  📧 Email           │      │
   │  │  (Instant)          │  (With details)     │      │
   │  └─────────────────────┴─────────────────────┘      │
   │                                                      │
   └──────────────────────────────────────────────────────┘
   ```

3. **Contact Method Selection** (Simple toggle):
   ```
   Send order requests via:

   ┌─────────────────────────────────────────────────┐
   │  [📱 WhatsApp]     [ 📧 Email ]     [ Both ]   │
   │    ▲ Selected                                  │
   └─────────────────────────────────────────────────┘

   ☑ Also send email copy for records
   ```

4. **Email Templates**:
   ```
   Subject: Order Request - {date} - {count} items

   Hi {supplier_name},

   Please confirm availability for the following items:

   1. iPhone 15 Pro 256GB Black
      Order: #1234
      Needed by: Today 4 PM

   2. Samsung S24 Ultra 512GB
      Order: #1235
      Needed by: Today 4 PM

   Please reply with availability status.

   Thanks,
   {seller_name}
   {seller_business}
   ```

5. **Auto-Selection Logic**:
   - Urgent (< 2 hours): Use WhatsApp
   - Normal: Use preferred method
   - Batch orders (5+): Email recommended
   - After hours: Email (can be set per supplier)

**Acceptance Criteria**:
- [ ] Both WhatsApp and email stored per supplier
- [ ] User can choose contact method per message
- [ ] Preferred method saved and used by default
- [ ] Email templates are professional
- [ ] One-tap to switch methods
- [ ] Backup contacts available

**Test Cases**:
- [ ] Supplier with WhatsApp only → email field optional
- [ ] Choose email → sends email, not WhatsApp
- [ ] Choose "both" → sends to both
- [ ] Urgent order → suggests WhatsApp

---

## Summary

### Priority Order:

**P0 - Critical (Build First)**:
- TODO-019: Workflow Configuration
- TODO-020: Supplier Management
- TODO-021: Order Routing Engine
- TODO-032: Daily Operations Dashboard
- TODO-038: Real-Time Operations Overview

**P1 - High (Core Features)**:
- TODO-022: WhatsApp Integration Setup
- TODO-023: Supplier Order Messaging
- TODO-024: AI Reply Parser
- TODO-025: Unavailable Product Handling
- TODO-026: Customer Database
- TODO-033: Packing Workflow
- TODO-034: Shipping & Handoff
- TODO-035: Team Member Management
- TODO-036: Packer-Optimized Interface
- TODO-040: Multi-Channel Supplier Communication

**P2 - Medium (Enhancements)**:
- TODO-027: Repeat Customer Recognition
- TODO-028: Sales Trend Analysis
- TODO-029: Market Research Integration
- TODO-030: Price Optimization
- TODO-031: Workflow Efficiency Analyzer
- TODO-037: Customizable Workflow Rules
- TODO-039: Inventory Location Tracking

---

### UX Principles for Tech-Challenged Users:

**P0 - Critical (Build First)**:
- TODO-019: Workflow Configuration
- TODO-020: Supplier Management
- TODO-021: Order Routing Engine
- TODO-032: Daily Operations Dashboard

**P1 - High (Core Features)**:
- TODO-022: WhatsApp Integration Setup
- TODO-023: Supplier Order Messaging
- TODO-024: AI Reply Parser
- TODO-025: Unavailable Product Handling
- TODO-026: Customer Database
- TODO-033: Packing Workflow
- TODO-034: Shipping & Handoff

**P2 - Medium (Enhancements)**:
- TODO-027: Repeat Customer Recognition
- TODO-028: Sales Trend Analysis
- TODO-029: Market Research Integration
- TODO-030: Price Optimization
- TODO-031: Workflow Efficiency Analyzer

---

### UX Principles for Tech-Challenged Users:

1. **Maximum 3 taps to any action**
2. **Large touch targets (min 48px)**
3. **Clear visual hierarchy**
4. **No jargon - plain language**
5. **Always show "what's next"**
6. **Undo available for destructive actions**
7. **Mobile-first, works on cheap Android phones**
8. **Works offline where possible**
9. **WhatsApp-like familiarity**
10. **Zero training needed**
