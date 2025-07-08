import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const agentData = await request.json()
    
    // Validate required fields
    if (!agentData.name || !agentData.type || !agentData.personality) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // For now, store in a simple JSON structure
    // In production, you'd have a proper agents table
    const agent = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: agentData.name,
      type: agentData.type,
      personality: agentData.personality,
      goals: agentData.goals || '',
      riskTolerance: agentData.riskTolerance || 'medium',
      maxBudget: agentData.maxBudget || 100,
      tradingPairs: agentData.tradingPairs || [],
      socialPlatforms: agentData.socialPlatforms || [],
      automationTasks: agentData.automationTasks || [],
      status: 'active',
      createdAt: new Date().toISOString(),
      earnings: 0,
      userId: session.user.id
    }

    // In a real implementation, you'd save to a database
    // For now, we'll just return the agent data
    console.log('Agent created:', agent)

    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('Error creating agent:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For demo purposes, return some sample agents
    const sampleAgents = [
      {
        id: 'agent_sample_1',
        name: 'CryptoTrader Pro',
        type: 'trading',
        personality: 'analytical',
        status: 'active',
        earnings: 247.83,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        lastActivity: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        id: 'agent_sample_2', 
        name: 'ViralBot Supreme',
        type: 'content',
        personality: 'creative',
        status: 'active',
        earnings: 156.92,
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        lastActivity: new Date(Date.now() - 1800000).toISOString() // 30 min ago
      }
    ]

    return NextResponse.json(sampleAgents)
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}