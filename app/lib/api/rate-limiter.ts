// Core algorithm from @iam/shared-types — withRateLimit adapter stays here
// because it needs iam-games' own auth (getSessionUser vs NextAuth).
export { checkRateLimit, RATE_LIMITS } from '@iam/shared-types';
export type { RateLimitConfig } from '@iam/shared-types';

import { checkRateLimit } from '@iam/shared-types';
import type { RateLimitConfig } from '@iam/shared-types';

export function withRateLimit<T extends unknown[]>(
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
