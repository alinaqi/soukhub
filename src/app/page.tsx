import Link from 'next/link';

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI-Powered Assistant',
    description:
      'Get intelligent suggestions, automate order updates, and manage your business with natural language commands.',
  },
  {
    icon: '📊',
    title: 'Unified Dashboard',
    description:
      'View all your orders from Amazon, Cartlow, and Revibe in one place. No more switching between platforms.',
  },
  {
    icon: '⚡',
    title: 'Bulk Actions',
    description:
      'Update order statuses, process refunds, and manage shipments for multiple orders with a single click.',
  },
  {
    icon: '📈',
    title: 'Smart Analytics',
    description:
      'Track performance across marketplaces, identify trends, and get actionable insights to grow your business.',
  },
  {
    icon: '📦',
    title: 'Order Management',
    description:
      'Track shipments, manage returns and refunds, and keep customers updated - all from one interface.',
  },
  {
    icon: '🔄',
    title: 'Easy Data Import',
    description:
      'Import your order history from CSV/TSV exports. Support for Amazon, Cartlow, and Revibe formats.',
  },
];

const MARKETPLACES = [
  {
    name: 'Amazon UAE',
    logo: '📦',
    description: 'Full support for Amazon seller central exports',
    color: 'bg-orange-100 text-orange-700',
  },
  {
    name: 'Cartlow',
    logo: '🛒',
    description: 'FBS and FBC order management',
    color: 'bg-green-100 text-green-700',
  },
  {
    name: 'Revibe',
    logo: '📱',
    description: 'Multi-region order tracking',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'Noon',
    logo: '🌙',
    description: 'Coming soon',
    color: 'bg-yellow-100 text-yellow-700',
  },
];

const STEPS = [
  {
    step: '1',
    title: 'Create Account',
    description: 'Sign up in seconds with just your email. No credit card required.',
  },
  {
    step: '2',
    title: 'Import Orders',
    description: 'Upload your order exports from Amazon, Cartlow, or Revibe.',
  },
  {
    step: '3',
    title: 'Manage Everything',
    description: 'Use AI assistant and dashboard to manage all your orders in one place.',
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
              Manage All Your{' '}
              <span className="text-primary">Marketplace Orders</span>{' '}
              in One Place
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              SoukHub brings together Amazon, Cartlow, and Revibe orders into a single
              AI-powered dashboard. Save hours every day with intelligent automation.
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

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
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

      {/* Marketplaces Section */}
      <section className="py-24">
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

      {/* How It Works Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple setup process to get you up and running quickly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((item, index) => (
              <div key={item.step} className="text-center relative">
                {index < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Highlight */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 p-8 sm:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                  <span>🤖</span>
                  <span>Powered by AI</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Your AI Business Assistant
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Ask questions in plain English. Get instant answers and take action directly
                  from the chat. Process refunds, update order statuses, and get insights -
                  all with simple commands.
                </p>
                <ul className="space-y-3">
                  {[
                    'Show me pending orders that need attention',
                    'Mark all shipped orders as delivered',
                    'What should I focus on today?',
                    'Process refund for order #12345',
                  ].map((example) => (
                    <li key={example} className="flex items-center gap-3">
                      <span className="text-primary">→</span>
                      <span className="text-muted-foreground">&quot;{example}&quot;</span>
                    </li>
                  ))}
                </ul>
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
                        Show me pending orders
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
                        <p className="mb-2">Found 5 pending orders:</p>
                        <p className="text-sm text-muted-foreground">
                          • 3 from Amazon<br />
                          • 2 from Cartlow
                        </p>
                        <div className="mt-3 flex gap-2">
                          <span className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-lg">
                            Mark all as Shipped
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

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Simplify Your Multi-Channel Business?
          </h2>
          <p className="text-xl opacity-90 mb-10">
            Join sellers who are saving hours every day with SoukHub.
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
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/signup" className="hover:text-foreground">Get Started</Link></li>
                <li><Link href="/login" className="hover:text-foreground">Dashboard</Link></li>
                <li><span className="text-muted-foreground/50">API (Coming Soon)</span></li>
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
                <li><span className="text-muted-foreground/50">Documentation</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SoukHub. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
