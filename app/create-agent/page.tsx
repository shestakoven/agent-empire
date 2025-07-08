'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, ArrowRight, ArrowLeft, Check, DollarSign, TrendingUp, Zap } from 'lucide-react';

interface AgentData {
  name: string;
  type: 'trading' | 'content' | 'automation';
  personality: string;
  goals: string;
  riskTolerance: 'low' | 'medium' | 'high';
  maxBudget: number;
  tradingPairs?: string[];
  socialPlatforms?: string[];
  automationTasks?: string[];
}

export default function CreateAgentPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [agentData, setAgentData] = useState<AgentData>({
    name: '',
    type: 'trading',
    personality: '',
    goals: '',
    riskTolerance: 'medium',
    maxBudget: 100,
    tradingPairs: [],
    socialPlatforms: [],
    automationTasks: []
  });

  const router = useRouter();

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      });

      if (response.ok) {
        const agent = await response.json();
        router.push(`/dashboard?created=${agent.id}`);
      } else {
        throw new Error('Failed to create agent');
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Failed to create agent. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const agentTypes = [
    {
      id: 'trading',
      name: 'Crypto Trading Agent',
      description: 'Automatically trade cryptocurrencies to generate profit',
      icon: <DollarSign className="w-8 h-8" />,
      color: 'green'
    },
    {
      id: 'content',
      name: 'Content Creator Agent',
      description: 'Generate and post viral content across social platforms',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'purple'
    },
    {
      id: 'automation',
      name: 'Task Automation Agent',
      description: 'Automate repetitive tasks and workflows',
      icon: <Zap className="w-8 h-8" />,
      color: 'blue'
    }
  ];

  const personalities = [
    { id: 'conservative', name: 'Conservative', desc: 'Cautious and risk-averse approach' },
    { id: 'balanced', name: 'Balanced', desc: 'Moderate risk with steady growth' },
    { id: 'aggressive', name: 'Aggressive', desc: 'High-risk, high-reward strategy' },
    { id: 'analytical', name: 'Analytical', desc: 'Data-driven decision making' },
    { id: 'creative', name: 'Creative', desc: 'Innovative and experimental' }
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="heading-2 mb-4">Choose Your Agent Type</h2>
              <p className="text-muted-foreground">
                What kind of AI agent do you want to create?
              </p>
            </div>

            <div className="grid gap-4">
              {agentTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setAgentData({ ...agentData, type: type.id as any })}
                  className={`p-6 rounded-lg border cursor-pointer transition-all ${
                    agentData.type === type.id
                      ? 'border-cyber-400 bg-cyber-500/10'
                      : 'border-border hover:border-cyber-500/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full bg-${type.color}-500/20`}>
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{type.name}</h3>
                      <p className="text-muted-foreground">{type.description}</p>
                    </div>
                    {agentData.type === type.id && (
                      <Check className="w-6 h-6 text-cyber-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="heading-2 mb-4">Name & Personality</h2>
              <p className="text-muted-foreground">
                Give your agent a name and choose its personality
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Agent Name</label>
                <input
                  type="text"
                  value={agentData.name}
                  onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                  className="input-cyber w-full"
                  placeholder="e.g., CryptoMaster, ViralBot, TaskHero"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Personality</label>
                <div className="grid grid-cols-1 gap-3">
                  {personalities.map((personality) => (
                    <div
                      key={personality.id}
                      onClick={() => setAgentData({ ...agentData, personality: personality.id })}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        agentData.personality === personality.id
                          ? 'border-cyber-400 bg-cyber-500/10'
                          : 'border-border hover:border-cyber-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{personality.name}</h4>
                          <p className="text-sm text-muted-foreground">{personality.desc}</p>
                        </div>
                        {agentData.personality === personality.id && (
                          <Check className="w-5 h-5 text-cyber-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Goals & Instructions</label>
                <textarea
                  value={agentData.goals}
                  onChange={(e) => setAgentData({ ...agentData, goals: e.target.value })}
                  className="input-cyber w-full h-24 resize-none"
                  placeholder="Describe what you want your agent to achieve..."
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="heading-2 mb-4">Configure Settings</h2>
              <p className="text-muted-foreground">
                Set up risk tolerance and budget for your agent
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Risk Tolerance</label>
                <div className="grid grid-cols-3 gap-3">
                  {['low', 'medium', 'high'].map((risk) => (
                    <button
                      key={risk}
                      onClick={() => setAgentData({ ...agentData, riskTolerance: risk as any })}
                      className={`p-4 rounded-lg border capitalize transition-all ${
                        agentData.riskTolerance === risk
                          ? 'border-cyber-400 bg-cyber-500/10'
                          : 'border-border hover:border-cyber-500/50'
                      }`}
                    >
                      {risk} Risk
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Budget: ${agentData.maxBudget}
                </label>
                <input
                  type="range"
                  min="10"
                  max="10000"
                  step="10"
                  value={agentData.maxBudget}
                  onChange={(e) => setAgentData({ ...agentData, maxBudget: Number(e.target.value) })}
                  className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>$10</span>
                  <span>$10,000</span>
                </div>
              </div>

              {agentData.type === 'trading' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Trading Pairs</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'DOT/USD', 'LINK/USD'].map((pair) => (
                      <button
                        key={pair}
                        onClick={() => {
                          const pairs = agentData.tradingPairs || [];
                          const newPairs = pairs.includes(pair)
                            ? pairs.filter(p => p !== pair)
                            : [...pairs, pair];
                          setAgentData({ ...agentData, tradingPairs: newPairs });
                        }}
                        className={`p-2 text-sm rounded border transition-all ${
                          agentData.tradingPairs?.includes(pair)
                            ? 'border-cyber-400 bg-cyber-500/10'
                            : 'border-border hover:border-cyber-500/50'
                        }`}
                      >
                        {pair}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {agentData.type === 'content' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Social Platforms</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Twitter', 'LinkedIn', 'Instagram', 'TikTok'].map((platform) => (
                      <button
                        key={platform}
                        onClick={() => {
                          const platforms = agentData.socialPlatforms || [];
                          const newPlatforms = platforms.includes(platform)
                            ? platforms.filter(p => p !== platform)
                            : [...platforms, platform];
                          setAgentData({ ...agentData, socialPlatforms: newPlatforms });
                        }}
                        className={`p-2 text-sm rounded border transition-all ${
                          agentData.socialPlatforms?.includes(platform)
                            ? 'border-cyber-400 bg-cyber-500/10'
                            : 'border-border hover:border-cyber-500/50'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="heading-2 mb-4">Review & Create</h2>
              <p className="text-muted-foreground">
                Review your agent configuration before creating
              </p>
            </div>

            <div className="card-cyber p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-cyber-500/20">
                  <Bot className="w-8 h-8 text-cyber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{agentData.name || 'Unnamed Agent'}</h3>
                  <p className="text-muted-foreground capitalize">
                    {agentData.type} Agent • {agentData.personality} Personality
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <h4 className="font-medium mb-2">Configuration</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Risk Tolerance: <span className="capitalize">{agentData.riskTolerance}</span></div>
                    <div>Max Budget: ${agentData.maxBudget}</div>
                    {agentData.tradingPairs && (
                      <div>Trading Pairs: {agentData.tradingPairs.join(', ')}</div>
                    )}
                    {agentData.socialPlatforms && (
                      <div>Platforms: {agentData.socialPlatforms.join(', ')}</div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Goals</h4>
                  <p className="text-sm text-muted-foreground">
                    {agentData.goals || 'No specific goals set'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-500/50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-400 mb-2">Important Notes</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your agent will start in simulation mode for safety</li>
                <li>• You can modify settings anytime from the dashboard</li>
                <li>• Real trading requires additional verification</li>
                <li>• All activities are logged and monitored</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-cyber-400" />
              <span className="text-xl font-heading font-bold gradient-text">Agent Empire</span>
            </Link>
            <Link href="/dashboard" className="btn-ghost">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= step
                        ? 'bg-cyber-500 text-white'
                        : 'bg-background border border-border text-muted-foreground'
                    }`}
                  >
                    {currentStep > step ? <Check className="w-5 h-5" /> : step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-20 h-1 mx-2 ${
                        currentStep > step ? 'bg-cyber-500' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of 4
              </p>
            </div>
          </div>

          {/* Step Content */}
          <div className="card-cyber p-8 mb-8">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="btn-outline flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !agentData.type) ||
                  (currentStep === 2 && (!agentData.name || !agentData.personality))
                }
                className="btn-cyber flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isCreating}
                className="btn-cyber flex items-center gap-2 disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    Create Agent
                    <Bot className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}