import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import webSocketServer from '@/lib/websocket/websocket-server'

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'No active session found',
        message: 'Please log in first'
      }, { status: 401 })
    }

    // Test WebSocket authentication with current session cookies
    const cookies = request.headers.get('cookie') || ''
    const authTest = await webSocketServer.testAuthentication(cookies)

    // Get authentication status
    const authStatus = webSocketServer.getAuthenticationStatus()

    return NextResponse.json({
      success: authTest.success,
      currentUser: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      websocketAuth: {
        success: authTest.success,
        user: authTest.user,
        error: authTest.error
      },
      authStatus: {
        nextAuthConfigured: authStatus.nextAuthConfigured,
        databaseConnected: authStatus.databaseConnected,
        jwtSecretConfigured: authStatus.jwtSecretConfigured,
        connectedUsers: authStatus.connectedUsers
      },
      recommendations: generateRecommendations(authStatus, authTest),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('WebSocket auth test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testCookies } = await request.json()

    if (!testCookies) {
      return NextResponse.json({
        success: false,
        error: 'No cookies provided',
        message: 'Provide cookies to test in the request body'
      }, { status: 400 })
    }

    // Test WebSocket authentication with provided cookies
    const authTest = await webSocketServer.testAuthentication(testCookies)
    const authStatus = webSocketServer.getAuthenticationStatus()

    return NextResponse.json({
      success: authTest.success,
      websocketAuth: {
        success: authTest.success,
        user: authTest.user,
        error: authTest.error
      },
      authStatus: {
        nextAuthConfigured: authStatus.nextAuthConfigured,
        databaseConnected: authStatus.databaseConnected,
        jwtSecretConfigured: authStatus.jwtSecretConfigured,
        connectedUsers: authStatus.connectedUsers
      },
      cookieAnalysis: analyzeCookies(testCookies),
      recommendations: generateRecommendations(authStatus, authTest),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('WebSocket auth test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function analyzeCookies(cookieString: string) {
  const cookies: Record<string, string> = {}
  
  cookieString.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) {
      cookies[name] = value.length > 50 ? value.substring(0, 50) + '...' : value
    }
  })

  const sessionTokens = Object.keys(cookies).filter(key => 
    key.includes('next-auth') && key.includes('session-token')
  )

  return {
    totalCookies: Object.keys(cookies).length,
    sessionTokensFound: sessionTokens,
    hasNextAuthSession: sessionTokens.length > 0,
    cookieNames: Object.keys(cookies),
    sampleCookies: cookies
  }
}

function generateRecommendations(authStatus: any, authTest: any): string[] {
  const recommendations: string[] = []

  if (!authStatus.nextAuthConfigured) {
    recommendations.push('Configure NextAuth properly in your application')
  }

  if (!authStatus.jwtSecretConfigured) {
    recommendations.push('Set NEXTAUTH_SECRET environment variable')
  }

  if (!authStatus.databaseConnected) {
    recommendations.push('Ensure database is connected and accessible')
  }

  if (!authTest.success) {
    if (authTest.error?.includes('No cookies')) {
      recommendations.push('Make sure you are logged in and have an active session')
    } else if (authTest.error?.includes('session')) {
      recommendations.push('Try logging out and logging back in to refresh your session')
    } else {
      recommendations.push('Check server logs for detailed authentication errors')
    }
  }

  if (authStatus.connectedUsers === 0) {
    recommendations.push('No users currently connected via WebSocket - try connecting a client')
  }

  if (recommendations.length === 0) {
    recommendations.push('WebSocket authentication is working correctly!')
  }

  return recommendations
}