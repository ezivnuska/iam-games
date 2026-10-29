// app/lib/api/socket-rate-limiter.ts

interface SocketRateLimitConfig {
  maxEvents: number;
  windowMs: number;
}

interface SocketRateLimitEntry {
  count: number;
  resetTime: number;
}

const socketRateLimitStore = new Map<string, SocketRateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of socketRateLimitStore.entries()) {
    if (entry.resetTime < now) {
      socketRateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export function checkSocketRateLimit(
  userId: string,
  eventType: string,
  config: SocketRateLimitConfig
): { isLimited: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `${userId}:${eventType}`;

  let entry = socketRateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime: now + config.windowMs };
    socketRateLimitStore.set(key, entry);
  }

  entry.count++;

  const isLimited = entry.count > config.maxEvents;
  const remaining = Math.max(0, config.maxEvents - entry.count);

  return { isLimited, remaining, resetTime: entry.resetTime };
}

export const SOCKET_RATE_LIMITS = {
  GAME_ACTION: { maxEvents: 30, windowMs: 60 * 1000 },
  TIMER: { maxEvents: 60, windowMs: 60 * 1000 },
  DESTRUCTIVE: { maxEvents: 5, windowMs: 60 * 1000 },
} as const;
