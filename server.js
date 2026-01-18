/**
 * Local development server for testing the API
 * This wraps the Vercel serverless function for easy local testing
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import handler from './api/chat.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Convert Express req/res to Vercel format and handle response
async function handleRequest(req, res) {
  // Create Vercel-compatible request object
  const vercelReq = {
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query,
    url: req.url,
  };

  // Create Vercel-compatible response object
  const vercelRes = {
    statusCode: 200,
    headers: {},
    
    status(code) {
      this.statusCode = code;
      return this;
    },
    
    json(data) {
      // Set headers first
      Object.keys(this.headers).forEach(key => {
        res.setHeader(key, this.headers[key]);
      });
      res.status(this.statusCode).json(data);
      return this;
    },
    
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    
    end(data) {
      // Set headers first
      Object.keys(this.headers).forEach(key => {
        res.setHeader(key, this.headers[key]);
      });
      
      if (data) {
        res.status(this.statusCode).send(data);
      } else {
        res.status(this.statusCode).end();
      }
      return this;
    }
  };

  try {
    await handler(vercelReq, vercelRes);
  } catch (error) {
    console.error('Handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

// API endpoint
app.post('/api/chat', handleRequest);

// Handle OPTIONS for CORS preflight
app.options('/api/chat', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Portfolio Chatbot API is running',
    endpoint: '/api/chat',
    method: 'POST'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`📝 Test with: POST http://localhost:${PORT}/api/chat`);
  console.log(`\n⚠️  Make sure you have created .env.local with GEMINI_API_KEY\n`);
});
