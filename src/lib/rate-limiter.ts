import { NextRequest } from 'next/server'

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

interface RequestRecord {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (in production, use Redis)
const requestStore = new Map<string, RequestRecord>()

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests } = options

  return async (request: NextRequest): Promise<{ success: boolean; remainingRequests?: number; resetTime?: number }> => {
    const now = Date.now()
    const key = getClientKey(request)
    
    // Clean up expired entries
    for (const [k, record] of requestStore.entries()) {
      if (record.resetTime <= now) {
        requestStore.delete(k)
      }
    }

    const record = requestStore.get(key)

    if (!record || record.resetTime <= now) {
      // First request or window expired
      requestStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return {
        success: true,
        remainingRequests: maxRequests - 1,
        resetTime: now + windowMs
      }
    }

    if (record.count >= maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        remainingRequests: 0,
        resetTime: record.resetTime
      }
    }

    // Increment counter
    record.count++
    requestStore.set(key, record)

    return {
      success: true,
      remainingRequests: maxRequests - record.count,
      resetTime: record.resetTime
    }
  }
}

function getClientKey(request: NextRequest): string {
  // Try to get real IP from various headers (for production with proxies)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'
  
  return `rate_limit:${ip}`
}

// Predefined rate limiters for different endpoints
export const rateLimiters = {
  auth: rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5 }), // 5 requests per 15 minutes
  webhook: rateLimit({ windowMs: 60 * 1000, maxRequests: 100 }), // 100 requests per minute
  api: rateLimit({ windowMs: 60 * 1000, maxRequests: 60 }), // 60 requests per minute
  public: rateLimit({ windowMs: 60 * 1000, maxRequests: 30 }) // 30 requests per minute
}