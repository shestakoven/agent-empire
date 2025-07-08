import { NextRequest, NextResponse } from 'next/server'
import { AgentEngine } from '@/lib/agents/AgentEngine'

// Store active test agents
const testAgents = new Map<string, AgentEngine>()

export async function POST(request: NextRequest) {
  try {
    const { action, agentId, ...params } = await request.json()
    
    switch (action) {
      case 'create':
        return await createTestAgent(params)
      case 'start':
        return await startAgent(agentId)
      case 'stop':
        return await stopAgent(agentId)
      case 'status':
        return await getAgentStatus(agentId)
      case 'portfolio':
        return await getAgentPortfolio(agentId)
      case 'memory':
        return await getAgentMemory(agentId)
      case 'trigger':
        return await triggerAnalysis(agentId)
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}

async function createTestAgent(params: any) {
  const agentId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  
  const agentConfig = {
    agentId,
    name: params.name || 'Test Agent',
    type: params.type || 'trading',
    personality: params.personality || 'analytical',
    goals: params.goals || ['Maximize returns', 'Minimize risk'],
    riskTolerance: params.riskTolerance || 0.1,
    maxBudget: params.maxBudget || 1000
  }
  
  const agent = new AgentEngine(agentConfig)
  testAgents.set(agentId, agent)
  
  console.log(`🧪 Test agent created: ${agentId}`)
  
  return NextResponse.json({
    success: true,
    agentId,
    config: agentConfig,
    message: 'Test agent created successfully. Use /start to begin trading.'
  })
}

async function startAgent(agentId: string) {
  const agent = testAgents.get(agentId)
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }
  
  await agent.start()
  
  return NextResponse.json({
    success: true,
    message: `Agent ${agentId} started successfully`,
    status: agent.getStatus()
  })
}

async function stopAgent(agentId: string) {
  const agent = testAgents.get(agentId)
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }
  
  agent.stop()
  
  return NextResponse.json({
    success: true,
    message: `Agent ${agentId} stopped successfully`
  })
}

async function getAgentStatus(agentId: string) {
  const agent = testAgents.get(agentId)
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }
  
  const status = agent.getStatus()
  const portfolio = await agent.getPortfolio()
  
  return NextResponse.json({
    agentId,
    status,
    portfolio,
    timestamp: new Date().toISOString()
  })
}

async function getAgentPortfolio(agentId: string) {
  const agent = testAgents.get(agentId)
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }
  
  const portfolio = await agent.getPortfolio()
  
  return NextResponse.json({
    agentId,
    portfolio,
    timestamp: new Date().toISOString()
  })
}

async function getAgentMemory(agentId: string) {
  const agent = testAgents.get(agentId)
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }
  
  const memory = await agent.getMemory()
  
  return NextResponse.json({
    agentId,
    memory,
    timestamp: new Date().toISOString()
  })
}

async function triggerAnalysis(agentId: string) {
  const agent = testAgents.get(agentId)
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }
  
  await agent.triggerAnalysis()
  
  return NextResponse.json({
    success: true,
    message: 'Manual analysis triggered',
    status: agent.getStatus()
  })
}

export async function GET() {
  const agents = Array.from(testAgents.entries()).map(([id, agent]) => ({
    id,
    status: agent.getStatus()
  }))
  
  return NextResponse.json({
    totalAgents: agents.length,
    agents,
    timestamp: new Date().toISOString()
  })
}