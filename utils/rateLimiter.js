/**
 * Simple in-memory rate limiter for IP-based request limiting
 * For production with multiple instances, consider using Redis or Vercel's built-in rate limiting
 */

// Store request counts per IP
const requestCounts = new Map();

// Clean up old entries periodically
const CLEANUP_INTERVAL = 60000; // 1 minute
const MAX_ENTRY_AGE = 300000; // 5 minutes

/**
 * Rate limiter configuration
 */
const RATE_LIMIT_CONFIG = {
  // Max requests per window
  MAX_REQUESTS_PER_MINUTE: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10'),
  MAX_REQUESTS_PER_HOUR: parseInt(process.env.RATE_LIMIT_PER_HOUR || '60'),
  
  // Window sizes in milliseconds
  MINUTE_WINDOW: 60000, // 1 minute
  HOUR_WINDOW: 3600000, // 1 hour
  
  // Block duration after exceeding limit (milliseconds)
  BLOCK_DURATION: parseInt(process.env.RATE_LIMIT_BLOCK_DURATION || '600000'), // 10 minutes
};

/**
 * Get client IP address from request
 */
function getClientIP(req) {
  // Check various headers for IP (for proxies, load balancers, etc.)
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Clean up old entries from the request counts map
 */
function cleanupOldEntries() {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    // Remove entries older than MAX_ENTRY_AGE
    const oldestTimestamp = Math.min(
      data.minuteTimestamps[0] || now,
      data.hourTimestamps[0] || now,
      data.blockedUntil || 0
    );
    
    if (now - oldestTimestamp > MAX_ENTRY_AGE) {
      requestCounts.delete(ip);
    }
  }
}

// Start cleanup interval
setInterval(cleanupOldEntries, CLEANUP_INTERVAL);

/**
 * Check if IP is currently blocked
 */
function isBlocked(ip) {
  const data = requestCounts.get(ip);
  if (!data || !data.blockedUntil) {
    return false;
  }
  
  if (Date.now() < data.blockedUntil) {
    return true;
  }
  
  // Block expired, remove it
  data.blockedUntil = null;
  return false;
}

/**
 * Check and update rate limit for an IP address
 * @param {string} ip - Client IP address
 * @returns {Object} - { allowed: boolean, remaining: number, resetAt: Date, message: string }
 */
function checkRateLimit(ip) {
  const now = Date.now();
  let data = requestCounts.get(ip);
  
  // Initialize data if not exists
  if (!data) {
    data = {
      minuteTimestamps: [],
      hourTimestamps: [],
      blockedUntil: null,
    };
    requestCounts.set(ip, data);
  }
  
  // Check if IP is blocked
  if (isBlocked(ip)) {
    const blockedUntil = new Date(data.blockedUntil);
    return {
      allowed: false,
      remaining: 0,
      resetAt: blockedUntil,
      message: `Rate limit exceeded. Your IP has been temporarily blocked due to excessive requests. Please try again after ${blockedUntil.toLocaleTimeString()}.`,
    };
  }
  
  // Clean old timestamps outside the window
  data.minuteTimestamps = data.minuteTimestamps.filter(
    timestamp => now - timestamp < RATE_LIMIT_CONFIG.MINUTE_WINDOW
  );
  data.hourTimestamps = data.hourTimestamps.filter(
    timestamp => now - timestamp < RATE_LIMIT_CONFIG.HOUR_WINDOW
  );
  
  // Check minute limit
  if (data.minuteTimestamps.length >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE) {
    // Block the IP
    data.blockedUntil = now + RATE_LIMIT_CONFIG.BLOCK_DURATION;
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(now + RATE_LIMIT_CONFIG.BLOCK_DURATION),
      message: `Rate limit exceeded: Too many requests. Maximum ${RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE} requests per minute allowed. Your IP has been temporarily blocked.`,
    };
  }
  
  // Check hour limit
  if (data.hourTimestamps.length >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_HOUR) {
    // Block the IP
    data.blockedUntil = now + RATE_LIMIT_CONFIG.BLOCK_DURATION;
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(now + RATE_LIMIT_CONFIG.BLOCK_DURATION),
      message: `Rate limit exceeded: Too many requests. Maximum ${RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_HOUR} requests per hour allowed. Your IP has been temporarily blocked.`,
    };
  }
  
  // Add current request timestamp
  data.minuteTimestamps.push(now);
  data.hourTimestamps.push(now);
  
  // Calculate remaining requests
  const remainingMinute = RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE - data.minuteTimestamps.length;
  const remainingHour = RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_HOUR - data.hourTimestamps.length;
  const remaining = Math.min(remainingMinute, remainingHour);
  
  // Calculate reset time
  const oldestMinute = data.minuteTimestamps[0] || now;
  const oldestHour = data.hourTimestamps[0] || now;
  const resetAt = new Date(Math.min(
    oldestMinute + RATE_LIMIT_CONFIG.MINUTE_WINDOW,
    oldestHour + RATE_LIMIT_CONFIG.HOUR_WINDOW
  ));
  
  return {
    allowed: true,
    remaining,
    resetAt,
    message: null,
  };
}

/**
 * Express middleware for rate limiting
 */
export function rateLimitMiddleware(req, res, next) {
  const ip = getClientIP(req);
  const limitCheck = checkRateLimit(ip);
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit-Minute', RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE);
  res.setHeader('X-RateLimit-Limit-Hour', RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_HOUR);
  res.setHeader('X-RateLimit-Remaining', limitCheck.remaining);
  res.setHeader('X-RateLimit-Reset', Math.floor(limitCheck.resetAt.getTime() / 1000));
  
  if (!limitCheck.allowed) {
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({
      error: 'Too Many Requests',
      message: limitCheck.message,
      retryAfter: Math.ceil((limitCheck.resetAt.getTime() - Date.now()) / 1000),
    });
  }
  
  next();
}

/**
 * Standalone rate limit check (for serverless functions)
 */
export function checkRateLimitForIP(ip) {
  return checkRateLimit(ip);
}

export { getClientIP, RATE_LIMIT_CONFIG };
