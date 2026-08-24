import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | SoukHub',
  description: 'Privacy Policy for SoukHub - AI-powered order management platform',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80">
            <span className="text-2xl">🏪</span>
            <span className="text-xl font-bold">SoukHub</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 27, 2024</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground mb-4">
              SoukHub (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered order management platform.
            </p>
            <p className="text-muted-foreground">
              By using SoukHub, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-medium mb-2">2.1 Account Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Name and email address</li>
              <li>Business name and contact information</li>
              <li>Password (encrypted)</li>
              <li>Team member information (names, emails, roles)</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">2.2 Business Data</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Order information imported from your marketplaces (Amazon, Cartlow, Revibe, etc.)</li>
              <li>Customer data from your orders (names, addresses, phone numbers)</li>
              <li>Product and inventory information</li>
              <li>Supplier information and communication history</li>
              <li>Sales and analytics data</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">2.3 Usage Data</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Log data (IP address, browser type, pages visited)</li>
              <li>Device information</li>
              <li>Feature usage patterns</li>
              <li>AI chat interactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use the collected information for:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Service Delivery:</strong> Processing orders, managing inventory, and facilitating supplier communications</li>
              <li><strong>AI Features:</strong> Powering our AI assistant, natural language parsing, and smart recommendations</li>
              <li><strong>Analytics:</strong> Generating sales insights, customer intelligence, and business reports</li>
              <li><strong>Communication:</strong> Sending WhatsApp messages and emails to suppliers on your behalf</li>
              <li><strong>Improvement:</strong> Enhancing our platform features and user experience</li>
              <li><strong>Security:</strong> Protecting against unauthorized access and fraud</li>
              <li><strong>Legal Compliance:</strong> Meeting regulatory requirements in the UAE and applicable jurisdictions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground mb-4">We do not sell your personal data. We may share information with:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Service Providers:</strong> Third-party services that help us operate (Supabase for database, Vercel for hosting, Anthropic for AI)</li>
              <li><strong>Communication Partners:</strong> WhatsApp and email services when you send messages to suppliers</li>
              <li><strong>Your Team:</strong> Other team members you invite to your SoukHub account</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground mb-4">We implement appropriate security measures including:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Encryption of data at rest</li>
              <li>Row-level security in our database</li>
              <li>Secure authentication with Supabase Auth</li>
              <li>Regular security audits</li>
              <li>Access controls and audit logging</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as your account is active or as needed to provide services. You can request deletion of your account and associated data at any time. Some data may be retained for legal or legitimate business purposes (e.g., transaction records for accounting).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Export your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your data</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, contact us at <a href="mailto:privacy@soukhub.com" className="text-primary hover:underline">privacy@soukhub.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Third-Party Services</h2>
            <p className="text-muted-foreground mb-4">Our platform integrates with:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Supabase:</strong> Database and authentication (<a href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>)</li>
              <li><strong>Vercel:</strong> Hosting and deployment (<a href="https://vercel.com/legal/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>)</li>
              <li><strong>Anthropic (Claude):</strong> AI assistant (<a href="https://www.anthropic.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>)</li>
              <li><strong>WhatsApp:</strong> Supplier messaging (via wa.me links)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Cookies</h2>
            <p className="text-muted-foreground">
              We use essential cookies for authentication and session management. We do not use tracking cookies or third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. International Data Transfers</h2>
            <p className="text-muted-foreground">
              Your data may be processed in countries outside the UAE where our service providers operate. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground">
              SoukHub is a business platform not intended for use by individuals under 18 years of age. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">12. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. Continued use of our services after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">13. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-none text-muted-foreground mt-4 space-y-2">
              <li><strong>Email:</strong> <a href="mailto:privacy@soukhub.com" className="text-primary hover:underline">privacy@soukhub.com</a></li>
              <li><strong>Support:</strong> <a href="mailto:support@soukhub.com" className="text-primary hover:underline">support@soukhub.com</a></li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/" className="text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
