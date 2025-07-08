# 🧪 Complete Testing Guide - Agent Empire

## Overview
This guide provides step-by-step instructions to test all production-ready features of Agent Empire, from basic functionality to advanced AI agent operations.

## 🚀 Quick Start Testing

### 1. Basic Server Test
```bash
# Start the development server
npm run dev

# Test if server is running
curl http://localhost:3000
# Should return the landing page HTML
```

### 2. Authentication Test
```bash
# Visit the dashboard (should redirect to login)
open http://localhost:3000/dashboard

# Sign up for a new account
open http://localhost:3000/signup
```

### 3. Agent Creation Test
```bash
# Create an agent through the UI
open http://localhost:3000/create-agent

# Or test the API directly
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{
    "name": "Test Trading Bot",
    "type": "trading", 
    "personality": "analytical",
    "goals": "Maximize profit with low risk",
    "riskTolerance": "medium",
    "maxBudget": 1000,
    "tradingPairs": ["BTCUSDT", "ETHUSDT"]
  }'
```

## 🤖 AI Agent Engine Testing

### 1. Create and Test Agent
```bash
# Create a test agent
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat cookies.txt)" \
  -d '{"action": "create_test_agent"}'

# Expected response:
# {
#   "message": "Test agent created",
#   "agentId": "test_agent_1234567890",
#   "config": {...}
# }
```

### 2. Start Agent Engine
```bash
# Start the agent orchestration engine
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat cookies.txt)" \
  -d '{"action": "start_engine"}'

# Expected response:
# {
#   "message": "Agent engine started",
#   "status": {
#     "isRunning": true,
#     "totalAgents": 1,
#     "runningAgents": 1
#   }
# }
```

### 3. Monitor Agent Activity
```bash
# Check agent status and execution history
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat cookies.txt)" \
  -d '{"action": "get_status"}'

# Monitor for 2-3 minutes to see agent executions
# Expected: Agents should execute every 30 seconds with decisions logged
```

## 📊 Trading Engine Testing

### 1. Market Data Test
Open browser console on dashboard and run:
```javascript
// Test market data fetching
fetch('/api/market/data?symbols=BTCUSDT,ETHUSDT')
  .then(res => res.json())
  .then(data => console.log('Market Data:', data))
```

### 2. Paper Trading Test
```bash
# Create a trading agent and monitor its paper trades
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat cookies.txt)" \
  -d '{
    "action": "create_test_agent",
    "type": "trading",
    "personality": "aggressive"
  }'

# Watch console logs for trade executions
# Expected: Paper trades should execute with realistic slippage
```

## 🎭 AI Decision Making Test

### 1. Test Different Agent Personalities
```bash
# Create conservative agent
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_test_agent",
    "personality": "conservative"
  }'

# Create aggressive agent  
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_test_agent", 
    "personality": "aggressive"
  }'

# Compare their decision patterns over time
```

### 2. Test AI Context Awareness
```bash
# Monitor agent decisions during different market conditions
# Expected: Agents should adapt their strategies based on:
# - RSI indicators
# - Market trends (bullish/bearish/sideways)
# - Portfolio balance
# - Risk tolerance settings
```

## 🛡️ Security & Validation Testing

### 1. Authentication Security
```bash
# Test unauthorized access
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -d '{"action": "get_status"}'
# Expected: 401 Unauthorized

# Test with invalid session
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -H "Cookie: invalid-session" \
  -d '{"action": "get_status"}'
# Expected: 401 Unauthorized
```

### 2. Input Validation Testing
```bash
# Test invalid agent data
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat cookies.txt)" \
  -d '{
    "name": "",
    "type": "invalid_type",
    "personality": ""
  }'
# Expected: 400 Bad Request with validation errors

# Test SQL injection attempts
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat cookies.txt)" \
  -d '{
    "name": "Robert\'; DROP TABLE agents; --",
    "type": "trading"
  }'
# Expected: Input should be sanitized
```

### 3. Rate Limiting Test
```bash
# Rapid fire requests to test rate limiting
for i in {1..110}; do
  curl -X GET http://localhost:3000/api/agents/test
done
# Expected: Should start returning 429 Too Many Requests after 100 requests
```

## 🔧 Performance Testing

### 1. Load Testing with Multiple Agents
```bash
# Create multiple agents
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/agents/test \
    -H "Content-Type: application/json" \
    -H "Cookie: $(cat cookies.txt)" \
    -d "{\"action\": \"create_test_agent\", \"name\": \"Agent $i\"}"
done

# Start engine and monitor performance
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat cookies.txt)" \
  -d '{"action": "start_engine"}'

# Monitor system resources: CPU, memory, database connections
```

### 2. Database Performance Test
```bash
# Check database performance with agent operations
npx prisma studio
# Open Prisma Studio and monitor query performance

# Run multiple agent creations simultaneously
seq 1 10 | xargs -P 10 -I {} curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat cookies.txt)" \
  -d '{"action": "create_test_agent"}'
```

## 🎨 Frontend Testing

### 1. UI Component Testing
```bash
# Test agent creation wizard
open http://localhost:3000/create-agent
# Steps to test:
# 1. Select agent type
# 2. Configure personality  
# 3. Set risk parameters
# 4. Review and create
# 5. Verify redirect to dashboard with success message
```

### 2. Dashboard Functionality
```bash
# Test dashboard features
open http://localhost:3000/dashboard
# Features to test:
# 1. Agent list displays correctly
# 2. Real-time updates of agent metrics
# 3. Agent control buttons (start/stop/manage)
# 4. Links to marketplace and stats work
# 5. Responsive design on mobile
```

### 3. Marketplace Testing
```bash
# Test agent marketplace
open http://localhost:3000/marketplace
# Features to test:
# 1. Search and filter functionality
# 2. Agent cards display correctly
# 3. Sorting options work
# 4. Purchase flow (mock)
# 5. Favorites system
```

## 📈 Analytics & Monitoring Testing

### 1. Agent Metrics Test
```bash
# Check agent performance tracking
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat cookies.txt)" \
  -d '{"action": "get_agent_history", "agentId": "your-agent-id"}'

# Expected: Detailed execution history with:
# - Decision types and confidence levels
# - Execution outcomes (success/failure)
# - Profit/loss tracking
# - Execution times
```

### 2. System Health Monitoring
```bash
# Check overall system status
curl -X GET http://localhost:3000/api/health
# Expected: System health metrics including:
# - Database connection status
# - Agent engine status
# - API response times
# - Error rates
```

## 🚨 Error Handling Testing

### 1. Network Failure Simulation
```bash
# Temporarily disable internet to test offline handling
# Agents should gracefully handle API failures
# Expected: Fallback decisions when OpenAI API unavailable
```

### 2. Database Connection Errors
```bash
# Stop database temporarily
sudo systemctl stop postgresql
# Test agent operations
# Expected: Proper error messages, no crashes
```

### 3. AI API Failures
```bash
# Test with invalid OpenAI API key
# Edit .env.local temporarily with invalid key
# Expected: Fallback decision making, proper error logging
```

## 📋 Production Readiness Checklist

### ✅ Core Functionality
- [ ] User authentication works
- [ ] Agent creation and storage  
- [ ] AI decision making operational
- [ ] Trading engine functional
- [ ] Paper trading working
- [ ] Agent orchestration running
- [ ] Database operations stable

### ✅ Security
- [ ] Input validation implemented
- [ ] Authentication required for all operations
- [ ] Rate limiting active
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CORS properly configured

### ✅ Performance  
- [ ] Page load times < 2 seconds
- [ ] API response times < 500ms
- [ ] Agent execution cycle stable
- [ ] Database queries optimized
- [ ] Memory usage reasonable
- [ ] No memory leaks detected

### ✅ Error Handling
- [ ] Graceful API failure handling
- [ ] Database error recovery
- [ ] User-friendly error messages
- [ ] Comprehensive logging
- [ ] Error monitoring setup

### ✅ User Experience
- [ ] Intuitive navigation
- [ ] Responsive design
- [ ] Loading states implemented
- [ ] Success/error feedback
- [ ] Accessibility features
- [ ] Mobile compatibility

## 🔍 Advanced Testing Scenarios

### 1. Multi-User Testing
```bash
# Test with multiple users simultaneously
# Each creating and running agents
# Check for resource conflicts and data isolation
```

### 2. Long-Running Stability Test
```bash
# Run agents continuously for 24+ hours
# Monitor for memory leaks, performance degradation
# Check database growth and optimization
```

### 3. Market Condition Testing
```bash
# Test agent behavior during:
# - High volatility periods
# - Market crashes
# - Extended sideways markets
# - Different time zones/trading sessions
```

## 📊 Expected Test Results

### Performance Benchmarks
- **Page Load**: < 2 seconds
- **API Response**: < 500ms average
- **Agent Execution**: 30-second intervals consistently
- **Database Queries**: < 100ms average
- **Memory Usage**: < 512MB per process

### Reliability Metrics  
- **Uptime**: > 99.5%
- **Agent Success Rate**: > 95%
- **Error Rate**: < 1%
- **Data Integrity**: 100%

### Security Standards
- **Authentication**: All endpoints protected
- **Input Validation**: All inputs sanitized
- **Rate Limiting**: 100 requests/15min
- **Encryption**: All sensitive data encrypted

---

## 🎯 Testing Tips

1. **Test in Order**: Start with basic functionality before advanced features
2. **Monitor Logs**: Always check console output for errors/warnings
3. **Use Real Data**: Test with actual market conditions when possible
4. **Document Issues**: Keep track of any bugs or unexpected behavior
5. **Performance Baseline**: Establish baseline metrics for comparison

**Happy Testing! 🚀**