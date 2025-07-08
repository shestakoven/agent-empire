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

    // Create agent in database
    const agent = await prisma.agent.create({
      data: {
        name: agentData.name,
        type: agentData.type,
        personality: agentData.personality,
        goals: agentData.goals || '',
        riskTolerance: agentData.riskTolerance || 'medium',
        maxBudget: agentData.maxBudget || 100,
        tradingPairs: agentData.tradingPairs ? JSON.stringify(agentData.tradingPairs) : null,
        socialPlatforms: agentData.socialPlatforms ? JSON.stringify(agentData.socialPlatforms) : null,
        automationTasks: agentData.automationTasks ? JSON.stringify(agentData.automationTasks) : null,
        status: 'active',
        earnings: 0,
        userId: session.user.id
      }
    })

    console.log('Agent created and saved to database:', agent)

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

    // Fetch user's agents from database
    const agents = await prisma.agent.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse JSON fields for frontend
    const agentsWithParsedData = agents.map(agent => ({
      ...agent,
      tradingPairs: agent.tradingPairs ? JSON.parse(agent.tradingPairs) : [],
      socialPlatforms: agent.socialPlatforms ? JSON.parse(agent.socialPlatforms) : [],
      automationTasks: agent.automationTasks ? JSON.parse(agent.automationTasks) : []
    }))

    return NextResponse.json(agentsWithParsedData)
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}