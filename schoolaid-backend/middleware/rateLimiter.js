const { rateLimitStore } = require('../stores/memoryStores');

function rateLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > 60000) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return next();
  }

  if (entry.count >= 10) {
    return res.status(429).json({ success: false, message: 'Too many requests. Please slow down.' });
  }

  entry.count++;
  next();
}

module.exports = rateLimiter;
