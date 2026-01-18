# Vercel Deployment Guide

## Quick Fix for 404 Error

If you're getting a 404 error on `/api/chat`, follow these steps:

### 1. Check Vercel Build Logs

1. Go to your Vercel dashboard
2. Click on your project
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Check the **Build Logs** for any errors

### 2. Verify File Structure

Make sure your repository has this structure:
```
portfolio-chatbot-api/
├── api/
│   ├── chat.js          ✅ (Must exist)
│   └── _rateLimiter.js  ✅ (Helper file)
├── utils/
│   └── rateLimiter.js   ✅ (Rate limiter implementation)
├── knowledge.json       ✅ (Knowledge base)
├── Awais_CV.pdf         ✅ (CV file)
├── package.json         ✅ (Dependencies)
└── vercel.json          ✅ (Optional config)
```

### 3. Verify Environment Variables

In Vercel dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add these variables:
   - `GEMINI_API_KEY` - Your Gemini API key
   - `RATE_LIMIT_PER_MINUTE` (optional, default: 10)
   - `RATE_LIMIT_PER_HOUR` (optional, default: 60)
   - `MAX_MESSAGE_LENGTH` (optional, default: 1000)

### 4. Common Issues and Solutions

#### Issue: "Cannot find module '../utils/rateLimiter.js'"

**Solution:** The files should be included in your Git repository. Make sure:
- `utils/rateLimiter.js` is committed to Git
- Files are not in `.gitignore`

#### Issue: "Cannot find module 'pdf-parse'"

**Solution:** Make sure `pdf-parse` is in your `package.json` dependencies:
```bash
npm install pdf-parse
```

Then commit `package.json` and `package-lock.json`.

#### Issue: "Cannot read file 'knowledge.json'"

**Solution:** Make sure `knowledge.json` and `Awais_CV.pdf` are:
- Committed to Git
- Not in `.gitignore`
- In the root directory

### 5. Test Deployment

After deploying, test with:
```bash
curl -X POST https://your-domain.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is your name?"}'
```

### 6. Redeploy

After making changes:
1. Commit and push to your repository
2. Vercel will automatically redeploy
3. Or manually trigger a redeploy from the Vercel dashboard

### 7. Check Function Logs

1. Go to Vercel dashboard → Your project → **Deployments**
2. Click on latest deployment
3. Click on **Functions** tab
4. Check for any runtime errors

## Troubleshooting

### If API still returns 404:

1. **Check the deployment URL**: Make sure you're using the correct domain
2. **Check build success**: Ensure the build completed without errors
3. **Check function exists**: In Vercel dashboard, verify `/api/chat` appears in Functions list
4. **Check Node.js version**: Ensure you're using Node.js 18+ (check `package.json`)

### If you see errors in logs:

- **Module not found**: Make sure all dependencies are in `package.json`
- **File not found**: Make sure all required files are committed to Git
- **Environment variable missing**: Add required env vars in Vercel dashboard

## Manual Deployment

If automatic deployment isn't working:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or from project directory
npx vercel --prod
```
