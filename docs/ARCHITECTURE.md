# Architecture Overview

This document describes the technical architecture of SoukHub.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Next.js   │  │   React     │  │     Tailwind CSS        │  │
│  │  App Router │  │ Components  │  │       Styling           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Server                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Server    │  │    API      │  │      Middleware         │  │
│  │ Components  │  │   Routes    │  │   (Auth, Redirect)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│       Supabase          │    │      Anthropic          │
│  ┌─────────────────┐    │    │  ┌─────────────────┐    │
│  │   PostgreSQL    │    │    │  │   Claude API    │    │
│  │    Database     │    │    │  │   (Tool Use)    │    │
│  └─────────────────┘    │    │  └─────────────────┘    │
│  ┌─────────────────┐    │    └─────────────────────────┘
│  │  Authentication │    │
│  │   (Supabase     │    │
│  │     Auth)       │    │
│  └─────────────────┘    │
│  ┌─────────────────┐    │
│  │  Row Level      │    │
│  │   Security      │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

## Application Layers

### 1. Presentation Layer

**Next.js App Router** handles routing and page rendering:

```
src/app/
├── (dashboard)/          # Protected routes (requires auth)
│   ├── layout.tsx        # Dashboard layout with sidebar
│   ├── dashboard/        # Main dashboard page
│   ├── orders/           # Orders list
│   ├── analytics/        # Analytics dashboard
│   ├── products/         # Product catalog
│   └── import/           # Data import
├── api/                  # API endpoints
├── login/                # Public login page
├── signup/               # Public signup page
└── page.tsx              # Landing page
```

**React Components** are organized by feature:

```
src/components/
├── analytics/            # Charts and metrics
│   └── AnalyticsDashboard.tsx
├── chat/                 # AI chat widget
│   ├── AIChatWidget.tsx
│   └── AIChatWrapper.tsx
├── dashboard/            # Dashboard UI
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── OrdersTable.tsx
│   └── Insights.tsx
└── orders/               # Order management
    └── OrderDetailModal.tsx
```

### 2. API Layer

**API Routes** handle server-side logic:

```
src/app/api/
├── chat/
│   └── route.ts          # AI chat with Claude
└── orders/
    └── [id]/
        └── route.ts      # Order CRUD operations
```

**Chat API** uses Claude with tool use:

```typescript
const tools = [
  { name: 'get_order_stats', ... },
  { name: 'search_orders', ... },
  { name: 'update_order_status', ... },
  { name: 'get_order_details', ... },
  { name: 'get_suggestions', ... },
];
```

### 3. Data Layer

**Supabase Client** configurations:

```
src/lib/supabase/
├── client.ts             # Browser client
├── server.ts             # Server-side client
└── middleware.ts         # Auth middleware
```

**Database Schema** (PostgreSQL):

```sql
-- Core tables
profiles              -- User profiles
marketplace_connections -- Connected accounts
products              -- Product catalog
product_variants      -- SKU variants
orders                -- All orders
order_items           -- Line items
inventory             -- Stock levels
activity_log          -- Activity feed
```

### 4. Business Logic

**Data Parsers** for marketplace imports:

```
src/lib/parsers/
├── amazon.ts             # Amazon TSV parser
├── cartlow.ts            # Cartlow CSV parser
└── revibe.ts             # Revibe CSV parser
```

## Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Login   │────▶│ Supabase │────▶│ Session  │────▶│Dashboard │
│   Page   │     │   Auth   │     │  Cookie  │     │  Access  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │
                                        ▼
                                 ┌──────────┐
                                 │Middleware│
                                 │  Check   │
                                 └──────────┘
```

1. User submits credentials on login page
2. Supabase Auth validates and creates session
3. Session token stored in HTTP-only cookie
4. Middleware checks session on protected routes
5. Invalid/expired sessions redirect to login

## Data Flow

### Order Import Flow

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│   Upload   │────▶│   Parse    │────▶│  Validate  │────▶│   Insert   │
│    File    │     │   Format   │     │    Data    │     │  Database  │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
      │                  │                  │                  │
      ▼                  ▼                  ▼                  ▼
   CSV/TSV          Marketplace        Schema Check        Supabase
    File             Parser           Type Safety           Insert
```

### AI Chat Flow

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│   User     │────▶│   Chat     │────▶│   Claude   │────▶│   Tool     │
│  Message   │     │    API     │     │    API     │     │   Calls    │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
                                                               │
                                                               ▼
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Display   │◀────│  Generate  │◀────│  Process   │◀────│  Execute   │
│  Response  │     │  Actions   │     │  Results   │     │   Tools    │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
```

## Security

### Row Level Security (RLS)

All database tables use RLS policies:

```sql
-- Users can only see their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own orders
CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);
```

### Authentication

- Session-based authentication via Supabase Auth
- HTTP-only cookies for session tokens
- Middleware protection for dashboard routes
- API routes verify session before processing

### API Security

- Service role key used only server-side
- Anon key exposed to client (safe with RLS)
- Rate limiting on AI endpoints
- Input validation on all endpoints

## Performance

### Caching

- Static pages pre-rendered at build time
- Dynamic pages cached with ISR
- Supabase query caching

### Optimization

- React Server Components for initial load
- Client components for interactivity
- Code splitting per route
- Image optimization via Next.js

## Deployment

### Vercel Configuration

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

### Environment Variables

```
NEXT_PUBLIC_*      → Exposed to browser
SUPABASE_*         → Server-side only
ANTHROPIC_*        → Server-side only
```

## Monitoring

### Error Tracking

- Console logging for development
- Vercel logs for production
- API error responses with details

### Analytics

- Built-in analytics dashboard
- Order metrics tracked in database
- Performance metrics via Vercel
