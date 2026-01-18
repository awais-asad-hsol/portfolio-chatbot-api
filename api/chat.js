/**
 * Serverless API endpoint for Portfolio Chatbot
 * Handles POST requests with user messages, checks knowledge base first,
 * then falls back to Gemini API if no answer found.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import pdfParse from 'pdf-parse';

// Import rate limiter
import { checkRateLimitForIP, getClientIP } from '../utils/rateLimiter.js';

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

// Cache for CV text
let cvText = null;

/**
 * Loads and parses the CV PDF
 * @returns {Promise<string>} - The text content of the CV
 */
async function loadCVText() {
  if (cvText) {
    return cvText;
  }
  
  try {
    const cvPath = join(process.cwd(), 'Awais_CV.pdf');
    const pdfBuffer = readFileSync(cvPath);
    const data = await pdfParse(pdfBuffer);
    cvText = data.text;
    return cvText;
  } catch (error) {
    console.error('Error loading CV PDF:', error);
    return '';
  }
}

/**
 * Searches the knowledge base for a relevant answer with improved matching
 * @param {string} userMessage - The user's message
 * @returns {string|null} - The answer if found, null otherwise
 */
function searchKnowledgeBase(userMessage) {
  const lowerMessage = userMessage.toLowerCase().trim();
  
  // Normalize variations of common words
  const normalizedMessage = lowerMessage
    .replace(/\bexpertise\b/g, 'expertise specialization skills')
    .replace(/\bspecialization\b/g, 'specialization expertise skills')
    .replace(/\bexpert\b/g, 'expertise specialization skills')
    .replace(/\bwhat can you do\b/g, 'skills technologies');
  
  // Try exact keyword matches first
  for (const item of knowledgeBase.items) {
    // Check if any keyword matches
    const matchedKeyword = item.keywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase()) || normalizedMessage.includes(keyword.toLowerCase())
    );
    
    if (matchedKeyword) {
      return item.answer;
    }
    
    // Also check if the question itself matches
    if (item.question) {
      const lowerQuestion = item.question.toLowerCase();
      if (lowerMessage.includes(lowerQuestion) || normalizedMessage.includes(lowerQuestion)) {
        return item.answer;
      }
    }
  }
  
  // Try fuzzy matching on answer content
  const searchTerms = normalizedMessage.split(/\s+/).filter(term => term.length > 3);
  for (const item of knowledgeBase.items) {
    const lowerAnswer = item.answer.toLowerCase();
    const matches = searchTerms.filter(term => lowerAnswer.includes(term));
    // If multiple search terms match the answer, likely relevant
    if (matches.length >= Math.min(2, searchTerms.length)) {
      return item.answer;
    }
  }
  
  return null;
}

/**
 * Checks if a question is about Awais or his professional background
 * @param {string} userMessage - The user's message
 * @returns {boolean} - True if question is about Awais
 */
function isQuestionAboutAwais(userMessage) {
  const lowerMessage = userMessage.toLowerCase().trim();
  
  // Common patterns that indicate questions about Awais
  const aboutAwaisPatterns = [
    /\b(your|you|yourself|awais|muhammad|asad)\b/,
    /\b(what|who|where|when|how)\s+(are|is|do|did|can|have|will)\s+(you|your|awais)\b/,
    /\b(tell\s+me\s+about|describe|explain)\s+(your|you|awais)\b/,
    /\b(your|you)\s+(name|email|phone|skills|experience|education|projects|work|job|company|expertise|specialization|background)\b/,
    /\b(what|tell\s+me)\s+(about|are)\s+(your|you)\b/,
  ];
  
  // Check if question contains patterns about Awais
  const isAboutAwais = aboutAwaisPatterns.some(pattern => pattern.test(lowerMessage));
  
  // Also check for professional/work-related terms that would be about Awais
  const professionalTerms = [
    'skills', 'experience', 'education', 'projects', 'work', 'job', 'company',
    'expertise', 'specialization', 'technologies', 'languages', 'frameworks',
    'portfolio', 'cv', 'resume', 'background', 'career', 'qualifications'
  ];
  
  const hasProfessionalTerm = professionalTerms.some(term => lowerMessage.includes(term));
  
  // Exclude general knowledge questions
  const generalKnowledgePatterns = [
    /\bwhat\s+is\s+(pakistan|india|country|city|place|location|definition|meaning)\b/i,
    /\bwho\s+is\s+(not\s+awais|not\s+you|someone\s+else)\b/i,
    /\bexplain\s+(pakistan|country|general\s+concept)\b/i,
  ];
  
  const isGeneralKnowledge = generalKnowledgePatterns.some(pattern => pattern.test(lowerMessage));
  
  // Return true only if it's about Awais AND not general knowledge
  return (isAboutAwais || hasProfessionalTerm) && !isGeneralKnowledge;
}

/**
 * Searches the CV PDF for relevant information
 * @param {string} userMessage - The user's message
 * @returns {Promise<string|null>} - Relevant excerpt from CV or null
 */
async function searchCV(userMessage) {
  try {
    // First check if the question is actually about Awais
    if (!isQuestionAboutAwais(userMessage)) {
      console.log('Question is not about Awais, skipping CV search');
      return null;
    }
    
    const cvContent = await loadCVText();
    if (!cvContent) {
      return null;
    }
    
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // Extract meaningful keywords (exclude common words and very short words)
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'where', 'when', 'why', 'how', 'about', 'tell', 'me'];
    const keywords = lowerMessage
      .split(/\s+/)
      .filter(term => term.length > 3 && !stopWords.includes(term.toLowerCase()));
    
    if (keywords.length === 0) {
      return null;
    }
    
    // Look for sections that contain multiple relevant keywords
    // Split CV into meaningful sections (by headers or double newlines)
    const sections = cvContent.split(/\n\s*\n/).filter(section => section.trim().length > 50);
    
    let bestMatch = null;
    let bestMatchScore = 0;
    
    for (const section of sections) {
      const lowerSection = section.toLowerCase();
      
      // Count how many keywords match in this section
      const matches = keywords.filter(keyword => lowerSection.includes(keyword.toLowerCase()));
      const matchScore = matches.length / keywords.length; // Percentage of keywords matched
      
      // Require at least 50% of keywords to match, or at least 2 keywords
      if (matchScore >= 0.5 || matches.length >= 2) {
        if (matchScore > bestMatchScore) {
          bestMatchScore = matchScore;
          bestMatch = section.trim();
        }
      }
    }
    
    // If we found a good match, return it
    if (bestMatch && bestMatchScore > 0) {
      // Return a clean excerpt (limit to 400 characters for better responses)
      const excerpt = bestMatch.substring(0, 400);
      return excerpt + (excerpt.length < bestMatch.length ? '...' : '');
    }
    
    // If no good section match, try to find specific lines with multiple keywords
    const lines = cvContent.split('\n').filter(line => line.trim().length > 20);
    const relevantLines = [];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      const matches = keywords.filter(keyword => lowerLine.includes(keyword.toLowerCase()));
      // Require at least 2 keywords or 50% match
      if (matches.length >= 2 || (matches.length / keywords.length) >= 0.5) {
        relevantLines.push(line.trim());
        if (relevantLines.length >= 3) break; // Limit to 3 most relevant lines
      }
    }
    
    if (relevantLines.length > 0) {
      return relevantLines.join(' ').substring(0, 400);
    }
    
    return null;
  } catch (error) {
    console.error('Error searching CV:', error);
    return null;
  }
}

/**
 * Tries to call Gemini API with a specific model and version
 * @param {string} userMessage - The user's message
 * @param {string} apiKey - The Gemini API key
 * @param {string} model - The model name (e.g., 'gemini-pro')
 * @param {string} apiVersion - The API version (e.g., 'v1beta')
 * @param {string|null} context - Optional context/prompt to use instead of userMessage
 * @returns {Promise<Object>} - Result object with success/error
 */
async function tryGeminiAPICall(userMessage, apiKey, model, apiVersion, context = null) {
  const modelPath = model.startsWith('models/') ? model : `models/${model}`;
  const API_URL = `https://generativelanguage.googleapis.com/${apiVersion}/${modelPath}:generateContent`;
  
  // Create a prompt that provides context about Awais
  let prompt = userMessage;
  if (context) {
    prompt = context;
  } else {
    // Default context: Answer as/about Awais
    prompt = `You are a chatbot answering questions about Muhammad Awais Asad (also known as M Awais Asad or Awais), a Full Stack Software Engineer with 6+ years of experience specializing in Laravel, Vue.js, Node.js, and AI-powered systems.

Context about Awais:
- Name: Muhammad Awais Asad (M Awais Asad)
- Title: Senior Full-Stack Engineer
- Experience: 6+ years
- Specializations: Laravel, Vue.js, Node.js, AI-Powered Systems
- Location: Lahore, Pakistan
- Email: awaisasad20@gmail.com
- Phone: +92-332-4255688
- LinkedIn: https://www.linkedin.com/in/awais-asad
- GitHub: https://github.com/awais-asad-hsol

User Question: ${userMessage}

Please answer the question specifically about Awais based on the information provided. If you don't have information about Awais related to this question, say "I don't have specific information about this regarding Awais. Please feel free to contact him directly at awaisasad20@gmail.com for more details."`;
  }
  
  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData, status: response.status };
  }

  const data = await response.json();
  
  // Extract the text from the Gemini response
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
    const text = data.candidates[0].content.parts[0].text;
    if (text) {
      return { success: true, text };
    }
  }
  
  return { error: 'Invalid response format', data };
}

/**
 * Lists available models from Gemini API
 */
async function listAvailableModels(apiKey, apiVersion = 'v1beta') {
  try {
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      if (data.models) {
        return data.models.map(m => m.name.replace('models/', ''));
      }
    }
  } catch (error) {
    console.error('Error listing models:', error);
  }
  return [];
}

async function callGeminiAPI(userMessage, apiKey, cvContext = null) {
  // Try newer model names first (as of 2024)
  // These are the current valid models
  const attempts = [
    { model: 'gemini-2.5-flash', version: 'v1beta' },
    { model: 'gemini-2.5-flash-lite', version: 'v1beta' },
    { model: 'gemini-3-flash-preview', version: 'v1beta' },
    { model: 'gemini-3-pro-preview', version: 'v1beta' },
    { model: 'gemini-1.5-flash', version: 'v1beta' },
    { model: 'gemini-1.5-pro', version: 'v1beta' },
    { model: 'gemini-pro', version: 'v1beta' },
    // Try v1 as fallback
    { model: 'gemini-2.5-flash', version: 'v1' },
    { model: 'gemini-1.5-flash', version: 'v1' },
  ];

  // Check if user specified a custom model
  const customModel = process.env.GEMINI_MODEL;
  const customVersion = process.env.GEMINI_API_VERSION;
  
  if (customModel) {
    attempts.unshift({ 
      model: customModel, 
      version: customVersion || 'v1beta' 
    });
  }

  let lastError = null;
  let triedModels = [];

  for (const attempt of attempts) {
    console.log(`Trying Gemini API with model: ${attempt.model}, version: ${attempt.version}`);
    triedModels.push(`${attempt.model} (${attempt.version})`);
    
    // Build context with CV information if available
    let context = null;
    if (cvContext) {
      context = `You are a chatbot answering questions about Muhammad Awais Asad (also known as M Awais Asad or Awais), a Full Stack Software Engineer with 6+ years of experience.

Here is information from Awais's CV:
${cvContext}

User Question: ${userMessage}

Please answer the question specifically about Awais based on the CV information provided. If the CV doesn't contain relevant information, say "I don't have specific information about this regarding Awais in the available documents. Please feel free to contact him directly at awaisasad20@gmail.com for more details."`;
    }
    
    const result = await tryGeminiAPICall(userMessage, apiKey, attempt.model, attempt.version, context);
    
    if (result.success) {
      console.log(`✓ Success with model: ${attempt.model} (${attempt.version})`);
      return result.text;
    }
    
    lastError = result;
    
    // If it's not a 404 (model not found), don't try other models
    if (result.status && result.status !== 404) {
      throw new Error(
        `Gemini API error: ${result.status}. ${JSON.stringify(result.error)}`
      );
    }
  }

  // If all attempts failed, try to list available models
  console.log('All predefined models failed. Attempting to list available models...');
  try {
    const availableModels = await listAvailableModels(apiKey, 'v1beta');
    if (availableModels.length > 0) {
      console.log('Available models:', availableModels);
      // Try the first available model
      for (const modelName of availableModels) {
        console.log(`Trying available model: ${modelName}`);
        // Build context if available
        const context = cvContext ? `Context about Awais from CV:\n${cvContext}\n\nUser Question: ${userMessage}\n\nPlease answer specifically about Awais based on the CV context provided.` : null;
        const result = await tryGeminiAPICall(userMessage, apiKey, modelName, 'v1beta', context);
        if (result.success) {
          console.log(`✓ Success with available model: ${modelName}`);
          return result.text;
        }
      }
    }
  } catch (listError) {
    console.error('Could not list available models:', listError);
  }

  // If all attempts failed, throw the last error with helpful message
  throw new Error(
    `Gemini API error: All model attempts failed. Tried: ${triedModels.join(', ')}. ` +
    `Last error: ${JSON.stringify(lastError?.error || lastError)}. ` +
    `Please check your API key has access to Gemini models, or set GEMINI_MODEL environment variable to a valid model name.`
  );
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
    // Rate limiting check (for serverless functions)
    const clientIP = getClientIP(req);
    const rateLimitCheck = checkRateLimitForIP(clientIP);
    
    // Add rate limit headers
    const rateLimitPerMinute = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10');
    const rateLimitPerHour = parseInt(process.env.RATE_LIMIT_PER_HOUR || '60');
    res.setHeader('X-RateLimit-Limit-Minute', rateLimitPerMinute);
    res.setHeader('X-RateLimit-Limit-Hour', rateLimitPerHour);
    res.setHeader('X-RateLimit-Remaining', rateLimitCheck.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitCheck.resetAt.getTime() / 1000));
    
    if (!rateLimitCheck.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: rateLimitCheck.message,
        retryAfter: Math.ceil((rateLimitCheck.resetAt.getTime() - Date.now()) / 1000),
      });
    }
    
    // Validate request body
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid request. "message" field is required and must be a non-empty string.',
      });
    }
    
    // Additional validation: check message length to prevent abuse
    const MAX_MESSAGE_LENGTH = parseInt(process.env.MAX_MESSAGE_LENGTH || '1000');
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: 'Invalid request. Message is too long.',
        message: `Maximum message length is ${MAX_MESSAGE_LENGTH} characters.`,
      });
    }

    // Step 1: Check knowledge base first
    const knowledgeAnswer = searchKnowledgeBase(message);
    
    if (knowledgeAnswer) {
      return res.status(200).json({
        reply: knowledgeAnswer,
        source: 'knowledge_base',
      });
    }

    // Step 2: Search CV PDF if knowledge base doesn't have answer
    // Only search CV if the question seems to be about Awais
    console.log('No answer in knowledge base, checking if question is about Awais...');
    const cvAnswer = await searchCV(message);
    
    if (cvAnswer) {
      return res.status(200).json({
        reply: cvAnswer,
        source: 'cv',
      });
    }
    
    // If CV search didn't find anything, check if it's a general knowledge question
    // If so, return a polite "I don't know" message instead of using Gemini
    const lowerMessage = message.toLowerCase().trim();
    const isGeneralQuestion = /\b(what|who|where|when|why|how)\s+is\s+(pakistan|india|country|city|place|location|definition|meaning|the|a|an)\b/i.test(message) ||
                             /\bexplain\s+(pakistan|country|general|concept|definition)\b/i.test(message) ||
                             (!/\b(your|you|awais|muhammad|asad|tell\s+me\s+about\s+your|your\s+)\b/i.test(message) && 
                              !/\b(skills|experience|education|projects|work|job|company|expertise|specialization|technologies|portfolio|cv|resume|background|career)\b/i.test(message));
    
    if (isGeneralQuestion) {
      return res.status(200).json({
        reply: "I'm a chatbot designed to answer questions about Awais (Muhammad Awais Asad) - his skills, experience, projects, and professional background. I don't have information about general topics. If you have questions about Awais, feel free to ask! Otherwise, you can contact him directly at awaisasad20@gmail.com.",
        source: 'no_answer',
      });
    }

    // Step 3: If no answer found in knowledge base or CV, try Gemini API with context
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      // Return a helpful message instead of error
      return res.status(200).json({
        reply: "I couldn't find specific information about this in my knowledge base or CV. Please feel free to contact Awais directly at awaisasad20@gmail.com or call +92-332-4255688 for more details.",
        source: 'no_answer',
      });
    }

    // Try to get CV content for context
    let cvContext = null;
    try {
      const cvContent = await loadCVText();
      if (cvContent && cvContent.length > 0) {
        // Use relevant parts of CV as context
        cvContext = cvContent.substring(0, 3000); // Limit context size
      }
    } catch (error) {
      console.error('Error loading CV for context:', error);
    }

    // Call Gemini API with CV context
    console.log('No answer in CV, trying Gemini API with context...');
    try {
      const geminiResponse = await callGeminiAPI(message, apiKey, cvContext);
      
      return res.status(200).json({
        reply: geminiResponse,
        source: 'gemini_api',
      });
    } catch (error) {
      console.error('Gemini API error:', error);
      // If Gemini also fails, return a helpful message
      return res.status(200).json({
        reply: "I couldn't find specific information about this regarding Awais in my knowledge base, CV, or through AI assistance. Please feel free to contact Awais directly at awaisasad20@gmail.com or call +92-332-4255688 for more details.",
        source: 'no_answer',
      });
    }

  } catch (error) {
    console.error('Error processing chat request:', error);
    
    return res.status(500).json({
      error: 'An error occurred while processing your request.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
