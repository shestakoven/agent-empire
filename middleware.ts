import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Security headers
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'off',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob:;
    connect-src 'self' https://api.openai.com https://api.binance.com wss: ws:;
    frame-src 'self' https://vercel.live;
  `.replace(/\s+/g, ' ').trim()
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX = 100 // requests per window
const RATE_LIMIT_API_MAX = 50 // stricter for API routes

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Get client IP
  const ip = getClientIP(request)
  const pathname = request.nextUrl.pathname

  // Apply rate limiting
  if (shouldRateLimit(pathname)) {
    const rateLimitResult = checkRateLimit(ip, pathname)
    
    if (rateLimitResult.blocked) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': getMaxRequests(pathname).toString(),
            'X-RateLimit-Remaining': Math.max(0, getMaxRequests(pathname) - rateLimitResult.count).toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            ...Object.fromEntries(Object.entries(securityHeaders))
          }
        }
      )
    }

    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', getMaxRequests(pathname).toString())
    response.headers.set('X-RateLimit-Remaining', Math.max(0, getMaxRequests(pathname) - rateLimitResult.count).toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
  }

  // Block suspicious requests
  if (isSuspiciousRequest(request)) {
    return new NextResponse(
      JSON.stringify({ error: 'Request blocked' }),
      { 
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(Object.entries(securityHeaders))
        }
      }
    )
  }

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
      ? (process.env.APP_URL || 'https://your-domain.com')
      : '*'
    )
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Max-Age', '86400')
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers })
  }

  return response
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = request.headers.get('x-client-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || clientIP || request.ip || 'unknown'
}

function shouldRateLimit(pathname: string): boolean {
  // Apply rate limiting to API routes and sensitive pages
  return pathname.startsWith('/api/') || 
         pathname.startsWith('/auth/') ||
         pathname === '/signup' ||
         pathname === '/login'
}

function getMaxRequests(pathname: string): number {
  if (pathname.startsWith('/api/')) {
    return RATE_LIMIT_API_MAX
  }
  return RATE_LIMIT_MAX
}

function checkRateLimit(ip: string, pathname: string): { 
  blocked: boolean
  count: number
  resetTime: number 
} {
  const key = `${ip}:${pathname.startsWith('/api/') ? 'api' : 'web'}`
  const now = Date.now()
  const maxRequests = getMaxRequests(pathname)
  
  let record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    }
    rateLimitStore.set(key, record)
    return { blocked: false, count: 1, resetTime: record.resetTime }
  }
  
  record.count++
  rateLimitStore.set(key, record)
  
  return {
    blocked: record.count > maxRequests,
    count: record.count,
    resetTime: record.resetTime
  }
}

function isSuspiciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''
  const pathname = request.nextUrl.pathname
  
  // Block common bot patterns
  const suspiciousBots = [
    'curl/', 'wget/', 'python-requests/', 'scrapy/',
    'bot', 'crawler', 'spider', 'scraper'
  ]
  
  const isSuspiciousBot = suspiciousBots.some(pattern => 
    userAgent.toLowerCase().includes(pattern)
  )
  
  // Allow curl for development and testing
  if (process.env.NODE_ENV === 'development' && userAgent.includes('curl/')) {
    return false
  }
  
  // Block suspicious paths
  const suspiciousPaths = [
    '/wp-admin', '/admin', '/.env', '/config',
    '/phpmyadmin', '/wp-login', '/xmlrpc.php'
  ]
  
  const hasSuspiciousPath = suspiciousPaths.some(path => 
    pathname.includes(path)
  )
  
  // Block requests with no user agent in production
  const hasNoUserAgent = process.env.NODE_ENV === 'production' && !userAgent
  
  // Block requests with suspicious query parameters
  const url = request.nextUrl
  const hasSuspiciousQuery = Array.from(url.searchParams.keys()).some(key =>
    key.includes('script') || key.includes('eval') || key.includes('exec')
  )
  
  return isSuspiciousBot || hasSuspiciousPath || hasNoUserAgent || hasSuspiciousQuery
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of Array.from(rateLimitStore.entries())) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}