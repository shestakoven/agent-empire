'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) router.push('/signup') // No session, redirect
  }, [session, status, router])

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

            <div className="grid md:grid-cols-3 gap-6">
              <div className="feature-card">
                <h3 className="text-xl font-bold mb-4">🤖 Create Your First Agent</h3>
                <p className="text-muted-foreground mb-4">
                  Design an AI agent that trades crypto or creates content automatically.
                </p>
                <button className="btn-cyber">
                  Create Agent
                </button>
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