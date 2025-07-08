import Link from 'next/link';
import { Bot, Target, Users, Zap, Globe, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const team = [
    {
      name: 'Alex Chen',
      role: 'CEO & Founder',
      bio: 'Former OpenAI engineer with 8+ years in AI. Built multiple successful trading algorithms.',
      image: '/team/alex.jpg'
    },
    {
      name: 'Sarah Kim',
      role: 'CTO',
      bio: 'Ex-Google engineer specializing in distributed systems and blockchain technology.',
      image: '/team/sarah.jpg'
    },
    {
      name: 'Marcus Johnson',
      role: 'Head of AI',
      bio: 'PhD in Machine Learning, formerly at DeepMind. Expert in reinforcement learning.',
      image: '/team/marcus.jpg'
    }
  ];

  const milestones = [
    { year: '2024', event: 'Agent Empire founded', desc: 'Started with a vision to democratize AI agent creation' },
    { year: '2024', event: '1,000 Users', desc: 'Reached first thousand users in private beta' },
    { year: '2024', event: '$100K Generated', desc: 'AI agents collectively earned first $100K for users' },
    { year: '2025', event: 'Public Launch', desc: 'Opening to the world with revolutionary platform' }
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
              <Link href="/features" className="btn-ghost">Features</Link>
              <Link href="/pricing" className="btn-ghost">Pricing</Link>
              <Link href="/signup" className="btn-cyber">Get Started</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="heading-1 gradient-text mb-6">
            Building the Future of Work with AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8">
            Agent Empire was born from a simple belief: everyone should benefit from the AI revolution, 
            not just big tech companies. We're democratizing AI agent creation so anyone can build 
            their own autonomous workforce.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="card-cyber p-8 text-center">
            <Target className="w-12 h-12 text-cyber-400 mx-auto mb-4" />
            <h3 className="text-xl font-heading font-bold mb-4">Our Mission</h3>
            <p className="text-muted-foreground">
              To empower individuals to create AI agents that generate passive income and 
              automate their lives, making AI accessible to everyone.
            </p>
          </div>
          
          <div className="card-cyber p-8 text-center">
            <Users className="w-12 h-12 text-electric-400 mx-auto mb-4" />
            <h3 className="text-xl font-heading font-bold mb-4">Our Vision</h3>
            <p className="text-muted-foreground">
              A world where AI agents work for individuals, not just corporations, 
              creating new forms of wealth and freedom for everyone.
            </p>
          </div>
          
          <div className="card-cyber p-8 text-center">
            <Zap className="w-12 h-12 text-neon-400 mx-auto mb-4" />
            <h3 className="text-xl font-heading font-bold mb-4">Our Values</h3>
            <p className="text-muted-foreground">
              Transparency, innovation, and user empowerment. We believe in open 
              development and putting our users' success first.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="card-cyber p-8 mb-20">
          <h2 className="heading-2 text-center mb-8">Our Story</h2>
          <div className="max-w-4xl mx-auto space-y-6 text-muted-foreground">
            <p className="text-lg">
              In late 2023, our founder Alex Chen was working at OpenAI when he realized something profound: 
              while AI was getting incredibly powerful, only large corporations had the resources to build 
              and deploy useful AI systems.
            </p>
            <p className="text-lg">
              "I saw traders making millions with algorithmic trading, influencers building massive followings 
              with AI-generated content, and companies automating entire workflows," Alex recalls. 
              "But regular people were left out of this revolution."
            </p>
            <p className="text-lg">
              That's when the idea for Agent Empire was born. What if anyone could create their own AI agents 
              without needing to code? What if these agents could actually make money for their creators?
            </p>
            <p className="text-lg">
              We spent 12 months building the most user-friendly AI agent platform ever created. Today, 
              thousands of people are earning passive income with AI agents they built in minutes, not months.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <h2 className="heading-2 text-center mb-12">Meet the Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="card-cyber p-6 text-center">
                <div className="w-24 h-24 bg-cyber-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Bot className="w-12 h-12 text-cyber-400" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-2">{member.name}</h3>
                <div className="text-cyber-400 font-medium mb-4">{member.role}</div>
                <p className="text-muted-foreground text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-20">
          <h2 className="heading-2 text-center mb-12">Our Journey</h2>
          <div className="max-w-3xl mx-auto">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start gap-4 mb-8">
                <div className="w-16 h-16 bg-cyber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-cyber-400 font-bold">{milestone.year}</span>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold mb-2">{milestone.event}</h3>
                  <p className="text-muted-foreground">{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="card-cyber p-8 mb-20">
          <h2 className="heading-2 text-center mb-12">Impact by the Numbers</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-cyber-400 mb-2">25,000+</div>
              <div className="text-muted-foreground">AI Agents Created</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-neon-400 mb-2">$5.2M</div>
              <div className="text-muted-foreground">Total User Earnings</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-electric-400 mb-2">150+</div>
              <div className="text-muted-foreground">Countries Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">99.9%</div>
              <div className="text-muted-foreground">Platform Uptime</div>
            </div>
          </div>
        </div>

        {/* Future Section */}
        <div className="card-cyber p-8 mb-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="heading-2 mb-6">What's Next?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              We're just getting started. Our roadmap includes mobile apps, voice-controlled agents, 
              advanced AI model training, and partnerships with major platforms. Our goal is to make 
              AI agents as common as smartphones.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-background/50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Q1 2025</h3>
                <p className="text-sm text-muted-foreground">Mobile app launch, voice controls</p>
              </div>
              <div className="bg-background/50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Q2 2025</h3>
                <p className="text-sm text-muted-foreground">Advanced AI training, custom models</p>
              </div>
              <div className="bg-background/50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Q3 2025</h3>
                <p className="text-sm text-muted-foreground">Enterprise features, team collaboration</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="card-cyber p-8 max-w-2xl mx-auto">
            <h2 className="heading-2 gradient-text mb-4">
              Join the AI Revolution
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Be part of a community that's redefining work and wealth creation with AI. 
              Your future self will thank you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-cyber text-lg px-8 py-4">
                Start Building Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="/contact" className="btn-outline text-lg px-8 py-4">
                Get in Touch
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Join 25,000+ builders already using Agent Empire
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}