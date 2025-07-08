'use client';

import Link from 'next/link';
import { Bot, DollarSign, TrendingUp, Zap, Shield, Users, Clock, Sparkles, ArrowRight, Check } from 'lucide-react';

export default function FeaturesPage() {
  const features = [
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Autonomous Trading',
      description: 'AI agents that trade cryptocurrency 24/7 with advanced algorithms',
      details: [
        'Multi-exchange support (Binance, Coinbase, Kraken)',
        'Risk management and stop-loss protection',
        'Technical analysis and sentiment monitoring',
        'Automated portfolio rebalancing'
      ],
      color: 'green'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Viral Content Creation',
      description: 'Generate and post engaging content across social platforms',
      details: [
        'AI-powered content generation',
        'Multi-platform posting (Twitter, LinkedIn, TikTok)',
        'Optimal timing and hashtag optimization',
        'Engagement tracking and analytics'
      ],
      color: 'purple'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Task Automation',
      description: 'Automate repetitive tasks and workflows intelligently',
      details: [
        'Data analysis and report generation',
        'Email management and responses',
        'Research and information gathering',
        'Custom workflow creation'
      ],
      color: 'blue'
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: 'Agent Marketplace',
      description: 'Buy, sell, and trade successful AI agents',
      details: [
        'Browse proven profitable agents',
        'Performance history and metrics',
        'Secure agent transfer system',
        'Revenue sharing capabilities'
      ],
      color: 'cyber'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Enterprise Security',
      description: 'Bank-level security for your AI agents and data',
      details: [
        'End-to-end encryption',
        'Multi-factor authentication',
        'SOC 2 compliance',
        'Private key protection'
      ],
      color: 'red'
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'AI Personalities',
      description: 'Customize agent behavior and decision-making style',
      details: [
        'Pre-built personality templates',
        'Custom behavior programming',
        'Learning and adaptation capabilities',
        'Goal-oriented decision making'
      ],
      color: 'yellow'
    }
  ];

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
              <Link href="/pricing" className="btn-ghost">
                Pricing
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
            Powerful Features for AI Agent Success
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Everything you need to build, deploy, and monetize AI agents that work around the clock. 
            No coding required, maximum results guaranteed.
          </p>
          <Link href="/demo" className="btn-cyber text-lg px-8 py-4">
            See Features in Action
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="card-cyber p-6 h-full">
              <div className={`w-16 h-16 rounded-full bg-${feature.color}-500/20 flex items-center justify-center mb-6 mx-auto`}>
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-heading font-bold text-center mb-4">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground text-center mb-6">
                {feature.description}
              </p>
              
              <ul className="space-y-3">
                {feature.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* How It Works Section */}
        <div className="mb-20">
          <h2 className="heading-2 text-center mb-12">How Agent Empire Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Choose Agent Type', desc: 'Select from trading, content, or automation agents' },
              { step: '2', title: 'Configure & Deploy', desc: 'Customize settings and launch your agent in minutes' },
              { step: '3', title: 'Monitor Performance', desc: 'Track earnings and optimize with real-time analytics' },
              { step: '4', title: 'Scale & Profit', desc: 'Add more agents and maximize your passive income' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-cyber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="card-cyber p-8 mb-20">
          <h2 className="heading-2 text-center mb-12">Trusted by Builders Worldwide</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-cyber-400 mb-2">10,000+</div>
              <div className="text-muted-foreground">Active AI Agents</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-neon-400 mb-2">$2.5M+</div>
              <div className="text-muted-foreground">Total Earnings Generated</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-electric-400 mb-2">87%</div>
              <div className="text-muted-foreground">Average Success Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">24/7</div>
              <div className="text-muted-foreground">Continuous Operation</div>
            </div>
          </div>
        </div>

        {/* Integration Section */}
        <div className="mb-20">
          <h2 className="heading-2 text-center mb-12">Seamless Integrations</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-cyber p-6 text-center">
              <h3 className="text-lg font-heading font-semibold mb-4">Trading Platforms</h3>
              <div className="space-y-2 text-muted-foreground">
                <div>Binance • Coinbase • Kraken</div>
                <div>FTX • KuCoin • Bybit</div>
                <div>Uniswap • PancakeSwap</div>
              </div>
            </div>
            
            <div className="card-cyber p-6 text-center">
              <h3 className="text-lg font-heading font-semibold mb-4">Social Platforms</h3>
              <div className="space-y-2 text-muted-foreground">
                <div>Twitter • LinkedIn • Instagram</div>
                <div>TikTok • YouTube • Discord</div>
                <div>Medium • Reddit • Telegram</div>
              </div>
            </div>
            
            <div className="card-cyber p-6 text-center">
              <h3 className="text-lg font-heading font-semibold mb-4">AI Models</h3>
              <div className="space-y-2 text-muted-foreground">
                <div>GPT-4 • Claude 3 • Gemini</div>
                <div>Custom Fine-tuned Models</div>
                <div>Open Source Alternatives</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="card-cyber p-8 max-w-2xl mx-auto">
            <h2 className="heading-2 gradient-text mb-4">
              Ready to Build Your AI Empire?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of builders already earning passive income with AI agents. 
              Start free and scale as you grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-cyber text-lg px-8 py-4">
                Start Building Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="/demo" className="btn-outline text-lg px-8 py-4">
                Watch Demo
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Free to start • 14-day Pro trial
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}