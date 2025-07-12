// RUTA: src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['es', 'en'],
  defaultLocale: 'es'
});

export default function middleware(request: NextRequest) {
  // Skip i18n middleware for API routes (especially NextAuth)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Apply i18n middleware first for non-API routes
  const response = intlMiddleware(request);
  
  // If no response from i18n middleware, create a new one
  const finalResponse = response || NextResponse.next();

  // Add security headers to all responses
  finalResponse.headers.set('X-Content-Type-Options', 'nosniff');
  finalResponse.headers.set('X-Frame-Options', 'DENY');
  finalResponse.headers.set('X-XSS-Protection', '1; mode=block');
  finalResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  finalResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (HTTP Strict Transport Security) - only for HTTPS
  if (request.nextUrl.protocol === 'https:') {
    finalResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // CSP (Content Security Policy)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.belvo.com https://*.vercel.app",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  finalResponse.headers.set('Content-Security-Policy', csp);

  // API-specific security
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Remove potential information disclosure headers
    finalResponse.headers.delete('Server');
    finalResponse.headers.delete('X-Powered-By');
    
    // Enhanced logging for security-sensitive routes
    if (request.nextUrl.pathname.includes('/auth') || 
        request.nextUrl.pathname.includes('/cron') ||
        request.nextUrl.pathname.includes('/webhook')) {
      const clientIp = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      console.log(`[SECURITY] ${request.method} ${request.nextUrl.pathname} from ${clientIp}`);
    }
  }

  return finalResponse;
}

export const config = {
  // Coincide con todas las rutas excepto las que son archivos, rutas internas de Next.js,
  // y rutas de autenticación de NextAuth
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)']
};