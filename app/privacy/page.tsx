import Link from 'next/link';
import { Bot, Calendar, Mail, Shield, Eye, Database, Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-cyber-400" />
              <span className="text-xl font-heading font-bold gradient-text">Agent Empire</span>
            </Link>
            <Link href="/signup" className="btn-cyber">
              Get Started
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="prose prose-invert max-w-none">
          <h1 className="heading-1 gradient-text mb-8">Privacy Policy</h1>
          
          <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Effective Date: January 1, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>Contact: privacy@agent-empire.com</span>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="card-cyber p-4 text-center">
              <Shield className="w-8 h-8 text-cyber-400 mx-auto mb-2" />
              <div className="text-sm font-medium">GDPR Compliant</div>
            </div>
            <div className="card-cyber p-4 text-center">
              <Lock className="w-8 h-8 text-cyber-400 mx-auto mb-2" />
              <div className="text-sm font-medium">End-to-End Encryption</div>
            </div>
            <div className="card-cyber p-4 text-center">
              <Database className="w-8 h-8 text-cyber-400 mx-auto mb-2" />
              <div className="text-sm font-medium">Secure Data Storage</div>
            </div>
            <div className="card-cyber p-4 text-center">
              <Eye className="w-8 h-8 text-cyber-400 mx-auto mb-2" />
              <div className="text-sm font-medium">Full Transparency</div>
            </div>
          </div>

          <div className="card-cyber p-8 space-y-8">
            <section>
              <h2 className="heading-3 mb-4">1. Information We Collect</h2>
              
              <h3 className="text-lg font-semibold mb-2">Account Information</h3>
              <p className="text-muted-foreground mb-4">
                When you create an account, we collect:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
                <li>Email address and name</li>
                <li>Password (encrypted and never stored in plain text)</li>
                <li>Profile information you choose to provide</li>
                <li>OAuth account information (Google, GitHub) if you choose to connect</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2">AI Agent Data</h3>
              <p className="text-muted-foreground mb-4">
                To provide our service, we collect:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
                <li>AI agent configurations and settings</li>
                <li>Trading performance and transaction history</li>
                <li>Social media posts and engagement metrics</li>
                <li>Task automation logs and results</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2">Usage Data</h3>
              <p className="text-muted-foreground mb-4">
                We automatically collect:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
                <li>Pages visited and time spent on the platform</li>
                <li>Feature usage and interaction patterns</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-3 mb-4">2. How We Use Your Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-background/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Service Provision</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                    <li>Operating and maintaining AI agents</li>
                    <li>Processing transactions and payments</li>
                    <li>Providing customer support</li>
                    <li>Monitoring system performance</li>
                  </ul>
                </div>
                
                <div className="bg-background/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Improvement & Analytics</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                    <li>Analyzing usage patterns</li>
                    <li>Improving AI algorithms</li>
                    <li>Developing new features</li>
                    <li>Preventing fraud and abuse</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-yellow-400">Important: Financial Data</h3>
                <p className="text-muted-foreground text-sm">
                  We never store your private keys, seed phrases, or wallet passwords. 
                  All cryptocurrency transactions are processed through secure, encrypted connections 
                  to external exchanges and wallets.
                </p>
              </div>
            </section>

            <section>
              <h2 className="heading-3 mb-4">3. Information Sharing and Disclosure</h2>
              
              <h3 className="text-lg font-semibold mb-2">We Share Information With:</h3>
              <div className="space-y-4 mb-6">
                <div className="bg-background/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Third-Party Services</h4>
                  <p className="text-muted-foreground text-sm mb-2">
                    We integrate with external services to provide functionality:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                    <li>Cryptocurrency exchanges (for trading)</li>
                    <li>Social media platforms (for posting)</li>
                    <li>AI model providers (OpenAI, Anthropic)</li>
                    <li>Payment processors (for subscriptions)</li>
                  </ul>
                </div>
                
                <div className="bg-background/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Legal Requirements</h4>
                  <p className="text-muted-foreground text-sm">
                    We may disclose information when required by law, to protect our rights, 
                    or in response to valid legal requests from authorities.
                  </p>
                </div>
              </div>

              <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-red-400">We Never:</h3>
                <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                  <li>Sell your personal information to third parties</li>
                  <li>Share trading strategies or performance data publicly</li>
                  <li>Provide access to your AI agents without permission</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="heading-3 mb-4">4. Data Security and Protection</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-background/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Encryption</h3>
                  <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                    <li>AES-256 encryption for data at rest</li>
                    <li>TLS 1.3 for data in transit</li>
                    <li>End-to-end encryption for sensitive data</li>
                    <li>Encrypted database backups</li>
                  </ul>
                </div>
                
                <div className="bg-background/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Access Controls</h3>
                  <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                    <li>Multi-factor authentication</li>
                    <li>Role-based access permissions</li>
                    <li>Regular security audits</li>
                    <li>Employee background checks</li>
                  </ul>
                </div>
              </div>

              <p className="text-muted-foreground text-sm">
                While we implement industry-standard security measures, no system is 100% secure. 
                We encourage users to follow security best practices and report any suspicious activity.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-4">5. Your Privacy Rights</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="bg-background/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Access & Portability</h3>
                    <p className="text-muted-foreground text-sm">
                      Request a copy of your personal data and export your AI agent configurations 
                      in a machine-readable format.
                    </p>
                  </div>
                  
                  <div className="bg-background/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Rectification</h3>
                    <p className="text-muted-foreground text-sm">
                      Update or correct any inaccurate personal information in your account settings 
                      or by contacting support.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-background/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Deletion</h3>
                    <p className="text-muted-foreground text-sm">
                      Request deletion of your account and personal data. Some data may be retained 
                      for legal or security purposes.
                    </p>
                  </div>
                  
                  <div className="bg-background/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Opt-Out</h3>
                    <p className="text-muted-foreground text-sm">
                      Withdraw consent for data processing, opt out of marketing communications, 
                      or request processing restrictions.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground text-sm">
                To exercise these rights, contact us at{' '}
                <Link href="mailto:privacy@agent-empire.com" className="text-cyber-400 hover:text-cyber-300 underline">
                  privacy@agent-empire.com
                </Link>{' '}
                or use the privacy controls in your account settings.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-4">6. Cookies and Tracking</h2>
              
              <div className="space-y-4 mb-6">
                <div className="bg-background/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Essential Cookies</h3>
                  <p className="text-muted-foreground text-sm">
                    Required for authentication, security, and basic functionality. 
                    These cannot be disabled.
                  </p>
                </div>
                
                <div className="bg-background/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Analytics Cookies</h3>
                  <p className="text-muted-foreground text-sm">
                    Help us understand how users interact with our platform to improve the experience. 
                    These can be disabled in your preferences.
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground text-sm">
                You can manage cookie preferences in your browser settings or through our 
                cookie banner when you first visit the site.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-4">7. International Data Transfers</h2>
              <p className="text-muted-foreground mb-4">
                Agent Empire is based in the United States. If you are accessing our service 
                from outside the US, your information may be transferred to, stored, and processed 
                in the United States.
              </p>
              <p className="text-muted-foreground">
                We implement appropriate safeguards to ensure your data remains protected according 
                to this privacy policy, regardless of location.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-4">8. Changes to This Policy</h2>
              <p className="text-muted-foreground mb-4">
                We may update this privacy policy from time to time. We will notify you of 
                significant changes by:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Email notification to your registered address</li>
                <li>Prominent notice on our website</li>
                <li>In-app notification when you next log in</li>
              </ul>
              <p className="text-muted-foreground">
                Continued use of the service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions about this privacy policy or our data practices:
              </p>
              <div className="bg-background/50 p-4 rounded-lg">
                <p className="text-muted-foreground">
                  <strong>Privacy Officer:</strong> privacy@agent-empire.com<br />
                  <strong>General Contact:</strong> support@agent-empire.com<br />
                  <strong>Address:</strong> Agent Empire, Inc.<br />
                  1234 Innovation Drive<br />
                  San Francisco, CA 94105<br />
                  United States
                </p>
              </div>
            </section>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground mb-6">
              Your privacy is important to us. We're committed to protecting your data 
              and being transparent about our practices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-cyber text-lg px-8 py-4">
                I Understand - Get Started
              </Link>
              <Link href="/terms" className="btn-outline text-lg px-8 py-4">
                View Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}