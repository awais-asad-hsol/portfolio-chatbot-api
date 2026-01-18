# Vercel Configuration Issue - Files Showing as Static

## 🚨 Problem
Vercel is serving source code instead of executing serverless functions. This is a **Vercel Dashboard Settings issue**, not a code issue.

## ✅ Solution: Fix Vercel Project Settings

### Step 1: Check Vercel Project Settings

Go to **Vercel Dashboard** → Your Project → **Settings** → **General**

**Check these settings:**

1. **Framework Preset**: Should be **"Other"** or **empty**
   - ❌ NOT "Next.js", "React", "Vue", etc.
   - ✅ "Other" or blank

2. **Root Directory**: Should be **empty** or **`./`**
   - ❌ NOT `/api`, `/src`, etc.
   - ✅ Empty or `./`

3. **Build Command**: Should be **empty** or **`npm install`**
   - ❌ NOT `npm run build`, `next build`, etc.
   - ✅ Empty or `npm install`

4. **Output Directory**: Should be **empty**
   - ❌ NOT `/dist`, `/build`, `/out`, etc.
   - ✅ Empty

5. **Install Command**: Should be **`npm install`**
   - ✅ `npm install`

### Step 2: Verify Environment Variables

Go to **Settings** → **Environment Variables**

**Required:**
- ✅ `GEMINI_API_KEY` - Must be set

**Optional:**
- `RATE_LIMIT_PER_MINUTE` (default: 10)
- `RATE_LIMIT_PER_HOUR` (default: 60)

### Step 3: Check Deployment

1. Go to **Deployments** tab
2. Click on **latest deployment**
3. Check **Build Logs**:
   - Should see "Installing dependencies"
   - Should see "Building..."
   - Should NOT have build errors
   - Should NOT try to build a frontend framework

4. Check **Functions** tab:
   - Should list: `api/chat`, `api/info`, `api/health`, `api/index`
   - If empty or missing → Settings are wrong

### Step 4: If Functions Tab is Empty

This means Vercel is treating your project as a static site, not serverless functions.

**Fix:**
1. Go to **Settings** → **General**
2. Change **Framework Preset** to **"Other"**
3. Clear **Build Command** (leave empty)
4. Clear **Output Directory** (leave empty)
5. Click **Save**
6. **Redeploy** the project

### Step 5: Redeploy

After fixing settings:
1. Go to **Deployments**
2. Click **"Redeploy"** on latest deployment
3. Or push a new commit to trigger redeploy

## 🔍 How to Verify It's Fixed

After redeploy, check:

1. **Functions Tab** - Should show your API functions
2. **Test URLs:**
   - `/api/chat` - Should return JSON, not source code
   - `/api/info` - Should return JSON, not source code
   - `/api/health` - Should return JSON, not source code

## 📋 Summary

**The issue is NOT your code** - your code is correct!

**The issue is Vercel settings** - it's treating your project as a static site instead of serverless functions.

**Fix:** Set Framework Preset to "Other" and clear build/output settings.
