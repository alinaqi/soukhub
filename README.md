# SoukHub

AI-powered order management platform for multi-channel marketplace sellers in the UAE and Middle East.

![SoukHub Dashboard](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)

## Overview

SoukHub unifies order management across multiple e-commerce marketplaces (Amazon UAE, Cartlow, Revibe) into a single AI-powered dashboard. Save hours every day with intelligent automation, bulk actions, and actionable insights.

### Key Features

- **Unified Dashboard** - View all orders from multiple marketplaces in one place
- **AI-Powered Assistant** - Natural language interface to manage orders and get insights
- **Bulk Actions** - Update multiple order statuses with a single click
- **Comprehensive Analytics** - Revenue trends, marketplace comparison, fulfillment metrics
- **Order Management** - Track shipments, process refunds, manage returns
- **Easy Data Import** - Import orders from CSV/TSV exports

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: [Anthropic Claude](https://anthropic.com/) with tool use
- **Charts**: [Recharts](https://recharts.org/)
- **Deployment**: [Vercel](https://vercel.com/)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/alinaqi/soukhub.git
   cd soukhub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # AI / LLM
   ANTHROPIC_API_KEY=your_anthropic_api_key

   # App Config
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**

   Push the database migrations to Supabase:
   ```bash
   npx supabase db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
soukhub/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── analytics/      # Analytics page
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── orders/         # Orders list
│   │   │   ├── products/       # Products catalog
│   │   │   └── import/         # Data import
│   │   ├── api/                # API routes
│   │   │   ├── chat/           # AI chat endpoint
│   │   │   └── orders/         # Order CRUD
│   │   ├── login/              # Authentication
│   │   ├── signup/             # Registration
│   │   └── onboarding/         # User onboarding
│   ├── components/             # React components
│   │   ├── analytics/          # Analytics charts
│   │   ├── chat/               # AI chat widget
│   │   ├── dashboard/          # Dashboard components
│   │   └── orders/             # Order management
│   ├── lib/                    # Utilities
│   │   ├── parsers/            # Marketplace data parsers
│   │   └── supabase/           # Supabase clients
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/             # Database migrations
└── scripts/                    # Utility scripts
```

## Features

### Dashboard

The main dashboard provides an overview of your business:
- Order statistics by status
- Revenue metrics
- Recent orders
- AI-powered suggestions
- Quick action buttons

### Orders Management

- View all orders across marketplaces
- Filter by status, marketplace, date
- Click any order to view details and update status
- Bulk status updates
- Track shipments with carrier and tracking numbers

### Analytics

Comprehensive analytics dashboard with:
- Revenue over time (area chart)
- Monthly performance comparison
- Revenue by marketplace (pie chart)
- Orders by status distribution
- Payment methods breakdown
- Fulfillment by marketplace
- Orders by day of week
- Top shipping destinations
- Time range filters (7d, 30d, 90d, 1y, all)

### AI Assistant

Natural language interface powered by Claude:
- "Show me pending orders"
- "Mark all shipped orders as delivered"
- "What's my return rate?"
- "Process refund for order #12345"

The AI can:
- Search and display orders
- Update order statuses
- Provide business insights
- Suggest actions to take

### Data Import

Import orders from marketplace exports:
- **Amazon**: TSV format from Seller Central
- **Cartlow**: CSV format from merchant portal
- **Revibe**: CSV format from seller dashboard

## Database Schema

### Main Tables

- **profiles** - User profiles and settings
- **marketplace_connections** - Connected marketplace accounts
- **products** - Product catalog
- **product_variants** - Product variants (SKUs)
- **orders** - All orders across marketplaces
- **order_items** - Line items for each order
- **inventory** - Stock levels
- **activity_log** - Activity and notifications

### Order Statuses

```
pending → confirmed → processing → ready_to_ship → shipped → out_for_delivery → delivered
                                                                              ↓
                                                                    returned / refunded
                      ↓
                  cancelled
```

## API Routes

### POST /api/chat
AI chat endpoint with tool use capabilities.

**Request:**
```json
{
  "messages": [{"role": "user", "content": "Show me pending orders"}],
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "response": "Found 5 pending orders...",
  "actions": [
    {
      "id": "bulk-ship-123",
      "label": "Mark 5 as Shipped",
      "type": "bulk_update",
      "data": {"orderIds": [...], "updates": {"status": "shipped"}}
    }
  ]
}
```

### GET /api/orders/[id]
Get order details.

### PATCH /api/orders/[id]
Update order status, tracking, notes.

**Request:**
```json
{
  "status": "shipped",
  "tracking_number": "1234567890",
  "carrier": "Aramex"
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
4. Deploy

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | No |

## Supported Marketplaces

| Marketplace | Region | Import Format | Status |
|-------------|--------|---------------|--------|
| Amazon | UAE | TSV | ✅ Supported |
| Cartlow | UAE | CSV | ✅ Supported |
| Revibe | Multi-region | CSV | ✅ Supported |
| Noon | UAE | CSV | 🚧 Coming Soon |

## Development

### Running Tests
```bash
npm run test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run type-check
```

### Building for Production
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, email support@soukhub.com or open an issue in the GitHub repository.

---

Built with ❤️ for UAE marketplace sellers
