/**
 * Root endpoint for API health check and info
 * Accessible at: https://your-domain.vercel.app/api
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests for root endpoint
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed. Use GET.',
    });
  }

  return res.status(200).json({
    message: 'Portfolio Chatbot API is running',
    version: '1.0.0',
    endpoints: {
      chat: '/api/chat',
      method: 'POST',
      description: 'Send a message to the chatbot',
      example: {
        url: '/api/chat',
        method: 'POST',
        body: {
          message: 'What is your name?'
        }
      }
    },
    health: 'ok',
    timestamp: new Date().toISOString()
  });
}
