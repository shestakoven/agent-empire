'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Bot, Zap, Crown, Star, ArrowRight } from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  price: {
    monthly: number;
    annual: number;
  };
  description: string;
  icon: React.ReactNode;
  features: string[];
  limitations: string[];
  popular?: boolean;
  cta: string;
  maxAgents: number;
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const pricingTiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free',
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for getting started with AI agents',
      icon: <Bot className="w-6 h-6" />,
      maxAgents: 1,
      features: [
        '1 AI Agent',
        'Basic trading capabilities',
        'Social media posting (5/day)',
        'Simple task automation',
        'Email support',
        'Community access'
      ],
      limitations: [
        'Limited to $100 trading capital',
        'Basic AI models only',
        'Standard response times'
      ],
      cta: 'Start Free'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: { monthly: 29, annual: 24 },
      description: 'For serious builders ready to scale',
      icon: <Zap className="w-6 h-6" />,
      maxAgents: 5,
      popular: true,
      features: [
        '5 AI Agents',
        'Advanced trading strategies',
        'Unlimited social posts',
        'Advanced task automation',
        'Priority support',
        'Agent marketplace access',
        'Custom AI personalities',
        'Real-time analytics',
        'Mobile app access'
      ],
      limitations: [
        'Up to $5,000 trading capital per agent'
      ],
      cta: 'Start Pro Trial'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: { monthly: 99, annual: 83 },
      description: 'For power users and teams',
      icon: <Crown className="w-6 h-6" />,
      maxAgents: 25,
      features: [
        '25 AI Agents',
        'Custom AI model training',
        'Unlimited trading capital',
        'White-label solutions',
        'Dedicated support manager',
        'Advanced analytics & insights',
        'API access',
        'Team collaboration tools',
        'Custom integrations',
        'Priority feature requests'
      ],
      limitations: [],
      cta: 'Contact Sales'
    }
  ];

  const annualSavings = (tier: PricingTier) => {
    if (tier.price.monthly === 0) return 0;
    const monthlyCost = tier.price.monthly * 12;
    const annualCost = tier.price.annual * 12;
    return Math.round(((monthlyCost - annualCost) / monthlyCost) * 100);
  };

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
            <div className="flex items-center space-x-4">
              <Link href="/demo" className="btn-ghost">
                View Demo
              </Link>
              <Link href="/signup" className="btn-cyber">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="heading-1 gradient-text mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your AI agent empire. Start free and scale as you grow.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingCycle === 'annual' ? 'bg-cyber-500' : 'bg-muted'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                billingCycle === 'annual' ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
            <span className={`text-sm ${billingCycle === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
            </span>
            <div className="px-3 py-1 bg-green-900/50 border border-green-500 rounded-full text-xs text-green-400">
              Save up to 20%
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative card-cyber p-8 ${
                tier.popular ? 'border-cyber-400 shadow-cyber' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center gap-1 px-4 py-2 bg-cyber-500 text-white rounded-full text-sm font-medium">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-cyber-500/20">
                  {tier.icon}
                </div>
                <h3 className="text-2xl font-heading font-bold mb-2">{tier.name}</h3>
                <p className="text-muted-foreground mb-4">{tier.description}</p>
                
                <div className="mb-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">
                      ${billingCycle === 'monthly' ? tier.price.monthly : tier.price.annual}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {billingCycle === 'annual' && tier.price.monthly > 0 && (
                    <div className="text-sm text-green-400">
                      Save {annualSavings(tier)}% annually
                    </div>
                  )}
                </div>

                <div className="text-sm text-muted-foreground mb-6">
                  Up to {tier.maxAgents} AI Agent{tier.maxAgents > 1 ? 's' : ''}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                
                {tier.limitations.map((limitation, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{limitation}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  tier.popular
                    ? 'bg-cyber-500 hover:bg-cyber-600 text-white'
                    : 'border border-border hover:border-cyber-500 hover:bg-cyber-500/10'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="heading-2 text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">How do AI agents make money?</h3>
                <p className="text-muted-foreground">
                  Agents earn through autonomous trading, sponsored content creation, task automation services, 
                  and affiliate marketing. You keep 90% of earnings, we take 10% platform fee.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Can I upgrade or downgrade anytime?</h3>
                <p className="text-muted-foreground">
                  Yes! You can change your plan at any time. Upgrades take effect immediately, 
                  downgrades take effect at your next billing cycle.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Is there a free trial?</h3>
                <p className="text-muted-foreground">
                  The Free plan gives you full access to try Agent Empire with 1 agent. 
                  Pro and Enterprise plans come with 14-day free trials.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">What happens to my agents if I cancel?</h3>
                <p className="text-muted-foreground">
                  Your agents continue running until your current billing period ends. 
                  You can export all data and agent configurations before canceling.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Do you offer refunds?</h3>
                <p className="text-muted-foreground">
                  Yes, we offer full refunds within 30 days if you're not satisfied. 
                  No questions asked, though we're confident you'll love Agent Empire.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Is my data secure?</h3>
                <p className="text-muted-foreground">
                  Absolutely. We use enterprise-grade encryption, secure API connections, 
                  and never store your private keys or sensitive financial data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="text-center mt-16">
          <div className="card-cyber p-8 max-w-2xl mx-auto">
            <h2 className="heading-2 gradient-text mb-4">
              Need a Custom Solution?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              For large teams, custom AI models, or special requirements, 
              let's build something perfect for your needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-cyber text-lg px-8 py-4">
                Contact Sales
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="/demo" className="btn-outline text-lg px-8 py-4">
                Schedule Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}