'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  Bot, TrendingUp, DollarSign, Star, Heart, Filter, Search, 
  ArrowUpDown, Eye, ShoppingCart, Zap, Crown, Award 
} from 'lucide-react'

interface MarketplaceAgent {
  id: string
  name: string
  type: 'trading' | 'content' | 'automation'
  personality: string
  price: number
  owner: string
  rating: number
  totalEarnings: number
  successRate: number
  description: string
  tags: string[]
  image?: string
  featured?: boolean
  verified?: boolean
  purchases: number
  lastActivity: string
}

export default function Marketplace() {
  const { data: session } = useSession()
  const [agents, setAgents] = useState<MarketplaceAgent[]>([])
  const [filteredAgents, setFilteredAgents] = useState<MarketplaceAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('price')
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    fetchMarketplaceAgents()
  }, [])

  useEffect(() => {
    filterAndSortAgents()
  }, [agents, searchTerm, filterType, sortBy])

  const fetchMarketplaceAgents = async () => {
    try {
      // For demo, we'll use mock data. In production, this would be an API call
      const mockAgents: MarketplaceAgent[] = [
        {
          id: 'market_1',
          name: 'CryptoKing Pro',
          type: 'trading',
          personality: 'aggressive',
          price: 299,
          owner: 'AlgoTrader_99',
          rating: 4.8,
          totalEarnings: 12847.32,
          successRate: 87.3,
          description: 'Elite trading agent with advanced ML algorithms. Specialized in Bitcoin and Ethereum trading with proven track record.',
          tags: ['Bitcoin', 'Ethereum', 'DeFi', 'High-Frequency'],
          featured: true,
          verified: true,
          purchases: 234,
          lastActivity: '2 hours ago'
        },
        {
          id: 'market_2',
          name: 'ViralMaster Supreme',
          type: 'content',
          personality: 'creative',
          price: 199,
          owner: 'ContentCreator_X',
          rating: 4.9,
          totalEarnings: 8943.21,
          successRate: 94.1,
          description: 'Master of viral content creation. Generated 500M+ views across platforms. Perfect for building massive audiences.',
          tags: ['TikTok', 'Instagram', 'Twitter', 'Viral'],
          featured: true,
          verified: true,
          purchases: 189,
          lastActivity: '1 hour ago'
        },
        {
          id: 'market_3',
          name: 'AutoBot Elite',
          type: 'automation',
          personality: 'analytical',
          price: 149,
          owner: 'TechGuru_2024',
          rating: 4.6,
          totalEarnings: 6532.18,
          successRate: 91.7,
          description: 'Productivity powerhouse that automates complex workflows. Saves 20+ hours per week on average.',
          tags: ['Productivity', 'Data Analysis', 'API Integration'],
          purchases: 156,
          lastActivity: '3 hours ago'
        },
        {
          id: 'market_4',
          name: 'Scalp Master 3000',
          type: 'trading',
          personality: 'conservative',
          price: 399,
          owner: 'WallStreetAI',
          rating: 4.7,
          totalEarnings: 15234.67,
          successRate: 82.4,
          description: 'Conservative scalping strategy with consistent returns. Perfect for risk-averse investors.',
          tags: ['Scalping', 'Conservative', 'Forex', 'Risk Management'],
          verified: true,
          purchases: 98,
          lastActivity: '30 minutes ago'
        },
        {
          id: 'market_5',
          name: 'TrendHunter AI',
          type: 'content',
          personality: 'balanced',
          price: 89,
          owner: 'SocialMediaPro',
          rating: 4.4,
          totalEarnings: 3421.45,
          successRate: 78.9,
          description: 'Finds trending topics before they explode. Great for early adopters and trend followers.',
          tags: ['Trending', 'Research', 'Social Media'],
          purchases: 267,
          lastActivity: '6 hours ago'
        },
        {
          id: 'market_6',
          name: 'DeFi Yield Hunter',
          type: 'trading',
          personality: 'aggressive',
          price: 249,
          owner: 'DeFiKing',
          rating: 4.5,
          totalEarnings: 9876.54,
          successRate: 85.2,
          description: 'Specialized in DeFi yield farming and liquidity provision. Maximizes APY across protocols.',
          tags: ['DeFi', 'Yield Farming', 'Liquidity', 'Staking'],
          purchases: 134,
          lastActivity: '4 hours ago'
        }
      ]
      
      setAgents(mockAgents)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching marketplace agents:', error)
      setIsLoading(false)
    }
  }

  const filterAndSortAgents = () => {
    let filtered = agents

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(agent => agent.type === filterType)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price - b.price
        case 'price_high':
          return b.price - a.price
        case 'rating':
          return b.rating - a.rating
        case 'earnings':
          return b.totalEarnings - a.totalEarnings
        case 'popular':
          return b.purchases - a.purchases
        default:
          return a.price - b.price
      }
    })

    setFilteredAgents(filtered)
  }

  const toggleFavorite = (agentId: string) => {
    setFavorites(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
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

  const handlePurchase = (agent: MarketplaceAgent) => {
    // In production, this would open a purchase modal/flow
    alert(`Purchase ${agent.name} for $${agent.price}? (Feature coming soon!)`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyber-400"></div>
          <p className="mt-4 text-muted-foreground">Loading marketplace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="heading-1 gradient-text mb-4">
            Agent Marketplace
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Buy and sell successful AI agents. Own proven money-makers created by top builders.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="stat-value text-cyber-400">{agents.length}</div>
            <div className="stat-label">Agents Listed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-neon-400">
              ${agents.reduce((sum, agent) => sum + agent.totalEarnings, 0).toLocaleString()}
            </div>
            <div className="stat-label">Total Earnings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-electric-400">
              {agents.reduce((sum, agent) => sum + agent.purchases, 0)}
            </div>
            <div className="stat-label">Total Sales</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-purple-400">
              {(agents.reduce((sum, agent) => sum + agent.rating, 0) / agents.length).toFixed(1)}⭐
            </div>
            <div className="stat-label">Avg Rating</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card-cyber p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search agents, descriptions, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-cyber w-full pl-10"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-cyber"
            >
              <option value="all">All Types</option>
              <option value="trading">Trading</option>
              <option value="content">Content</option>
              <option value="automation">Automation</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-cyber"
            >
              <option value="price">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="earnings">Top Earners</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Featured Agents */}
        {agents.some(agent => agent.featured) && (
          <div className="mb-8">
            <h2 className="heading-3 mb-6 flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              Featured Agents
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {agents.filter(agent => agent.featured).map((agent) => (
                <div key={agent.id} className="card-cyber p-6 border-yellow-500/30">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(agent.type)}
                      <div>
                                                 <div className="flex items-center gap-2">
                           <h3 className="font-bold text-lg">{agent.name}</h3>
                           {agent.verified && (
                             <Award className="w-4 h-4 text-blue-400" />
                           )}
                         </div>
                        <p className="text-sm text-muted-foreground">by {agent.owner}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(agent.id)}
                      className={`p-2 rounded-full transition-colors ${
                        favorites.includes(agent.id) 
                          ? 'text-red-400 bg-red-400/20' 
                          : 'text-muted-foreground hover:text-red-400'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-muted-foreground mb-4">{agent.description}</p>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="font-bold text-neon-400">${agent.totalEarnings.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Total Earnings</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-400">{agent.successRate}%</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-yellow-400">{agent.rating}⭐</div>
                      <div className="text-xs text-muted-foreground">Rating</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {agent.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-cyber-500/20 text-cyber-400 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-electric-400">
                      ${agent.price}
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-outline flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button 
                        onClick={() => handlePurchase(agent)}
                        className="btn-cyber flex items-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Agents Grid */}
        <div className="mb-8">
          <h2 className="heading-3 mb-6">
            All Agents ({filteredAgents.length})
          </h2>
          
          {filteredAgents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent) => (
                <div key={agent.id} className="agent-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(agent.type)}
                      <div>
                                                 <div className="flex items-center gap-2">
                           <h3 className="font-bold">{agent.name}</h3>
                           {agent.verified && (
                             <Award className="w-4 h-4 text-blue-400" />
                           )}
                         </div>
                        <p className="text-sm text-muted-foreground">by {agent.owner}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(agent.id)}
                      className={`p-1 rounded transition-colors ${
                        favorites.includes(agent.id) 
                          ? 'text-red-400' 
                          : 'text-muted-foreground hover:text-red-400'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {agent.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Total Earnings:</span>
                      <span className="font-bold text-neon-400">
                        ${agent.totalEarnings.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Success Rate:</span>
                      <span className="font-bold text-green-400">{agent.successRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Rating:</span>
                      <span className="font-bold text-yellow-400">{agent.rating}⭐</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Sales:</span>
                      <span className="text-muted-foreground">{agent.purchases}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-electric-400">
                      ${agent.price}
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-outline text-sm py-1 px-3">
                        Preview
                      </button>
                      <button 
                        onClick={() => handlePurchase(agent)}
                        className="btn-cyber text-sm py-1 px-3"
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No agents found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters.
              </p>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="card-cyber p-8 text-center">
          <h2 className="heading-3 mb-4">Want to Sell Your Agent?</h2>
          <p className="text-muted-foreground mb-6">
            List your successful AI agents on the marketplace and earn passive income from sales.
          </p>
          <Link href="/create-agent" className="btn-cyber">
            Create Agent to Sell
          </Link>
        </div>
      </div>
    </div>
  )
}