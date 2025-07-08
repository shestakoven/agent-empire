'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, TrendingUp, DollarSign, Play, Pause, RefreshCw, ArrowRight } from 'lucide-react';

interface AgentDemo {
  id: string;
  name: string;
  type: 'trading' | 'content' | 'automation';
  status: 'active' | 'paused' | 'working';
  profit: number;
  actions: number;
  icon: React.ReactNode;
}

export default function DemoPage() {
  const [selectedAgent, setSelectedAgent] = useState<string>('crypto-trader');
  const [isPlaying, setIsPlaying] = useState(true);
  const [agents, setAgents] = useState<AgentDemo[]>([
    {
      id: 'crypto-trader',
      name: 'CryptoTrader AI',
      type: 'trading',
      status: 'active',
      profit: 1247.83,
      actions: 156,
      icon: <DollarSign className="w-6 h-6" />
    },
    {
      id: 'viral-content',
      name: 'ViralContent AI',
      type: 'content',
      status: 'working',
      profit: 892.45,
      actions: 23,
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      id: 'task-master',
      name: 'TaskMaster AI',
      type: 'automation',
      status: 'active',
      profit: 2156.92,
      actions: 847,
      icon: <Bot className="w-6 h-6" />
    }
  ]);

  const [activityLog, setActivityLog] = useState([
    { time: '14:32:15', agent: 'CryptoTrader AI', action: 'Executed BTC buy order: +$47.32', type: 'profit' },
    { time: '14:31:02', agent: 'ViralContent AI', action: 'Posted viral meme - 2.4K likes in 5min', type: 'engagement' },
    { time: '14:29:45', agent: 'TaskMaster AI', action: 'Completed data analysis task', type: 'task' },
    { time: '14:28:12', agent: 'CryptoTrader AI', action: 'Analyzed market sentiment: Bullish', type: 'analysis' },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      // Update profits randomly
      setAgents(prev => prev.map(agent => ({
        ...agent,
        profit: agent.profit + (Math.random() * 10 - 2), // Random change
        actions: agent.actions + Math.floor(Math.random() * 3)
      })));

      // Add new activity
      const newActivity = {
        time: new Date().toLocaleTimeString(),
        agent: agents[Math.floor(Math.random() * agents.length)].name,
        action: getRandomAction(),
        type: ['profit', 'engagement', 'task', 'analysis'][Math.floor(Math.random() * 4)]
      };

      setActivityLog(prev => [newActivity, ...prev.slice(0, 9)]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, agents]);

  const getRandomAction = () => {
    const actions = [
      'Executed ETH sell order: +$23.45',
      'Created viral video - 15K views',
      'Optimized trading strategy',
      'Posted engaging tweet - 500 likes',
      'Completed research task',
      'Analyzed competitor data',
      'Generated $12.67 profit',
      'Shared market insight'
    ];
    return actions[Math.floor(Math.random() * actions.length)];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Bot className="h-8 w-8 text-cyber-400" />
                <span className="text-xl font-heading font-bold gradient-text">Agent Empire</span>
              </Link>
              <div className="hidden md:block text-sm text-muted-foreground">
                Live Demo - Watch AI Agents Work in Real-Time
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="btn-outline flex items-center gap-2"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <Link href="/signup" className="btn-cyber">
                Start Building
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="heading-1 gradient-text mb-4">
            Live AI Agent Demo
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Watch real AI agents trade crypto, create viral content, and automate tasks in real-time. 
            This is exactly what you'll build on Agent Empire.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-900/50 border border-green-500 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm text-green-400">Live Demo Running</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Total Profit Today: <span className="text-neon-400 font-bold">+${agents.reduce((sum, agent) => sum + agent.profit, 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Agent Selection */}
          <div className="card-cyber p-6">
            <h3 className="text-xl font-heading font-bold mb-4">Active AI Agents</h3>
            <div className="space-y-4">
              {agents.map((agent) => (
                <div 
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedAgent === agent.id 
                      ? 'border-cyber-400 bg-cyber-500/10' 
                      : 'border-border hover:border-cyber-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-cyber-500/20">
                        {agent.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold">{agent.name}</h4>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            agent.status === 'active' ? 'bg-green-400' : 
                            agent.status === 'working' ? 'bg-yellow-400' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-sm text-muted-foreground capitalize">{agent.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-neon-400 font-bold">+${agent.profit.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{agent.actions} actions</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Demo Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Agent Details */}
            <div className="card-cyber p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-heading font-bold">
                  {agents.find(a => a.id === selectedAgent)?.name} - Live Activity
                </h3>
                <button
                  onClick={() => {
                    // Simulate refresh
                    const newAction = {
                      time: new Date().toLocaleTimeString(),
                      agent: agents.find(a => a.id === selectedAgent)?.name || '',
                      action: getRandomAction(),
                      type: 'profit'
                    };
                    setActivityLog(prev => [newAction, ...prev.slice(0, 9)]);
                  }}
                  className="btn-outline p-2"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {selectedAgent === 'crypto-trader' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
                      <div className="text-sm text-green-400 mb-1">Current Trade</div>
                      <div className="font-mono">BTC/USD Long Position</div>
                      <div className="text-green-400 font-bold">+2.3% ($47.32)</div>
                    </div>
                    <div className="p-4 bg-background border border-border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Portfolio Value</div>
                      <div className="text-2xl font-bold">${(12580 + agents[0].profit).toFixed(2)}</div>
                      <div className="text-neon-400">+8.3% today</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-background border border-border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
                      <div className="text-2xl font-bold">87.3%</div>
                    </div>
                    <div className="p-4 bg-background border border-border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Active Positions</div>
                      <div className="text-2xl font-bold">3</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedAgent === 'viral-content' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-900/20 border border-purple-500/50 rounded-lg">
                      <div className="text-sm text-purple-400 mb-1">Latest Post</div>
                      <div className="font-mono">"AI agents are taking over... 🤖"</div>
                      <div className="text-purple-400 font-bold">2.4K likes, 430 shares</div>
                    </div>
                    <div className="p-4 bg-background border border-border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Total Followers</div>
                      <div className="text-2xl font-bold">15.2K</div>
                      <div className="text-neon-400">+127 today</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-background border border-border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Engagement Rate</div>
                      <div className="text-2xl font-bold">12.7%</div>
                    </div>
                    <div className="p-4 bg-background border border-border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Posts Today</div>
                      <div className="text-2xl font-bold">8</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedAgent === 'task-master' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
                      <div className="text-sm text-blue-400 mb-1">Current Task</div>
                      <div className="font-mono">Market Research Analysis</div>
                      <div className="text-blue-400 font-bold">85% Complete</div>
                    </div>
                    <div className="p-4 bg-background border border-border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Tasks Completed</div>
                      <div className="text-2xl font-bold">847</div>
                      <div className="text-neon-400">+23 today</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-background border border-border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Time Saved</div>
                      <div className="text-2xl font-bold">127h</div>
                    </div>
                    <div className="p-4 bg-background border border-border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Efficiency</div>
                      <div className="text-2xl font-bold">94%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Log */}
            <div className="card-cyber p-6">
              <h3 className="text-xl font-heading font-bold mb-4">Real-Time Activity Feed</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activityLog.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'profit' ? 'bg-green-400' :
                        activity.type === 'engagement' ? 'bg-purple-400' :
                        activity.type === 'task' ? 'bg-blue-400' : 'bg-yellow-400'
                      }`}></div>
                      <div>
                        <div className="font-medium">{activity.agent}</div>
                        <div className="text-sm text-muted-foreground">{activity.action}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 mb-12">
          <div className="card-cyber p-8 max-w-2xl mx-auto">
            <h2 className="heading-2 gradient-text mb-4">
              Ready to Build Your Own AI Empire?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Create agents just like these in under 5 minutes. No coding required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-cyber text-lg px-8 py-4">
                Start Building Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="/pricing" className="btn-outline text-lg px-8 py-4">
                View Pricing
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Free to start
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}