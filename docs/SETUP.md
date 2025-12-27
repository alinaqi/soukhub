# Setup Guide

This guide walks you through setting up SoukHub for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0 or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

You'll also need accounts for:

- **Supabase** - Database and authentication ([Sign up](https://supabase.com/))
- **Anthropic** - AI capabilities ([Sign up](https://console.anthropic.com/))

## Step 1: Clone the Repository

```bash
git clone https://github.com/alinaqi/soukhub.git
cd soukhub
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 16
- React 19
- Tailwind CSS v4
- Supabase client
- Anthropic SDK
- Recharts

## Step 3: Set Up Supabase

### Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Enter project details:
   - Name: `soukhub`
   - Database Password: (save this securely)
   - Region: Choose closest to your users
4. Click "Create new project"

### Get API Keys

1. Go to Project Settings → API
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Run Database Migrations

Install Supabase CLI if you haven't:

```bash
npm install -g supabase
```

Link your project:

```bash
supabase link --project-ref your-project-ref
```

Push migrations:

```bash
supabase db push
```

This creates all necessary tables:
- profiles
- marketplace_connections
- products
- product_variants
- orders
- order_items
- inventory
- activity_log

## Step 4: Get Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an API key
3. Copy the key → `ANTHROPIC_API_KEY`

## Step 5: Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI / LLM
ANTHROPIC_API_KEY=sk-ant-api03-...

# App Config (optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 6: Run the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Step 7: Create a Test User

1. Go to [http://localhost:3000/signup](http://localhost:3000/signup)
2. Enter your email and password
3. Complete the onboarding flow

## Step 8: Import Test Data (Optional)

If you have marketplace export files, you can import them:

1. Go to Dashboard → Import Data
2. Select your marketplace (Amazon, Cartlow, or Revibe)
3. Upload your CSV/TSV file
4. Review and confirm import

## Troubleshooting

### "Supabase URL and Key are required"

Make sure your `.env.local` file exists and contains the correct values. Restart the dev server after making changes.

### Database connection errors

1. Check that your Supabase project is active
2. Verify the URL and keys are correct
3. Ensure migrations have been run

### AI chat not working

1. Verify your Anthropic API key is valid
2. Check the browser console for errors
3. Ensure the API key is in `.env.local`

### Build errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild
npm run build
```

## Next Steps

- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Data Import Guide](./IMPORT.md)
