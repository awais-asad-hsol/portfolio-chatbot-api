# Testing Guide - Portfolio Chatbot API

This guide will help you run the backend locally and test it using Postman.

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **npm** or **yarn**
3. **Postman** (download from https://www.postman.com/downloads/)

## Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

## Step 2: Create Environment File

Create a `.env.local` file in the root directory with your Gemini API key:

```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Getting a Gemini API Key:**
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Create a new API key
4. Copy and paste it in your `.env.local` file

**Note:** The `.env.local` file is already in `.gitignore`, so it won't be committed to Git.

## Step 4: Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

This will install Express, CORS, and dotenv for local development.

## Step 5: Start the Local Server

Run the development server:

```bash
npm run dev
```

You should see output like:
```
🚀 Server running on http://localhost:3000
📡 API endpoint: http://localhost:3000/api/chat
📝 Test with: POST http://localhost:3000/api/chat
```

The API will be available at: **http://localhost:3000/api/chat**

**Note:** The local dev server uses Express. For production deployment, use `npm run deploy` to deploy to Vercel.

## Step 6: Test with Postman

### Option A: Using Postman GUI

1. **Open Postman** and create a new request
2. **Set the method** to `POST`
3. **Enter the URL**: `http://localhost:3000/api/chat`
4. **Go to Headers tab** and add:
   - Key: `Content-Type`
   - Value: `application/json`
5. **Go to Body tab**:
   - Select `raw`
   - Select `JSON` from the dropdown
   - Enter the request body:
   ```json
   {
     "message": "What is your name?"
   }
   ```
6. **Click Send**

### Expected Response (Knowledge Base Match):

```json
{
  "reply": "My name is Muhammad Awais Asad. You can call me M Awais Asad. I'm a Full Stack Developer specializing in Laravel, Node.js, and modern web technologies.",
  "source": "knowledge_base"
}
```

### Expected Response (Gemini API Fallback):

```json
{
  "reply": "Based on your question... [AI generated response]",
  "source": "gemini_api"
}
```

## Step 6: Test Different Questions

Try these example requests:

### Test Knowledge Base (should return quickly):
```json
{
  "message": "What is your email?"
}
```

```json
{
  "message": "What skills do you have?"
}
```

```json
{
  "message": "Where are you located?"
}
```

### Test Gemini API Fallback (will call Gemini):
```json
{
  "message": "Tell me about your favorite programming language"
}
```

```json
{
  "message": "What's the weather like today?"
}
```

## Step 7: Import Postman Collection (Optional)

You can create a Postman Collection for easier testing:

1. In Postman, click **New** → **Collection**
2. Name it "Portfolio Chatbot API"
3. Create a new request in the collection
4. Use the settings from Step 5 above
5. Save the request

Or use this JSON to import:

```json
{
  "info": {
    "name": "Portfolio Chatbot API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Chat - Knowledge Base Test",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"message\": \"What is your name?\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/chat",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "chat"]
        }
      }
    },
    {
      "name": "Chat - Gemini API Test",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"message\": \"Tell me a joke\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/chat",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "chat"]
        }
      }
    }
  ]
}
```

## Troubleshooting

### Issue: "Cannot GET /api/chat"
- **Solution**: Make sure you're using `POST` method, not `GET`

### Issue: "GEMINI_API_KEY is not set"
- **Solution**: 
  1. Check that `.env.local` file exists in the root directory
  2. Verify the file contains `GEMINI_API_KEY=your_key_here`
  3. Restart the dev server after creating/editing the `.env.local` file

### Issue: "Error loading knowledge base"
- **Solution**: Make sure `knowledge.json` exists in the root directory

### Issue: Port 3000 already in use
- **Solution**: Set a different port using environment variable: `PORT=3001 npm run dev` or change the port in server.js

### Issue: "Module not found" errors
- **Solution**: Run `npm install` to install dependencies (Express, CORS, dotenv)

### Issue: "vercel dev must not recursively invoke itself"
- **Solution**: Use `npm run dev` which now uses Express for local development instead of Vercel CLI

## Testing with cURL (Alternative)

You can also test using cURL in your terminal:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What is your name?\"}"
```

## Response Status Codes

- **200 OK**: Successful request
- **400 Bad Request**: Invalid or missing message field
- **405 Method Not Allowed**: Using wrong HTTP method (use POST)
- **500 Internal Server Error**: Server error (check console for details)

## Next Steps

Once local testing works:
1. Deploy to Vercel using `npm run deploy`
2. Add `GEMINI_API_KEY` in Vercel dashboard environment variables
3. Test the deployed endpoint using your Vercel URL
