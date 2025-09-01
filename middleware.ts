import { NextRequest, NextResponse } from 'next/server'
import { isEndpointEnabled, getCorsConfig } from './src/lib/config/production'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    const corsConfig = getCorsConfig()
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': corsConfig.origin.includes(request.headers.get('origin') || '') 
            ? request.headers.get('origin') || '*' 
            : corsConfig.origin[0],
          'Access-Control-Allow-Methods': corsConfig.methods.join(', '),
          'Access-Control-Allow-Headers': corsConfig.allowedHeaders.join(', '),
          'Access-Control-Allow-Credentials': corsConfig.credentials.toString(),
          'Access-Control-Max-Age': corsConfig.maxAge.toString()
        }
      })
    }
    
    // Check if endpoint should be available in current environment
    if (!isEndpointEnabled(pathname)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Endpoint not available in production environment',
          message: 'This endpoint is disabled in production for security reasons'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': corsConfig.origin.includes(request.headers.get('origin') || '') 
              ? request.headers.get('origin') || '*' 
              : corsConfig.origin[0],
            'Access-Control-Allow-Credentials': corsConfig.credentials.toString()
          }
        }
      )
    }
    
    // Add CORS headers to API responses
    const response = NextResponse.next()
    response.headers.set(
      'Access-Control-Allow-Origin', 
      corsConfig.origin.includes(request.headers.get('origin') || '') 
        ? request.headers.get('origin') || '*' 
        : corsConfig.origin[0]
    )
    response.headers.set('Access-Control-Allow-Credentials', corsConfig.credentials.toString())
    
    return response
  }
  
  // Security headers for all requests
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
    "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
    "img-src 'self' data: blob: https://replicate.delivery https://res.cloudinary.com https://*.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self' https://api.replicate.com https://generativelanguage.googleapis.com https://*.supabase.co https://api.cloudinary.com",
    "media-src 'self' blob: https://replicate.delivery https://res.cloudinary.com https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match only API routes to avoid interfering with auth pages
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth routes (to prevent auth conflicts)
     */
    '/api/((?!auth).*)',
  ],
}
