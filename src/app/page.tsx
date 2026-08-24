import Link from 'next/link';

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI-Powered Assistant',
    description:
      'Get intelligent suggestions, automate order updates, and manage your business with natural language commands.',
  },
  {
    icon: '📱',
    title: 'WhatsApp Integration',
    description:
      'Message suppliers directly via WhatsApp or email. AI understands their replies in English or Arabic.',
  },
  {
    icon: '📦',
    title: 'Smart Order Routing',
    description:
      'Automatically route orders to the right supplier based on brand and product rules you define.',
  },
  {
    icon: '📊',
    title: 'Sales Analytics',
    description:
      'Track hot products, identify slow movers, and get insights on revenue trends and top brands.',
  },
  {
    icon: '👥',
    title: 'Customer Intelligence',
    description:
      'Automatically detect repeat customers, generate thank-you notes, and create referral codes.',
  },
  {
    icon: '🚚',
    title: 'Packing & Shipping',
    description:
      'Streamlined packing station with keyboard shortcuts. Group shipments by marketplace or carrier.',
  },
  {
    icon: '👨‍👩‍👧‍👦',
    title: 'Team Management',
    description:
      'Invite packers and managers with role-based access. PIN login for shared warehouse devices.',
  },
  {
    icon: '⚠️',
    title: 'Unavailable Handling',
    description:
      'When suppliers say no, get options to try alternatives, offer substitutes, or cancel with customer messaging.',
  },
  {
    icon: '🔄',
    title: 'Easy Data Import',
    description:
      'Import your order history from CSV/TSV exports. Support for Amazon, Cartlow, and Revibe formats.',
  },
];

const WORKFLOW_FEATURES = [
  {
    step: '1',
    icon: '📥',
    title: 'Orders Come In',
    description: 'Import orders from Amazon, Cartlow, or Revibe via CSV upload.',
  },
  {
    step: '2',
    icon: '🔀',
    title: 'Auto-Route to Suppliers',
    description: 'Orders automatically assigned to suppliers based on your brand rules.',
  },
  {
    step: '3',
    icon: '📱',
    title: 'WhatsApp Suppliers',
    description: 'One-click messaging with templated order details. AI parses their replies.',
  },
  {
    step: '4',
    icon: '📦',
    title: 'Pack Orders',
    description: 'Keyboard-driven packing station. Scan, check, pack, print - all in seconds.',
  },
  {
    step: '5',
    icon: '🚚',
    title: 'Ship & Handoff',
    description: 'Group by marketplace/carrier. One-tap handoff to couriers.',
  },
  {
    step: '6',
    icon: '💝',
    title: 'Delight Customers',
    description: 'Auto-generated thank-you notes for repeat customers with referral codes.',
  },
];

const MARKETPLACES = [
  {
    name: 'Amazon UAE',
    logo: '📦',
    description: 'Full support for Amazon seller central exports',
    color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
  },
  {
    name: 'Cartlow',
    logo: '🛒',
    description: 'FBS and FBC order management',
    color: 'bg-green-500/20 text-green-600 dark:text-green-400',
  },
  {
    name: 'Revibe',
    logo: '📱',
    description: 'Multi-region order tracking',
    color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  },
  {
    name: 'Noon',
    logo: '🌙',
    description: 'Coming soon',
    color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  },
];

const AI_CAPABILITIES = [
  {
    title: 'Supplier Reply Parser',
    description: 'Understands "yes", "موجود", "no stock", alternatives, and partial confirmations.',
    example: '"First two yes, third no" → Updates each order correctly',
  },
  {
    title: 'Natural Language Commands',
    description: 'Ask questions and take actions in plain English.',
    example: '"Show pending orders that need attention"',
  },
  {
    title: 'Smart Recommendations',
    description: 'Get suggestions on what to stock, when to reorder, and which suppliers are reliable.',
    example: 'iPhone 15 Pro is hot - consider stocking more',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏪</span>
              <span className="text-xl font-bold">SoukHub</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">
                Features
              </a>
              <a href="#workflow" className="text-sm text-muted-foreground hover:text-foreground">
                How it Works
              </a>
              <a href="#ai" className="text-sm text-muted-foreground hover:text-foreground">
                AI Power
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8">
              <span>🚀</span>
              <span>Built for UAE Marketplace Sellers</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Your Complete{' '}
              <span className="text-primary">Order-to-Delivery</span>{' '}
              Command Center
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              From order import to supplier messaging to packing and shipping - SoukHub manages
              your entire fulfillment workflow with AI-powered automation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
              >
                Start Free Trial
                <span>→</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-8 py-4 text-lg font-semibold hover:bg-muted transition-colors"
              >
                Log In
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • Free for small sellers
            </p>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: '3+', label: 'Marketplaces' },
              { value: '10k+', label: 'Orders Managed' },
              { value: '50%', label: 'Time Saved' },
              { value: '24/7', label: 'AI Assistant' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Workflow Section */}
      <section id="workflow" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 mb-4">
              <span>🔄</span>
              <span>Complete Workflow</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              From Order to Delivery, Fully Automated
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every step of your fulfillment process, streamlined and connected.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WORKFLOW_FEATURES.map((item) => (
              <div
                key={item.step}
                className="relative rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Scale Your Business
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed specifically for multi-channel sellers in the UAE and Middle East.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section id="ai" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 p-8 sm:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                  <span>🤖</span>
                  <span>Powered by Claude AI</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  AI That Actually Understands Your Business
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Not just a chatbot - a real AI assistant that understands supplier replies in Arabic and English,
                  parses availability, and takes action automatically.
                </p>

                <div className="space-y-6">
                  {AI_CAPABILITIES.map((cap) => (
                    <div key={cap.title} className="bg-card/50 rounded-lg p-4 border border-border">
                      <h4 className="font-semibold mb-1">{cap.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{cap.description}</p>
                      <div className="text-sm bg-muted rounded px-3 py-1.5 inline-block">
                        <code>{cap.example}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="rounded-xl bg-card border border-border p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xl">🤖</span>
                    </div>
                    <div>
                      <div className="font-semibold">SoukHub AI</div>
                      <div className="text-xs text-muted-foreground">Your marketplace assistant</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                        Supplier replied &ldquo;first two yes, third خلص&rdquo;
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-2 max-w-[85%]">
                        <p className="mb-2">✅ Understood! Updating orders:</p>
                        <div className="text-sm space-y-1">
                          <p>• Order #1234 → <span className="text-green-600">Confirmed</span></p>
                          <p>• Order #1235 → <span className="text-green-600">Confirmed</span></p>
                          <p>• Order #1236 → <span className="text-red-600">Unavailable</span></p>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <span className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-lg">
                            Handle Unavailable
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Integration Feature */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 mb-6">
                <span>📱</span>
                <span>WhatsApp + Email</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Message Suppliers Your Way
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Choose WhatsApp for instant messaging or email for detailed records.
                Templates auto-fill with order details. One click to send.
              </p>
              <ul className="space-y-4">
                {[
                  'Pre-filled message templates with order details',
                  'Support for both WhatsApp and email',
                  'Batch messaging for multiple orders to same supplier',
                  'Message history tracked per supplier',
                  'AI parses replies in English and Arabic',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 p-4 rounded-lg border-2 border-green-500 bg-green-500/10 text-center">
                    <div className="text-3xl mb-2">📱</div>
                    <div className="font-medium text-foreground">WhatsApp</div>
                    <div className="text-xs text-muted-foreground">Instant</div>
                  </div>
                  <div className="flex-1 p-4 rounded-lg border-2 border-border bg-muted text-center">
                    <div className="text-3xl mb-2">📧</div>
                    <div className="font-medium text-foreground">Email</div>
                    <div className="text-xs text-muted-foreground">With records</div>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">Preview:</p>
                  <p className="text-muted-foreground">
                    Hi Ali Electronics,<br /><br />
                    New order request:<br />
                    • iPhone 15 Pro 256GB Black x1<br /><br />
                    Order: #AMZ-12345<br />
                    Customer: Dubai, Al Barsha<br /><br />
                    Please confirm availability. Thanks!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packing & Shipping Feature */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="text-center mb-4">
                  <div className="text-sm text-muted-foreground">PACKING STATION</div>
                  <div className="text-xl font-bold">Order #AMZ-12345</div>
                </div>
                <div className="bg-muted rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span>📱 iPhone 15 Pro 256GB Black</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Customer: Ahmed, Dubai</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-green-500/20 text-green-600 dark:text-green-400 rounded p-2 text-center font-medium">
                    [P] Packed
                  </div>
                  <div className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded p-2 text-center">
                    [I] Issue
                  </div>
                  <div className="bg-muted text-muted-foreground rounded p-2 text-center">
                    [S] Skip
                  </div>
                </div>
                <div className="text-xs text-center text-muted-foreground mt-4">
                  Press P or Enter to mark packed
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 mb-6">
                <span>📦</span>
                <span>Packer-Optimized</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Packing Station Built for Speed
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Your team processes 100+ orders a day. Our packing interface is
                keyboard-first, barcode-ready, and designed for zero-fatigue operation.
              </p>
              <ul className="space-y-4">
                {[
                  'Keyboard shortcuts: P=Packed, Enter=Next, L=Print Label',
                  'Barcode scanner support with mismatch alerts',
                  'Auto-advance to next order after packing',
                  'Issue reporting with one keystroke',
                  'Works on tablets and cheap Android devices',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Intelligence */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-4 py-1.5 text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-6">
                <span>⭐</span>
                <span>Customer Intelligence</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Know Your Customers, Delight Repeat Buyers
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Automatically identify VIP and repeat customers. Generate personalized
                thank-you notes. Create referral codes to drive more sales.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">5+</div>
                  <div className="text-xs text-muted-foreground">Orders = VIP</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">2+</div>
                  <div className="text-xs text-muted-foreground">Orders = Repeat</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">10%</div>
                  <div className="text-xs text-muted-foreground">Referral Discount</div>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  'Auto-detect repeat customers by email, phone, or name',
                  'VIP badges shown on order cards',
                  'Personalized thank-you note generator',
                  'One-click referral code creation',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-yellow-600 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-xl border border-yellow-500/30 p-6">
              <div className="text-center mb-4">
                <span className="text-4xl">⭐ VIP Customer ⭐</span>
              </div>
              <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                <p className="text-sm whitespace-pre-line text-foreground">
                  Hi Ahmed!{'\n\n'}
                  Thank you for being one of our most valued customers!
                  This is your 5th order with us, and we truly appreciate your continued trust.{'\n\n'}
                  Your iPhone 15 Pro is on its way!{'\n'}
                  Order: #AMZ-12345{'\n\n'}
                  As a VIP customer, you&apos;re always our priority. Here&apos;s a special discount for your next purchase:{'\n\n'}
                  Code: AHMED10 (10% off){'\n\n'}
                  Best regards,{'\n'}
                  Your Mobile Store Team
                </p>
              </div>
              <div className="flex gap-2 mt-4 justify-center">
                <button className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg">
                  Print Note
                </button>
                <button className="px-4 py-2 text-sm border border-yellow-500/50 text-foreground rounded-lg hover:bg-yellow-500/10">
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplaces Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Supported Marketplaces
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect all your selling channels and manage orders from a single dashboard.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MARKETPLACES.map((marketplace) => (
              <div
                key={marketplace.name}
                className="rounded-xl border border-border bg-card p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-5xl mb-4">{marketplace.logo}</div>
                <div
                  className={`inline-block rounded-full px-3 py-1 text-sm font-medium mb-3 ${marketplace.color}`}
                >
                  {marketplace.name}
                </div>
                <p className="text-sm text-muted-foreground">{marketplace.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Preview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 mb-4">
              <span>📊</span>
              <span>Sales Analytics</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Know What&apos;s Selling, What&apos;s Not
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track hot products, identify slow movers, and understand your revenue trends at a glance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span>🔥</span> Hot Products
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>iPhone 15 Pro Max</span>
                  <span className="text-green-600">↑ 45%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Samsung S24 Ultra</span>
                  <span className="text-green-600">↑ 32%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>AirPods Pro 2</span>
                  <span className="text-green-600">↑ 28%</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span>📈</span> Revenue Trend
              </h3>
              <div className="text-3xl font-bold mb-2">AED 45,230</div>
              <div className="text-sm text-green-600">↑ 23% vs last week</div>
              <div className="mt-4 h-16 flex items-end gap-1">
                {[40, 55, 35, 70, 60, 80, 90].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/70 rounded-t"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span>🏆</span> Top Brands
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Apple</span>
                  <span className="font-medium">AED 28,500</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Samsung</span>
                  <span className="font-medium">AED 12,300</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Google</span>
                  <span className="font-medium">AED 4,430</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your Fulfillment?
          </h2>
          <p className="text-xl opacity-90 mb-10">
            Join sellers who are saving hours every day with SoukHub&apos;s complete
            order-to-delivery automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-primary px-8 py-4 text-lg font-semibold hover:bg-white/90 transition-colors"
            >
              Get Started Free
              <span>→</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-8 py-4 text-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Log In to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🏪</span>
                <span className="text-xl font-bold">SoukHub</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered order management for multi-channel marketplace sellers in the UAE and Middle East.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Order Management</li>
                <li>Supplier Messaging</li>
                <li>Packing Station</li>
                <li>Customer Intelligence</li>
                <li>Sales Analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Marketplaces</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Amazon UAE</li>
                <li>Cartlow</li>
                <li>Revibe</li>
                <li>Noon (Coming Soon)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:support@soukhub.com" className="hover:text-foreground">Contact Us</a></li>
                <li><Link href="/login" className="hover:text-foreground">Dashboard</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SoukHub. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
