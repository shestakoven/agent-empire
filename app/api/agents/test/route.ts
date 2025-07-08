import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import agentEngine from '@/lib/agents/agent-engine'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { action, agentId } = await request.json()

    switch (action) {
      case 'start_engine':
        await agentEngine.startEngine()
        return NextResponse.json({ 
          message: 'Agent engine started',
          status: agentEngine.getEngineStatus()
        })

      case 'stop_engine':
        await agentEngine.stopEngine()
        return NextResponse.json({ 
          message: 'Agent engine stopped',
          status: agentEngine.getEngineStatus()
        })

      case 'start_agent':
        if (!agentId) {
          return NextResponse.json({ message: 'Agent ID required' }, { status: 400 })
        }
        await agentEngine.startAgent(agentId)
        return NextResponse.json({ message: `Agent ${agentId} started` })

      case 'stop_agent':
        if (!agentId) {
          return NextResponse.json({ message: 'Agent ID required' }, { status: 400 })
        }
        await agentEngine.stopAgent(agentId)
        return NextResponse.json({ message: `Agent ${agentId} stopped` })

      case 'get_status':
        const status = agentEngine.getEngineStatus()
        const agents = agentEngine.getAllAgents()
        return NextResponse.json({ 
          engine: status,
          agents: agents.map(agent => ({
            id: agent.id,
            name: agent.name,
            type: agent.type,
            isActive: agent.isActive,
            metrics: agentEngine.getAgentMetrics(agent.id)
          }))
        })

      case 'get_agent_history':
        if (!agentId) {
          return NextResponse.json({ message: 'Agent ID required' }, { status: 400 })
        }
        const history = agentEngine.getAgentExecutionHistory(agentId)
        return NextResponse.json({ history })

      case 'create_test_agent':
        // Create a test trading agent
        const testAgentConfig = {
          id: `test_agent_${Date.now()}`,
          name: `Test Agent ${Date.now()}`,
          type: 'trading' as const,
          personality: {
            riskTolerance: 'medium' as const,
            decisionSpeed: 'medium' as const,
            learningRate: 'adaptive' as const,
            creativity: 5,
            analyticalDepth: 7
          },
          riskManagement: {
            maxPositionSize: 10,
            stopLossPercent: 5,
            takeProfitPercent: 15,
            maxDailyLoss: 100,
            maxOpenPositions: 3,
            allowedPairs: ['BTCUSDT', 'ETHUSDT']
          },
          goals: 'Test autonomous trading with conservative approach',
          maxBudget: 1000,
          tradingPairs: ['BTCUSDT', 'ETHUSDT'],
          isActive: true,
          userId: session.user.id
        }

        const newAgentId = await agentEngine.createAgent(testAgentConfig)
        return NextResponse.json({ 
          message: 'Test agent created',
          agentId: newAgentId,
          config: testAgentConfig
        })

      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Agent test API error:', error)
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
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

    // Return agent engine status and available test commands
    const status = agentEngine.getEngineStatus()
    const agents = agentEngine.getAllAgents()

    return NextResponse.json({
      engine: status,
      agents: agents.length,
      activeAgents: agents.filter(a => a.isActive).length,
      availableCommands: [
        'start_engine',
        'stop_engine', 
        'start_agent',
        'stop_agent',
        'get_status',
        'get_agent_history',
        'create_test_agent'
      ],
      testInstructions: {
        createTestAgent: 'POST /api/agents/test with { "action": "create_test_agent" }',
        startEngine: 'POST /api/agents/test with { "action": "start_engine" }',
        stopAgent: 'POST /api/agents/test with { "action": "stop_agent", "agentId": "agent_id" }',
        getStatus: 'POST /api/agents/test with { "action": "get_status" }'
      }
    })
  } catch (error) {
    console.error('Agent test API error:', error)
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}