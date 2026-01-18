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
      // Fallback: create simple rate limiter
      console.warn('Rate limiter from utils not available, using fallback:', error.message);
      rateLimiter = {
        getClientIP: (req) => {
          return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                 req.headers['x-real-ip'] || 
                 req.connection?.remoteAddress || 
                 'unknown';
        },
        checkRateLimitForIP: () => ({ 
          allowed: true, 
          remaining: 999, 
          resetAt: new Date(), 
          message: null 
        })
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
