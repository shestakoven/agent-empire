# 🧪 Testing Real AI Agents

## Quick Test Guide

Your AI agents are now **actually functional**! Here's how to test them immediately:

### 1. Set Up Environment Variables

Add to your `.env.local`:

```bash
# Required for AI functionality
OPENAI_API_KEY=your_openai_api_key_here

# Optional - for enhanced features later
ANTHROPIC_API_KEY=your_anthropic_key
```

### 2. Start the Development Server

```bash
npm run dev
```

### 3. Test Your AI Agents

#### Create a Test Agent

```bash
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "name": "CryptoBot Alpha",
    "personality": "aggressive",
    "goals": ["Maximize returns", "Beat the market"],
    "riskTolerance": 0.15,
    "maxBudget": 2000
  }'
```

**Response:**
```json
{
  "success": true,
  "agentId": "test_1703123456789_abc12",
  "config": {
    "name": "CryptoBot Alpha",
    "personality": "aggressive",
    "goals": ["Maximize returns", "Beat the market"]
  },
  "message": "Test agent created successfully. Use /start to begin trading."
}
```

#### Start Your Agent

```bash
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start",
    "agentId": "test_1703123456789_abc12"
  }'
```

#### Check Agent Status

```bash
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -d '{
    "action": "status", 
    "agentId": "test_1703123456789_abc12"
  }'
```

**Response:**
```json
{
  "agentId": "test_1703123456789_abc12",
  "status": {
    "isRunning": true,
    "currentTask": "Waiting for next cycle",
    "lastDecision": {
      "action": "execute_trade",
      "parameters": {
        "action": "buy",
        "symbol": "BTC/USDT", 
        "amount": 100,
        "reasoning": "Technical indicators show bullish momentum with RSI oversold"
      },
      "confidence": 0.85
    },
    "cycleCount": 3,
    "performance": {
      "totalEarnings": 23.45,
      "totalTrades": 2,
      "successRate": 75
    }
  },
  "portfolio": {
    "holdings": {
      "USDT": 9876.54,
      "BTC": 0.002234
    },
    "totalValue": 9999.12,
    "paperTrading": true
  }
}
```

#### Trigger Manual Analysis

```bash
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -d '{
    "action": "trigger",
    "agentId": "test_1703123456789_abc12"
  }'
```

---

## 🎯 What You'll See

### Console Output

When your agent runs, you'll see real-time output like this:

```
🤖 Agent "CryptoBot Alpha" created with aggressive personality
🚀 Agent CryptoBot Alpha starting...

🔄 Agent CryptoBot Alpha - Cycle #1
💭 Current context:
   BTC Price: $43,234
   24h Change: +2.34%
   Portfolio Value: $10,000.00
   Trend: bullish
   Recommendation: Moderate uptrend - good time to buy

🧠 Agent Decision: execute_trade
📝 Reasoning: Market shows bullish momentum with positive 24h change. RSI indicates good entry point.
🎯 Confidence: 85.0%

💱 Executing trade...
📈 Paper Trade: Bought 0.002314 BTC for $100 at $43,277.23
✅ Trade successful!
   Order ID: paper_1703123456789_def45
   Price: $43,277.23

✅ Cycle #1 completed
```

### AI Decision Making

Your agents will make **real decisions** based on:

- ✅ **Live market data** (real BTC prices from Binance)
- ✅ **Technical analysis** (RSI, trends, volatility)
- ✅ **Risk management** (respects your risk tolerance)
- ✅ **Learning** (remembers past trades and outcomes)
- ✅ **Personality** (conservative vs aggressive trading styles)

---

## 🧠 AI Agent Personalities

### Conservative
- Lower risk tolerance
- Smaller position sizes
- Waits for strong signals
- Focus on capital preservation

### Aggressive  
- Higher risk tolerance
- Larger position sizes
- Acts on weaker signals
- Focus on maximum returns

### Analytical
- Data-driven decisions
- Multiple indicator analysis
- Systematic approach
- Balanced risk/reward

---

## 🔧 Advanced Testing

### Test Different Market Conditions

```bash
# Create multiple agents with different strategies
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "name": "Conservative Charlie",
    "personality": "conservative",
    "riskTolerance": 0.05,
    "maxBudget": 500
  }'

curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create", 
    "name": "Aggressive Alice",
    "personality": "aggressive",
    "riskTolerance": 0.25,
    "maxBudget": 5000
  }'
```

### Monitor Agent Memory

```bash
curl -X POST http://localhost:3000/api/agents/test \
  -H "Content-Type: application/json" \
  -d '{
    "action": "memory",
    "agentId": "test_1703123456789_abc12"
  }'
```

**Response:**
```json
{
  "agentId": "test_1703123456789_abc12",
  "memory": {
    "conversations": [
      "Decision: execute_trade - Market shows bullish momentum",
      "Decision: wait_and_observe - High volatility, waiting for clarity"
    ],
    "trades": [
      {
        "action": "buy",
        "symbol": "BTC/USDT",
        "amount": 100,
        "result": {
          "success": true,
          "profit": 12.34
        }
      }
    ],
    "learnings": [
      "Buying during moderate uptrends has 80% success rate",
      "High volatility periods are better for waiting"
    ],
    "performance": {
      "totalEarnings": 23.45,
      "successRate": 75,
      "riskScore": 0.15
    }
  }
}
```

---

## 🎮 Interactive Testing Commands

### Start/Stop Agents
```bash
# Start agent
curl -X POST http://localhost:3000/api/agents/test -H "Content-Type: application/json" -d '{"action": "start", "agentId": "YOUR_AGENT_ID"}'

# Stop agent  
curl -X POST http://localhost:3000/api/agents/test -H "Content-Type: application/json" -d '{"action": "stop", "agentId": "YOUR_AGENT_ID"}'
```

### View All Agents
```bash
curl http://localhost:3000/api/agents/test
```

### Agent Portfolio
```bash
curl -X POST http://localhost:3000/api/agents/test -H "Content-Type: application/json" -d '{"action": "portfolio", "agentId": "YOUR_AGENT_ID"}'
```

---

## 🚀 Next Steps: Enable Real Trading

⚠️ **Currently in Paper Trading Mode** (safe for testing)

When ready for real trading:

1. **Get Exchange API Keys**:
   - Binance API key/secret
   - Coinbase Pro credentials
   - Start with small amounts!

2. **Add to Environment**:
   ```bash
   BINANCE_API_KEY=your_key
   BINANCE_SECRET=your_secret
   ```

3. **Enable Real Trading**:
   ```bash
   curl -X POST http://localhost:3000/api/agents/test \
     -H "Content-Type: application/json" \
     -d '{"action": "enable_real_trading", "agentId": "YOUR_AGENT_ID"}'
   ```

---

## 🎉 What You've Built

Your agents now have **real AI capabilities**:

✅ **Autonomous Decision Making** - Uses GPT-4 to analyze and decide  
✅ **Real Market Data** - Live prices from Binance API  
✅ **Risk Management** - Respects your risk parameters  
✅ **Learning & Memory** - Improves from past experiences  
✅ **Paper Trading** - Safe testing environment  
✅ **Multiple Personalities** - Different trading styles  
✅ **Technical Analysis** - RSI, trends, recommendations  
✅ **Portfolio Management** - Tracks holdings and performance  

**This is no longer just a UI mockup - these are real, functional AI trading agents!**

---

## 🐛 Troubleshooting

### Agent Not Making Decisions
- Check OpenAI API key is set
- Verify agent is running: `{"action": "status"}`
- Check console for error messages

### Trades Not Executing  
- Ensure paper trading is enabled (safe mode)
- Check risk tolerance settings
- Verify sufficient portfolio balance

### API Errors
- Restart development server
- Check network connection for market data
- Verify all environment variables

---

**Ready to see your AI agents make real trading decisions? Run the commands above! 🚀**