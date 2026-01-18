# Quick Start Guide - Test in 3 Minutes

## 1. Install Dependencies
```bash
npm install
```

## 2. Create `.env.local` File
Create a file named `.env.local` in the root directory with:
```
GEMINI_API_KEY=your_api_key_here
```

## 3. Install New Dependencies
```bash
npm install
```

## 4. Start Server
```bash
npm run dev
```

Wait for: `🚀 Server running on http://localhost:3000`

## 4. Test in Postman

**Request Setup:**
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/chat`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "message": "What is your name?"
  }
  ```

**Expected Response:**
```json
{
  "reply": "My name is Muhammad Awais Asad...",
  "source": "knowledge_base"
}
```

## That's it! ✅

For more detailed instructions, see [TESTING.md](TESTING.md)
