import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | SoukHub',
  description: 'Terms of Service for SoukHub - AI-powered order management platform',
};

export default function TermsOfServicePage() {
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
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 27, 2024</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground mb-4">
              Welcome to SoukHub. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the SoukHub platform, including our website, APIs, and all related services (collectively, the &quot;Service&quot;).
            </p>
            <p className="text-muted-foreground">
              By accessing or using SoukHub, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground mb-4">
              SoukHub is an AI-powered order management platform designed for multi-channel marketplace sellers. Our Service includes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Order import and management from multiple marketplaces</li>
              <li>AI-powered assistant for business operations</li>
              <li>Supplier communication via WhatsApp and email</li>
              <li>Inventory and product management</li>
              <li>Packing and shipping workflow tools</li>
              <li>Customer intelligence and analytics</li>
              <li>Team collaboration features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Account Registration</h2>
            <p className="text-muted-foreground mb-4">To use SoukHub, you must:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Be at least 18 years old</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Be a legitimate business or authorized representative</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              You are responsible for maintaining the confidentiality of your password and for all activities that occur under your account, including actions by team members you invite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Acceptable Use</h2>
            <p className="text-muted-foreground mb-4">You agree NOT to use SoukHub to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Transmit malware, viruses, or harmful code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the Service</li>
              <li>Scrape or extract data beyond your own account data</li>
              <li>Use the Service for fraudulent or deceptive purposes</li>
              <li>Resell or redistribute the Service without authorization</li>
              <li>Send spam or unsolicited communications through our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Your Data</h2>

            <h3 className="text-lg font-medium mb-2">5.1 Ownership</h3>
            <p className="text-muted-foreground mb-4">
              You retain ownership of all data you upload or input into SoukHub, including orders, customer information, product data, and business records. We do not claim ownership of your data.
            </p>

            <h3 className="text-lg font-medium mb-2">5.2 License to Use</h3>
            <p className="text-muted-foreground mb-4">
              By using SoukHub, you grant us a limited license to process, store, and display your data solely for the purpose of providing and improving the Service.
            </p>

            <h3 className="text-lg font-medium mb-2">5.3 Data Accuracy</h3>
            <p className="text-muted-foreground">
              You are responsible for the accuracy and legality of the data you provide. You confirm that you have the right to upload customer and order data and that doing so does not violate any marketplace terms or privacy laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. AI Features</h2>
            <p className="text-muted-foreground mb-4">
              SoukHub uses artificial intelligence to provide features such as:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Natural language chat assistant</li>
              <li>Supplier reply parsing (English and Arabic)</li>
              <li>Smart product recommendations</li>
              <li>Automated customer messaging suggestions</li>
            </ul>
            <p className="text-muted-foreground">
              <strong>Important:</strong> AI-generated content and suggestions are provided as assistance only. You are responsible for reviewing and verifying all AI outputs before taking action. We do not guarantee the accuracy of AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Third-Party Integrations</h2>
            <p className="text-muted-foreground mb-4">
              SoukHub integrates with third-party services including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Marketplaces (Amazon, Cartlow, Revibe, etc.)</li>
              <li>WhatsApp for supplier messaging</li>
              <li>Email services</li>
            </ul>
            <p className="text-muted-foreground">
              Your use of these integrations is subject to the respective third-party terms of service. We are not responsible for the availability, accuracy, or policies of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Pricing and Payment</h2>

            <h3 className="text-lg font-medium mb-2">8.1 Free Tier</h3>
            <p className="text-muted-foreground mb-4">
              SoukHub may offer a free tier with limited features. Free tier availability and limits are subject to change.
            </p>

            <h3 className="text-lg font-medium mb-2">8.2 Paid Plans</h3>
            <p className="text-muted-foreground mb-4">
              Paid subscription plans are billed in advance on a monthly or annual basis. Prices are in AED unless otherwise specified.
            </p>

            <h3 className="text-lg font-medium mb-2">8.3 Cancellation</h3>
            <p className="text-muted-foreground">
              You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. We do not provide refunds for partial billing periods.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Intellectual Property</h2>
            <p className="text-muted-foreground mb-4">
              The SoukHub platform, including its design, code, features, and branding, is owned by SoukHub and protected by intellectual property laws. You may not:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Copy, modify, or distribute our software</li>
              <li>Reverse engineer or decompile our platform</li>
              <li>Use our trademarks without permission</li>
              <li>Create derivative works based on our Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground mb-4">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Warranties of merchantability or fitness for a particular purpose</li>
              <li>Warranties that the Service will be uninterrupted or error-free</li>
              <li>Warranties regarding the accuracy of AI-generated content</li>
              <li>Warranties regarding third-party integrations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SOUKHUB SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Damages arising from your use of third-party integrations</li>
              <li>Damages arising from AI-generated content or recommendations</li>
            </ul>
            <p className="text-muted-foreground">
              Our total liability for any claim shall not exceed the amount you paid for the Service in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">12. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold harmless SoukHub, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">13. Service Modifications</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, with or without notice. We are not liable to you or any third party for any modification, suspension, or discontinuance of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">14. Termination</h2>
            <p className="text-muted-foreground mb-4">
              We may terminate or suspend your account immediately, without prior notice, for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Violation of these Terms</li>
              <li>Suspected fraudulent or illegal activity</li>
              <li>Non-payment of fees</li>
              <li>At our sole discretion for any reason</li>
            </ul>
            <p className="text-muted-foreground">
              Upon termination, your right to use the Service will immediately cease. You may request an export of your data within 30 days of termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">15. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates. Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts of Dubai, UAE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">16. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting a notice on our website or sending you an email. Your continued use of the Service after changes take effect constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">17. Severability</h2>
            <p className="text-muted-foreground">
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">18. Contact Information</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, please contact us:
            </p>
            <ul className="list-none text-muted-foreground mt-4 space-y-2">
              <li><strong>Email:</strong> <a href="mailto:legal@soukhub.com" className="text-primary hover:underline">legal@soukhub.com</a></li>
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
