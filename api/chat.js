/**
 * Serverless API endpoint for Portfolio Chatbot
 * Handles POST requests with user messages, checks knowledge base first,
 * then falls back to Gemini API if no answer found.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Load knowledge base - using sync read since this runs at function initialization
let knowledgeBase;
try {
  const knowledgePath = join(process.cwd(), 'knowledge.json');
  const knowledgeData = readFileSync(knowledgePath, 'utf8');
  knowledgeBase = JSON.parse(knowledgeData);
} catch (error) {
  console.error('Error loading knowledge base:', error);
  // Fallback to empty knowledge base if file can't be loaded
  knowledgeBase = { items: [] };
}

/**
 * Searches the knowledge base for a relevant answer
 * @param {string} userMessage - The user's message
 * @returns {string|null} - The answer if found, null otherwise
 */
function searchKnowledgeBase(userMessage) {
  const lowerMessage = userMessage.toLowerCase().trim();
  
  // Simple keyword matching - can be enhanced with fuzzy matching or NLP
  for (const item of knowledgeBase.items) {
    // Check if any keyword matches
    const matchedKeyword = item.keywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    if (matchedKeyword) {
      return item.answer;
    }
    
    // Also check if the question itself matches
    if (item.question && lowerMessage.includes(item.question.toLowerCase())) {
      return item.answer;
    }
  }
  
  return null;
}

/**
 * Calls the Gemini API to get a response
 * @param {string} userMessage - The user's message
 * @param {string} apiKey - The Gemini API key
 * @returns {Promise<string>} - The AI-generated response
 */
async function callGeminiAPI(userMessage, apiKey) {
  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  
  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: userMessage
        }]
      }]
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  
  // Extract the text from the Gemini response
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    return data.candidates[0].content.parts[0].text;
  }
  
  throw new Error('Invalid response format from Gemini API');
}

/**
 * Main handler function for Vercel serverless function
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    // Validate request body
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid request. "message" field is required and must be a non-empty string.',
      });
    }

    // First, check knowledge base
    const knowledgeAnswer = searchKnowledgeBase(message);
    
    if (knowledgeAnswer) {
      return res.status(200).json({
        reply: knowledgeAnswer,
        source: 'knowledge_base',
      });
    }

    // If no answer in knowledge base, use Gemini API
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return res.status(500).json({
        error: 'Server configuration error: API key not found.',
      });
    }

    // Call Gemini API
    const geminiResponse = await callGeminiAPI(message, apiKey);

    return res.status(200).json({
      reply: geminiResponse,
      source: 'gemini_api',
    });

  } catch (error) {
    console.error('Error processing chat request:', error);
    
    return res.status(500).json({
      error: 'An error occurred while processing your request.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
