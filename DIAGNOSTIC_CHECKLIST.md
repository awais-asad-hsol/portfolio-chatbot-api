# Vercel 404 Diagnostic Checklist

## ⚠️ CRITICAL: Check These First

### 1. Verify Files Are Committed to Git
```bash
git status
git ls-files | grep -E "(api/|vercel.json|package.json|knowledge.json)"
```

**Required files MUST be committed:**
- ✅ `api/chat.js`
- ✅ `api/info.js`
- ✅ `api/health.js`
- ✅ `api/index.js`
- ✅ `api/_rateLimiter.js`
- ✅ `utils/rateLimiter.js`
- ✅ `knowledge.json`
- ✅ `Awais_CV.pdf`
- ✅ `package.json`
- ✅ `package-lock.json`
- ✅ `vercel.json`

### 2. Check Vercel Build Logs
1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on **latest deployment**
3. Check **Build Logs** tab
4. Look for errors like:
   - "Cannot find module"
   - "File not found"
   - "Build failed"

### 3. Check Vercel Functions Tab
1. In deployment details, go to **Functions** tab
2. Should see:
   - `api/chat.js`
   - `api/info.js`
   - `api/health.js`
   - `api/index.js`
3. If functions are missing → Files not deployed

### 4. Verify Vercel Project Settings
Go to **Settings** → **General**:
- **Framework Preset**: Other (or leave empty)
- **Root Directory**: (empty or `./`)
- **Build Command**: (empty or `npm install`)
- **Output Directory**: (empty)
- **Install Command**: `npm install`

### 5. Check Environment Variables
Go to **Settings** → **Environment Variables**:
- ✅ `GEMINI_API_KEY` must be set
- Optional: `RATE_LIMIT_PER_MINUTE`, `RATE_LIMIT_PER_HOUR`

### 6. Test Direct Function URLs
Try accessing functions directly (without rewrites):
- `https://portfolio-chatbot-api-bay.vercel.app/api/chat`
- `https://portfolio-chatbot-api-bay.vercel.app/api/info`
- `https://portfolio-chatbot-api-bay.vercel.app/api/health`
- `https://portfolio-chatbot-api-bay.vercel.app/api/index`

If these work but `/` doesn't → Rewrite rule issue
If these don't work → Function deployment issue

## Common Issues & Fixes

### Issue: All URLs return 404
**Possible Causes:**
1. Files not committed to Git
2. Build failing silently
3. Vercel not detecting `api/` folder
4. Wrong project root directory

**Fix:**
```bash
# Ensure all files are committed
git add .
git commit -m "Ensure all API files are committed"
git push

# Check Vercel deployment logs
```

### Issue: Functions show in dashboard but return 404
**Possible Causes:**
1. Runtime errors in functions
2. Import path issues
3. Missing dependencies

**Fix:** Check Function Logs in Vercel dashboard for runtime errors

### Issue: Build succeeds but functions don't exist
**Possible Causes:**
1. `vercel.json` misconfiguration
2. Files in wrong location
3. Git ignore patterns

**Fix:** Simplify `vercel.json` or remove it (Vercel auto-detects)
