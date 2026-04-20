/**
 * Rate limiter wrapper for Vercel compatibility
 * This file is in the api folder so it can be easily imported
 */

let rateLimiter;
let initPromise = null;

async function initRateLimiter() {
  if (rateLimiter) return rateLimiter;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      // Try importing from utils folder
      const rateLimiterModule = await import('../utils/rateLimiter.js');
      rateLimiter = rateLimiterModule;
      return rateLimiter;
    } catch (error) {
      // Fallback: rate limiter unavailable — log clearly and apply a conservative limit
      console.error('CRITICAL: Rate limiter module failed to load. Applying conservative fallback.', error.message);
      const fallbackCounts = new Map();
      rateLimiter = {
        getClientIP: (req) => {
          return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                 req.headers['x-real-ip'] ||
                 req.connection?.remoteAddress ||
                 'unknown';
        },
        checkRateLimitForIP: (ip) => {
          const now = Date.now();
          const entry = fallbackCounts.get(ip) || { count: 0, windowStart: now };
          if (now - entry.windowStart > 60000) {
            entry.count = 0;
            entry.windowStart = now;
          }
          entry.count++;
          fallbackCounts.set(ip, entry);
          const allowed = entry.count <= 10;
          return {
            allowed,
            remaining: Math.max(0, 10 - entry.count),
            resetAt: new Date(entry.windowStart + 60000),
            message: allowed ? null : 'Rate limit exceeded (fallback limiter).'
          };
        }
      };
      return rateLimiter;
    }
  })();
  
  return initPromise;
}

export async function getClientIP(req) {
  const limiter = await initRateLimiter();
  return limiter.getClientIP(req);
}

export async function checkRateLimitForIP(ip) {
  const limiter = await initRateLimiter();
  return limiter.checkRateLimitForIP(ip);
}
