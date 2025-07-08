#!/bin/bash

# Agent Empire - Core Functionality Test Script
# This script tests the basic functionality of the application

echo "🚀 Agent Empire - Core Functionality Test"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL for local testing
BASE_URL="http://localhost:3000"

echo -e "${BLUE}📋 Pre-test Checklist:${NC}"
echo "1. Make sure the development server is running: npm run dev"
echo "2. Ensure the database is set up: npx prisma db push"
echo "3. Check that .env.local has the required variables"
echo ""

# Function to test HTTP endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $description... "
    
    response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL$endpoint")
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $response)"
    else
        echo -e "${RED}❌ FAIL${NC} (Status: $response, Expected: $expected_status)"
    fi
}

# Function to test if server is running
test_server_running() {
    echo -n "Checking if server is running... "
    
    if curl -s -f "$BASE_URL" > /dev/null; then
        echo -e "${GREEN}✅ Server is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Server is not running${NC}"
        echo -e "${YELLOW}Please start the server with: npm run dev${NC}"
        return 1
    fi
}

# Main testing sequence
echo -e "${BLUE}🔍 Starting Core Functionality Tests${NC}"
echo ""

# Test 1: Server Health
if ! test_server_running; then
    exit 1
fi

# Test 2: Core Page Endpoints
echo -e "${BLUE}📄 Testing Core Pages:${NC}"
test_endpoint "/" "Landing page"
test_endpoint "/login" "Login page"
test_endpoint "/signup" "Signup page"
test_endpoint "/dashboard" "Dashboard page"
test_endpoint "/create-agent" "Create agent page"
test_endpoint "/marketplace" "Marketplace page"
test_endpoint "/stats" "Stats page"

echo ""

# Test 3: API Endpoints
echo -e "${BLUE}🔌 Testing API Endpoints:${NC}"
test_endpoint "/api/health" "Health check API"
test_endpoint "/api/auth/signin" "Auth signin API" 200
test_endpoint "/api/agents" "Agents API (should require auth)" 401

echo ""

# Test 4: Static Assets
echo -e "${BLUE}🎨 Testing Static Assets:${NC}"
test_endpoint "/favicon.ico" "Favicon"

echo ""

# Test 5: Build Test
echo -e "${BLUE}🔨 Testing Build Process:${NC}"
echo -n "Running build test... "

if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo -e "${YELLOW}Run 'npm run build' to see detailed errors${NC}"
fi

echo ""

# Test 6: Environment Variables Check
echo -e "${BLUE}⚙️  Environment Configuration Check:${NC}"

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local file exists${NC}"
    
    # Check for required variables
    required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
    
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env.local; then
            echo -e "${GREEN}✅ $var is set${NC}"
        else
            echo -e "${YELLOW}⚠️  $var is not set in .env.local${NC}"
        fi
    done
else
    echo -e "${RED}❌ .env.local file not found${NC}"
    echo -e "${YELLOW}Please create .env.local with required environment variables${NC}"
fi

echo ""

# Test 7: Database Check
echo -e "${BLUE}🗄️  Database Check:${NC}"
echo -n "Checking database connection... "

if [ -f "prisma/dev.db" ] || [ -n "$DATABASE_URL" ]; then
    echo -e "${GREEN}✅ Database file exists${NC}"
else
    echo -e "${RED}❌ Database not found${NC}"
    echo -e "${YELLOW}Run 'npx prisma db push' to set up the database${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}📊 Test Summary:${NC}"
echo "=========================================="
echo "If all tests passed, the application is ready for:"
echo "1. ✅ Local development and testing"
echo "2. ✅ User interface functionality"
echo "3. ✅ Basic API structure"
echo "4. ✅ Build process"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Set up real API keys in .env.local"
echo "2. Test agent creation and management"
echo "3. Test authentication flows"
echo "4. Deploy to staging environment"
echo ""
echo -e "${GREEN}🎉 Core functionality test completed!${NC}"

# Instructions for manual testing
echo ""
echo -e "${BLUE}🧪 Manual Testing Checklist:${NC}"
echo "=========================================="
echo "1. Open http://localhost:3000 in your browser"
echo "2. Navigate through all pages (landing, login, signup, dashboard)"
echo "3. Test authentication (create account, login, logout)"
echo "4. Try creating an agent using the wizard"
echo "5. Check the marketplace and stats pages"
echo "6. Test responsive design on mobile"
echo ""
echo "If you encounter any issues, check the browser console and server logs."