'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  TrendingUp, TrendingDown, DollarSign, Bot, BarChart3, 
  PieChart, Activity, Calendar, Clock, Target, Zap,
  ArrowUp, ArrowDown, Eye, Users, MessageSquare
} from 'lucide-react'

interface AgentStats {
  id: string
  name: string
  type: string
  totalEarnings: number
  dailyEarnings: number
  weeklyEarnings: number
  monthlyEarnings: number
  successRate: number
  totalTrades: number
  totalPosts: number
  followers: number
  engagement: number
  uptime: number
  lastActive: string
  growthRate: number
}

interface OverallStats {
  totalEarnings: number
  totalAgents: number
  averageSuccess: number
  totalFollowers: number
  totalEngagement: number
  earningsGrowth: number
  popularAgent: string
}

export default function Stats() {
  const { data: session } = useSession()
  const [agentStats, setAgentStats] = useState<AgentStats[]>([])
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('7d')
  const [selectedAgent, setSelectedAgent] = useState<string>('all')

  useEffect(() => {
    fetchStats()
  }, [timeframe])

  const fetchStats = async () => {
    try {
      // For demo, we'll use mock data. In production, this would be API calls
      const mockAgentStats: AgentStats[] = [
        {
          id: 'agent_1',
          name: 'CryptoTrader Pro',
          type: 'trading',
          totalEarnings: 12847.32,
          dailyEarnings: 423.89,
          weeklyEarnings: 2847.32,
          monthlyEarnings: 12847.32,
          successRate: 87.3,
          totalTrades: 1247,
          totalPosts: 0,
          followers: 0,
          engagement: 0,
          uptime: 98.7,
          lastActive: '2 minutes ago',
          growthRate: 23.4
        },
        {
          id: 'agent_2',
          name: 'ViralContent Bot',
          type: 'content',
          totalEarnings: 8943.21,
          dailyEarnings: 298.11,
          weeklyEarnings: 1943.21,
          monthlyEarnings: 8943.21,
          successRate: 94.1,
          totalTrades: 0,
          totalPosts: 456,
          followers: 125000,
          engagement: 84320,
          uptime: 99.2,
          lastActive: '5 minutes ago',
          growthRate: 45.7
        },
        {
          id: 'agent_3',
          name: 'TaskMaster AI',
          type: 'automation',
          totalEarnings: 6532.18,
          dailyEarnings: 217.74,
          weeklyEarnings: 1532.18,
          monthlyEarnings: 6532.18,
          successRate: 91.7,
          totalTrades: 0,
          totalPosts: 0,
          followers: 0,
          engagement: 0,
          uptime: 97.8,
          lastActive: '1 hour ago',
          growthRate: 18.9
        }
      ]

      const mockOverallStats: OverallStats = {
        totalEarnings: 28322.71,
        totalAgents: 3,
        averageSuccess: 91.0,
        totalFollowers: 125000,
        totalEngagement: 84320,
        earningsGrowth: 29.3,
        popularAgent: 'ViralContent Bot'
      }

      setAgentStats(mockAgentStats)
      setOverallStats(mockOverallStats)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setIsLoading(false)
    }
  }

  const getEarningsForTimeframe = (agent: AgentStats) => {
    switch (timeframe) {
      case '1d':
        return agent.dailyEarnings
      case '7d':
        return agent.weeklyEarnings
      case '30d':
        return agent.monthlyEarnings
      default:
        return agent.totalEarnings
    }
  }

  const getTotalEarningsForTimeframe = () => {
    return agentStats.reduce((total, agent) => total + getEarningsForTimeframe(agent), 0)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trading':
        return <DollarSign className="w-5 h-5 text-green-400" />
      case 'content':
        return <TrendingUp className="w-5 h-5 text-purple-400" />
      case 'automation':
        return <Zap className="w-5 h-5 text-blue-400" />
      default:
        return <Bot className="w-5 h-5 text-cyber-400" />
    }
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyber-400"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="heading-1 gradient-text mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your AI agents' performance and earnings in real-time
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="input-cyber"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
            
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="input-cyber"
            >
              <option value="all">All Agents</option>
              {agentStats.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        {overallStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-6 h-6 text-neon-400" />
                {overallStats.earningsGrowth > 0 ? (
                  <div className="flex items-center text-green-400 text-sm">
                    <ArrowUp className="w-4 h-4" />
                    {overallStats.earningsGrowth.toFixed(1)}%
                  </div>
                ) : (
                  <div className="flex items-center text-red-400 text-sm">
                    <ArrowDown className="w-4 h-4" />
                    {Math.abs(overallStats.earningsGrowth).toFixed(1)}%
                  </div>
                )}
              </div>
              <div className="stat-value text-neon-400">
                {formatCurrency(getTotalEarningsForTimeframe())}
              </div>
              <div className="stat-label">Total Earnings</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <Bot className="w-6 h-6 text-cyber-400" />
                <div className="text-cyan-400 text-sm">Active</div>
              </div>
              <div className="stat-value text-cyber-400">{overallStats.totalAgents}</div>
              <div className="stat-label">AI Agents</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-6 h-6 text-green-400" />
                <div className="text-green-400 text-sm">Avg</div>
              </div>
              <div className="stat-value text-green-400">{overallStats.averageSuccess.toFixed(1)}%</div>
              <div className="stat-label">Success Rate</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 text-purple-400" />
                <div className="text-purple-400 text-sm">Growth</div>
              </div>
              <div className="stat-value text-purple-400">{formatNumber(overallStats.totalFollowers)}</div>
              <div className="stat-label">Total Followers</div>
            </div>
          </div>
        )}

        {/* Agent Performance Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Individual Agent Stats */}
          <div className="card-cyber p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-cyber-400" />
              Agent Performance
            </h2>
            
            <div className="space-y-4">
              {agentStats.map((agent) => (
                <div key={agent.id} className="dashboard-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(agent.type)}
                      <div>
                        <h3 className="font-bold">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {agent.type} • Last active {agent.lastActive}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      agent.growthRate > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {agent.growthRate > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      {Math.abs(agent.growthRate).toFixed(1)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="font-bold text-neon-400">
                        {formatCurrency(getEarningsForTimeframe(agent))}
                      </div>
                      <div className="text-xs text-muted-foreground">Earnings</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-400">{agent.successRate}%</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                    <div>
                      <div className="font-bold text-blue-400">{agent.uptime}%</div>
                      <div className="text-xs text-muted-foreground">Uptime</div>
                    </div>
                  </div>

                  {/* Type-specific metrics */}
                  {agent.type === 'trading' && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span>Total Trades:</span>
                        <span className="font-bold">{agent.totalTrades.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {agent.type === 'content' && (
                    <div className="mt-3 pt-3 border-t border-border space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Posts Created:</span>
                        <span className="font-bold">{agent.totalPosts.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Followers:</span>
                        <span className="font-bold">{formatNumber(agent.followers)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Engagement:</span>
                        <span className="font-bold">{formatNumber(agent.engagement)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Performance Charts */}
          <div className="card-cyber p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <PieChart className="w-6 h-6 text-electric-400" />
              Performance Overview
            </h2>

            {/* Quick metrics */}
            <div className="space-y-6">
              <div className="dashboard-card p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  24h Activity
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Active Agents:</span>
                    <span className="font-bold text-green-400">
                      {agentStats.filter(a => a.lastActive.includes('minutes')).length}/{agentStats.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Actions:</span>
                    <span className="font-bold">
                      {agentStats.reduce((sum, agent) => sum + agent.totalTrades + agent.totalPosts, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Response Time:</span>
                    <span className="font-bold text-cyber-400">1.2s</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-card p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Top Performer
                </h3>
                {overallStats && (
                  <div className="text-center">
                    <div className="text-2xl font-bold gradient-text mb-2">
                      {overallStats.popularAgent}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Highest earnings this {timeframe === '1d' ? 'day' : timeframe === '7d' ? 'week' : 'month'}
                    </div>
                  </div>
                )}
              </div>

              <div className="dashboard-card p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-neon-400" />
                  Growth Metrics
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Revenue Growth:</span>
                    <span className="font-bold text-neon-400">+{overallStats?.earningsGrowth.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Best Agent Growth:</span>
                    <span className="font-bold text-green-400">
                      +{Math.max(...agentStats.map(a => a.growthRate)).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Portfolio ROI:</span>
                    <span className="font-bold text-electric-400">+187.3%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="card-cyber p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Detailed Analytics</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="dashboard-card p-4">
              <h3 className="font-bold mb-3 text-green-400">Trading Performance</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Trades:</span>
                  <span className="font-bold">
                    {agentStats.filter(a => a.type === 'trading').reduce((sum, a) => sum + a.totalTrades, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Win Rate:</span>
                  <span className="font-bold text-green-400">
                    {(agentStats.filter(a => a.type === 'trading').reduce((sum, a) => sum + a.successRate, 0) / 
                      agentStats.filter(a => a.type === 'trading').length || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Profit Factor:</span>
                  <span className="font-bold text-neon-400">2.34</span>
                </div>
              </div>
            </div>

            <div className="dashboard-card p-4">
              <h3 className="font-bold mb-3 text-purple-400">Content Performance</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Posts:</span>
                  <span className="font-bold">
                    {agentStats.filter(a => a.type === 'content').reduce((sum, a) => sum + a.totalPosts, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg Engagement:</span>
                  <span className="font-bold text-purple-400">
                    {formatNumber(agentStats.filter(a => a.type === 'content').reduce((sum, a) => sum + a.engagement, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Viral Score:</span>
                  <span className="font-bold text-electric-400">8.7/10</span>
                </div>
              </div>
            </div>

            <div className="dashboard-card p-4">
              <h3 className="font-bold mb-3 text-blue-400">System Health</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Avg Uptime:</span>
                  <span className="font-bold text-green-400">
                    {(agentStats.reduce((sum, a) => sum + a.uptime, 0) / agentStats.length).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">API Health:</span>
                  <span className="font-bold text-green-400">99.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg Load Time:</span>
                  <span className="font-bold text-cyber-400">0.8s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card-cyber p-6 text-center">
            <Bot className="w-12 h-12 mx-auto mb-4 text-cyber-400" />
            <h3 className="font-bold mb-2">Create New Agent</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Build another AI agent to increase your earnings
            </p>
            <Link href="/create-agent" className="btn-cyber">
              Create Agent
            </Link>
          </div>

          <div className="card-cyber p-6 text-center">
            <Eye className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="font-bold mb-2">View Marketplace</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Buy successful agents from other users
            </p>
            <Link href="/marketplace" className="btn-outline">
              Browse Market
            </Link>
          </div>

          <div className="card-cyber p-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-electric-400" />
            <h3 className="font-bold mb-2">Get Support</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Need help optimizing your agents?
            </p>
            <Link href="/support" className="btn-outline">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}