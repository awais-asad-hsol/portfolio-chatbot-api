# Portfolio Chatbot API

A serverless backend API for a portfolio chatbot, deployed on Vercel. This API checks a local knowledge base first, then falls back to the Google Gemini API for unanswered queries.

## Features

- ✅ Serverless function optimized for Vercel
- ✅ Knowledge base integration with JSON-based Q&A
- ✅ Google Gemini API fallback for unanswered questions
- ✅ Secure environment variable handling
- ✅ CORS enabled for frontend integration
- ✅ Clean JSON response format
- ✅ **Rate limiting & security** - IP-based request limiting to prevent abuse
- ✅ **CV search** - Intelligent search through resume PDF
- ✅ **Smart question detection** - Only answers questions about Awais

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-pro  # Optional: gemini-pro, gemini-1.5-flash, or gemini-1.5-pro
GEMINI_API_VERSION=v1beta  # Optional: v1beta (default) or v1

# Rate Limiting Configuration (Optional)
RATE_LIMIT_PER_MINUTE=10  # Max requests per minute per IP (default: 10)
RATE_LIMIT_PER_HOUR=60    # Max requests per hour per IP (default: 60)
RATE_LIMIT_BLOCK_DURATION=600000  # Block duration in ms after limit exceeded (default: 10 minutes)
MAX_MESSAGE_LENGTH=1000   # Maximum message length in characters (default: 1000)
```

**Note:** The API will automatically try multiple models if one fails. It will:
1. Try newer models first (gemini-2.5-flash, gemini-3-flash-preview, etc.)
2. Fall back to older models if needed
3. Automatically list and try available models if all predefined ones fail

Common working models (2024):
- `gemini-2.5-flash` (recommended, fast and capable)
- `gemini-2.5-flash-lite` (lightweight)
- `gemini-3-flash-preview` or `gemini-3-pro-preview` (latest preview models)
- `gemini-1.5-flash` or `gemini-1.5-pro` (older but stable)

**Getting a Gemini API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env.local` file

**Note:** The `.env.local` file is already in `.gitignore` to prevent committing secrets.

### 3. Local Development

Run the development server:

```bash
npm install  # Install Express and other dependencies
npm run dev  # Start local server
```

The API will be available at `http://localhost:3000/api/chat`

**Note:** The dev server uses Express for local testing. For production, it will be deployed as a Vercel serverless function.

### 4. Deploy to Vercel

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

3. Set environment variables in Vercel:
   - Go to your project settings in Vercel dashboard
   - Navigate to "Environment Variables"
   - Add `GEMINI_API_KEY` with your API key value
   - Redeploy if needed

## Local Testing

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env.local` file:**
   ```bash
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Test with Postman or cURL:**
   - URL: `http://localhost:3000/api/chat`
   - Method: `POST`
   - Body: `{"message": "What is your name?"}`

📖 **See [TESTING.md](TESTING.md) for detailed Postman testing instructions.**

## API Usage

### Endpoint

```
POST /api/chat
```

### Request Format

```json
{
  "message": "What is your name?"
}
```

### Response Format

**Success (Knowledge Base):**
```json
{
  "reply": "I'm the portfolio chatbot assistant...",
  "source": "knowledge_base"
}
```

**Success (Gemini API):**
```json
{
  "reply": "Based on your question, I can help you with...",
  "source": "gemini_api"
}
```

**Error:**
```json
{
  "error": "Error message here"
}
```

### Example cURL Request

```bash
curl -X POST https://your-domain.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What technologies do you use?"}'
```

### Example JavaScript Fetch

```javascript
const response = await fetch('https://your-domain.vercel.app/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'What is your name?'
  })
});

const data = await response.json();
console.log(data.reply);
```

## Knowledge Base Structure

The `knowledge.json` file contains an array of Q&A items:

```json
{
  "items": [
    {
      "id": 1,
      "question": "What is your name?",
      "keywords": ["name", "who are you", "introduce"],
      "answer": "I'm the portfolio chatbot assistant..."
    }
  ]
}
```

- `id`: Unique identifier
- `question`: The main question (optional, for reference)
- `keywords`: Array of keywords that trigger this answer
- `answer`: The response text

The API uses simple keyword matching. You can enhance it with:
- Fuzzy matching libraries
- NLP libraries for better intent recognition
- Vector embeddings for semantic search

## Project Structure

```
portfolio-chatbot-api/
├── api/
│   └── chat.js          # Main serverless function
├── knowledge.json       # Knowledge base Q&A data
├── .env.example         # Example environment variables
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies
└── README.md           # This file
```

## Error Handling

The API handles various error scenarios:

- **400 Bad Request**: Invalid or missing message field
- **405 Method Not Allowed**: Non-POST requests
- **500 Internal Server Error**: API key missing or Gemini API errors

## Security Notes

- ✅ API key stored in environment variables (never in code)
- ✅ `.env` files excluded from Git
- ✅ CORS headers included for controlled access
- ⚠️ Consider adding rate limiting for production
- ⚠️ Consider adding authentication if needed

## Customization

### Update Knowledge Base

Edit `knowledge.json` to add more Q&A pairs relevant to your portfolio.

### Enhance Matching

Modify the `searchKnowledgeBase` function in `api/chat.js` to implement:
- Fuzzy string matching
- Natural language processing
- Vector similarity search
- Machine learning classifiers

### Customize Gemini Prompts

Modify the `callGeminiAPI` function to add system prompts or context:

```javascript
const prompt = `You are a helpful portfolio chatbot assistant. 
${userMessage}`;
```

## License

MIT
