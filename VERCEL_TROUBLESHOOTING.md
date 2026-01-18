# Vercel 404 Troubleshooting Guide

## 🔍 Step-by-Step Diagnosis

### Step 1: Verify Files Are Committed
```bash
# Check what's tracked by git
git ls-files | grep -E "api/|vercel.json|package.json"

# Should see:
# api/chat.js
# api/info.js
# api/health.js
# api/index.js
# api/_rateLimiter.js
# utils/rateLimiter.js
# vercel.json
# package.json
# knowledge.json
# Awais_CV.pdf
```

**If files are missing:**
```bash
git add api/
git add utils/
git add vercel.json
git add package.json
git add knowledge.json
git add Awais_CV.pdf
git commit -m "Add all required files for Vercel deployment"
git push
```

### Step 2: Check Vercel Dashboard

1. **Go to Vercel Dashboard** → Your Project
2. **Deployments Tab** → Latest Deployment
3. **Check Build Logs:**
   - Look for errors
   - Should see "Installing dependencies"
   - Should see "Building..."
   - Should complete successfully

4. **Check Functions Tab:**
   - Should list: `api/chat`, `api/info`, `api/health`, `api/index`
   - If empty → Functions not detected

5. **Check Runtime Logs:**
   - Click on a function
   - Check for runtime errors

### Step 3: Test Direct Function URLs

Try these URLs directly (bypass rewrites):
- `https://portfolio-chatbot-api-bay.vercel.app/api/chat`
- `https://portfolio-chatbot-api-bay.vercel.app/api/info`
- `https://portfolio-chatbot-api-bay.vercel.app/api/health`
- `https://portfolio-chatbot-api-bay.vercel.app/api/index`

**If these return 404:**
→ Functions not deployed (check Step 1 & 2)

**If these work but `/` doesn't:**
→ Rewrite rule issue (we'll fix this)

### Step 4: Check Vercel Project Settings

**Settings → General:**
- Framework Preset: **Other** (or empty)
- Root Directory: **(empty)**
- Build Command: **(empty or `npm install`)**
- Output Directory: **(empty)**
- Install Command: `npm install`

**Settings → Environment Variables:**
- Must have: `GEMINI_API_KEY`
- Optional: Rate limit settings

## 🛠️ Quick Fixes

### Fix 1: Simplify vercel.json
Remove rewrites temporarily to test:
```json
{
  "functions": {
    "api/chat.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

### Fix 2: Ensure All Files Committed
```bash
git add .
git status  # Verify all files are staged
git commit -m "Deploy to Vercel"
git push
```

### Fix 3: Force Redeploy
In Vercel Dashboard:
1. Go to Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"

## 📋 Checklist Before Deployment

- [ ] All `api/*.js` files exist and have `export default async function handler`
- [ ] `package.json` has `"type": "module"`
- [ ] `vercel.json` exists (can be minimal)
- [ ] All files committed to git
- [ ] `GEMINI_API_KEY` set in Vercel environment variables
- [ ] No build errors in Vercel logs
- [ ] Functions appear in Functions tab
