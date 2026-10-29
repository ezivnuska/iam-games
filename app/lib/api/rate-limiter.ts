// app/lib/api/rate-limiter.ts

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (request: Request, userId?: string) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export function checkRateLimit(
  request: Request,
  config: RateLimitConfig,
  userId?: string
): { isLimited: boolean; remaining: number; resetTime: number } {
  const now = Date.now();

  const key = config.keyGenerator
    ? config.keyGenerator(request, userId)
    : getDefaultKey(request, userId);

  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime: now + config.windowMs };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  const isLimited = entry.count > config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return { isLimited, remaining, resetTime: entry.resetTime };
}

function getDefaultKey(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`;

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return `ip:${ip}`;
}

export function withRateLimit<T extends any[]>(
  config: RateLimitConfig,
  handler: (request: Request, ...args: T) => Promise<Response>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    let userId: string | undefined;
    try {
      const { getSessionUser } = await import('@/app/lib/utils/auth');
      const user = await getSessionUser();
      userId = user?.id;
    } catch {
      // IP-based fallback
    }

    const { isLimited, remaining, resetTime } = checkRateLimit(request, config, userId);

    if (isLimited) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      return Response.json(
        { error: 'Too many requests', retryAfter },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          },
        }
      );
    }

    const response = await handler(request, ...args);

    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    headers.set('X-RateLimit-Remaining', remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

export const RATE_LIMITS = {
  GAME_ACTION: { maxRequests: 30, windowMs: 60 * 1000 },
  TIMER: { maxRequests: 60, windowMs: 60 * 1000 },
  READ: { maxRequests: 120, windowMs: 60 * 1000 },
  DESTRUCTIVE: { maxRequests: 5, windowMs: 60 * 1000 },
} as const;
