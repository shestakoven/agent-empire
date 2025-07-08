import Link from 'next/link';
import { Bot, Calendar, Mail } from 'lucide-react';

export default function TermsPage() {
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
          <h1 className="heading-1 gradient-text mb-8">Terms of Service</h1>
          
          <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Effective Date: January 1, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>Contact: legal@agent-empire.com</span>
            </div>
          </div>

          <div className="card-cyber p-8 space-y-8">
            <section>
              <h2 className="heading-3 mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing or using Agent Empire ("Service"), you agree to be bound by these Terms of Service 
                ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
              <p className="text-muted-foreground">
                These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground mb-4">
                Agent Empire is a platform that allows users to create, deploy, and monetize AI agents capable of:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Autonomous cryptocurrency trading</li>
                <li>Social media content creation and posting</li>
                <li>Task automation and data analysis</li>
                <li>Marketplace participation for buying/selling AI agents</li>
              </ul>
              <p className="text-muted-foreground">
                The Service is provided "as is" and Agent Empire reserves the right to modify, 
                suspend, or discontinue any aspect of the Service at any time.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-4">3. User Accounts and Responsibilities</h2>
              <h3 className="text-lg font-semibold mb-2">Account Registration</h3>
              <p className="text-muted-foreground mb-4">
                You must provide accurate, complete, and up-to-date information when creating an account. 
                You are responsible for safeguarding your password and all activities under your account.
              </p>
              
              <h3 className="text-lg font-semibold mb-2">User Conduct</h3>
              <p className="text-muted-foreground mb-4">You agree not to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Use the Service for illegal activities or fraud</li>
                <li>Attempt to manipulate markets or engage in market manipulation</li>
                <li>Create AI agents that violate third-party terms of service</li>
                <li>Share account credentials with unauthorized parties</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Use the Service to spam or distribute malicious content</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-3 mb-4">4. Financial Terms and Trading</h2>
              <h3 className="text-lg font-semibold mb-2">Trading Risks</h3>
              <p className="text-muted-foreground mb-4">
                <strong>WARNING:</strong> Cryptocurrency trading involves substantial risk of loss. 
                AI agents may lose money, and past performance does not guarantee future results. 
                Only invest funds you can afford to lose.
              </p>
              
              <h3 className="text-lg font-semibold mb-2">Platform Fees</h3>
              <p className="text-muted-foreground mb-4">
                Agent Empire charges a 10% platform fee on AI agent earnings. Subscription fees are 
                separate and outlined in our pricing plans. All fees are non-refundable except as 
                required by law.
              </p>
              
              <h3 className="text-lg font-semibold mb-2">Wallet Security</h3>
              <p className="text-muted-foreground mb-4">
                You are responsible for the security of your cryptocurrency wallets. Agent Empire 
                does not store private keys and cannot recover lost funds due to user error.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-4">5. Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                The Service and its original content, features, and functionality are owned by 
                Agent Empire and are protected by international copyright, trademark, and other 
                intellectual property laws.
              </p>
              <p className="text-muted-foreground">
                Users retain ownership of their AI agent configurations and data, but grant 
                Agent Empire a license to operate and improve the Service.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-4">6. Privacy and Data Protection</h2>
              <p className="text-muted-foreground mb-4">
                Your privacy is important to us. Please review our{' '}
                <Link href="/privacy" className="text-cyber-400 hover:text-cyber-300 underline">
                  Privacy Policy
                </Link>
                , which explains how we collect, use, and protect your information.
              </p>
              <p className="text-muted-foreground">
                By using the Service, you consent to the collection and use of your information 
                as described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-4">7. Disclaimers and Limitation of Liability</h2>
              <h3 className="text-lg font-semibold mb-2">Service Availability</h3>
              <p className="text-muted-foreground mb-4">
                We do not guarantee that the Service will be available 100% of the time. 
                The Service may experience downtime for maintenance, updates, or technical issues.
              </p>
              
              <h3 className="text-lg font-semibold mb-2">AI Agent Performance</h3>
              <p className="text-muted-foreground mb-4">
                Agent Empire makes no guarantees about AI agent performance, profitability, 
                or success rates. AI agents are experimental technology and results may vary.
              </p>
              
              <h3 className="text-lg font-semibold mb-2">Limitation of Liability</h3>
              <p className="text-muted-foreground mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, AGENT EMPIRE SHALL NOT BE LIABLE FOR 
                ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING 
                BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-4">8. Termination</h2>
              <p className="text-muted-foreground mb-4">
                We may terminate or suspend your account immediately, without prior notice, 
                for conduct that violates these Terms or is harmful to other users or the Service.
              </p>
              <p className="text-muted-foreground">
                Upon termination, your right to use the Service ceases immediately. 
                You may export your data within 30 days of termination.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-4">9. Governing Law</h2>
              <p className="text-muted-foreground mb-4">
                These Terms shall be governed by and construed in accordance with the laws of 
                Delaware, United States, without regard to conflict of law provisions.
              </p>
              <p className="text-muted-foreground">
                Any disputes shall be resolved through binding arbitration in Delaware.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-4">10. Changes to Terms</h2>
              <p className="text-muted-foreground mb-4">
                We reserve the right to modify these Terms at any time. We will notify users 
                of significant changes via email or through the Service.
              </p>
              <p className="text-muted-foreground">
                Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-4">11. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-background/50 p-4 rounded-lg">
                <p className="text-muted-foreground">
                  <strong>Email:</strong> legal@agent-empire.com<br />
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
              By using Agent Empire, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms of Service.
            </p>
            <Link href="/signup" className="btn-cyber text-lg px-8 py-4">
              I Accept - Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}