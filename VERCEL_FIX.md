# Vercel Root URL 404 Fix

## Issue
Getting 404 on root URL: `https://portfolio-chatbot-api-bay.vercel.app/`

## Solution Applied
1. ✅ Added rewrite rule in `vercel.json` to serve `/index.html` at root `/`
2. ✅ Verified `public/index.html` exists

## Check These Steps

### 1. Verify Files Are Committed
Make sure all files are committed to Git:
```bash
git status
git add public/index.html
git add vercel.json
git commit -m "Fix root URL - add rewrite rule"
git push
```

### 2. Check Vercel Deployment
1. Go to Vercel Dashboard → Your Project
2. Go to **Deployments** tab
3. Check latest deployment status
4. Look at **Build Logs** for any errors
5. Check **Functions** tab - should see:
   - `api/chat.js`
   - `api/info.js`
   - `api/health.js`

### 3. Verify File Structure in Deployment
In Vercel dashboard → **Deployments** → Latest → **Source**, verify:
- `public/index.html` exists
- `vercel.json` exists
- `api/` folder contains all functions

### 4. Test URLs After Deployment

**Root URL** (should show HTML):
```
https://portfolio-chatbot-api-bay.vercel.app/
```

**API Info** (should show JSON):
```
https://portfolio-chatbot-api-bay.vercel.app/api
https://portfolio-chatbot-api-bay.vercel.app/api/info
```

**Health Check** (should show JSON):
```
https://portfolio-chatbot-api-bay.vercel.app/api/health
```

**Chat Endpoint** (POST request):
```
https://portfolio-chatbot-api-bay.vercel.app/api/chat
```

### 5. If Still Getting 404

**Option A: Check if public folder is ignored**
Check `.gitignore` - `public/` should NOT be ignored

**Option B: Alternative approach - Use serverless function for root**
If static file doesn't work, we can create a serverless function at `api/index.js` that serves HTML

**Option C: Check Vercel Build Settings**
1. Go to Vercel Dashboard → Project Settings → General
2. Check **Root Directory** - should be empty or `./`
3. Check **Build Command** - should be empty or `npm install`
4. Check **Output Directory** - should be empty

### 6. Force Redeploy
If changes aren't showing:
1. Go to Vercel Dashboard → Deployments
2. Click **Redeploy** on latest deployment
3. Or push a new commit to trigger redeploy
