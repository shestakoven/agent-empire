'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bot, TrendingUp, DollarSign, Clock, Zap } from 'lucide-react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [agents, setAgents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [justCreated, setJustCreated] = useState('')

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) router.push('/signup') // No session, redirect
    
    // Check if agent was just created
    const createdId = searchParams.get('created')
    if (createdId) {
      setJustCreated(createdId)
      // Clear the query param
      router.replace('/dashboard')
    }
    
    // Fetch agents
    fetchAgents()
  }, [session, status, router, searchParams])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      if (response.ok) {
        const agentsData = await response.json()
        setAgents(agentsData)
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyber-400"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="card-cyber p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="heading-1 gradient-text mb-2">
                  Welcome to Agent Empire
                </h1>
                <p className="text-muted-foreground">
                  Hello {session.user?.name || session.user?.email}! You've successfully signed in.
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-outline"
              >
                Sign Out
              </button>
            </div>

            {/* Success Message */}
            {justCreated && (
              <div className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6 text-green-400" />
                  <div>
                    <h3 className="font-bold text-green-400">Agent Created Successfully!</h3>
                    <p className="text-green-200">Your new AI agent is now active and ready to work.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="feature-card">
                <h3 className="text-xl font-bold mb-4">🤖 Create New Agent</h3>
                <p className="text-muted-foreground mb-4">
                  Design an AI agent that trades crypto or creates content automatically.
                </p>
                <Link href="/create-agent" className="btn-cyber">
                  Create Agent
                </Link>
              </div>

              <div className="feature-card">
                <h3 className="text-xl font-bold mb-4">📊 View Analytics</h3>
                <p className="text-muted-foreground mb-4">
                  Track your agents' performance and earnings in real-time.
                </p>
                <button className="btn-outline">
                  View Stats
                </button>
              </div>

              <div className="feature-card">
                <h3 className="text-xl font-bold mb-4">🏪 Agent Marketplace</h3>
                <p className="text-muted-foreground mb-4">
                  Buy and sell successful AI agents with other users.
                </p>
                <button className="btn-outline">
                  Browse Market
                </button>
              </div>
            </div>

            {/* Your Agents */}
            <div className="card-cyber p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your AI Agents</h2>
                <Link href="/create-agent" className="btn-outline">
                  + Create New
                </Link>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-400 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your agents...</p>
                </div>
              ) : agents.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {agents.map((agent: any) => (
                    <div key={agent.id} className="agent-card">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-cyber-500/20">
                            {agent.type === 'trading' ? <DollarSign className="w-6 h-6 text-cyber-400" /> :
                             agent.type === 'content' ? <TrendingUp className="w-6 h-6 text-purple-400" /> :
                             <Zap className="w-6 h-6 text-blue-400" />}
                          </div>
                          <div>
                            <h3 className="font-bold">{agent.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {agent.type} • {agent.personality}
                            </p>
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          agent.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                        }`}></div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Earnings:</span>
                          <span className="font-bold text-neon-400">+${agent.earnings?.toFixed(2) || '0.00'}</span>
                        </div>
                        
                        {agent.lastActivity && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Last Activity:</span>
                            <span className="text-sm">
                              {new Date(agent.lastActivity).toLocaleString()}
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          <button className="btn-outline flex-1 text-sm py-2">
                            View Details
                          </button>
                          <button className="btn-cyber flex-1 text-sm py-2">
                            Manage
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Agents Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first AI agent to start earning money automatically.
                  </p>
                  <Link href="/create-agent" className="btn-cyber">
                    Create Your First Agent
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="card-cyber p-6">
            <h2 className="text-2xl font-bold mb-4">Authentication Test Results</h2>
            <div className="space-y-4">
              <div className="p-4 bg-green-900/50 border border-green-500 rounded-md">
                <p className="text-green-200">✅ Authentication is working!</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-background border border-border rounded-md">
                  <h3 className="font-bold mb-2">User Information:</h3>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(session.user, null, 2)}
                  </pre>
                </div>
                
                <div className="p-4 bg-background border border-border rounded-md">
                  <h3 className="font-bold mb-2">Session Status:</h3>
                  <p className="text-sm">Status: <span className="text-cyber-400">{status}</span></p>
                  <p className="text-sm">User ID: <span className="text-cyber-400">{session.user?.id}</span></p>
                  <p className="text-sm">Email: <span className="text-cyber-400">{session.user?.email}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}