# Deploying Ajaia DocuFlow to Vercel

This guide covers deploying the full stack (frontend + backend) to Vercel as serverless functions.

## Prerequisites

1. GitHub account
2. Vercel account (free at https://vercel.com)
3. Node.js installed locally

## Step 1: Push to GitHub

```bash
cd /Users/amrit/Desktop/ajaia-docuflow

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - ready for Vercel deployment"

# Create a new repository on GitHub (https://github.com/new)
# Then:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ajaia-docuflow.git
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Quickest)

```bash
npm install -g vercel
vercel login

# From project root
vercel
```

Follow the prompts:
- Link to your GitHub repo
- Use default settings
- Deploy!

### Option B: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select "Import Git Repository"
4. Choose your `ajaia-docuflow` repo
5. **Important Settings:**
   - **Root Directory:** Leave blank (or set to `.`)
   - **Build Command:** `npm run build --prefix frontend && npm install --prefix backend`
   - **Output Directory:** `frontend/dist`
   - **Install Command:** `npm install --legacy-peer-deps`
6. Click "Deploy"

## Step 3: Verify Deployment

After deployment completes:

```bash
# Your app will be at:
https://your-project-name.vercel.app

# Test the API:
curl https://your-project-name.vercel.app/api/users
```

You should get a JSON response with the 3 default users (Alice, Bob, Charlie).

## Important Notes

### ⚠️ Database Issue: Data Resets on Each Deploy

Vercel's filesystem is **ephemeral** - the SQLite database will reset on each deployment.

**Current behavior:**
- Database is recreated with seed data (3 users) on each deploy
- User documents are lost after redeployment

**Solutions for the future:**
1. **Use Turso** (SQLite in the cloud)
   - Minimal code changes
   - Free tier available
   
2. **Use Neon** (PostgreSQL)
   - More reliable
   - Better for production
   
3. **Use MongoDB Atlas**
   - Full rewrite needed
   - Best for scaling

### Environment Variables

No environment variables needed for basic deployment. If you add any later:

In Vercel Dashboard:
- Go to **Settings** → **Environment Variables**
- Add your variables
- Redeploy

### File Structure for Vercel

```
ajaia-docuflow/
├── api/
│   └── index.js          ← Serverless function handler
├── frontend/             ← React/Vite app
│   ├── dist/             ← Built files (generated)
│   ├── src/
│   └── package.json
├── backend/              ← Express server code
│   ├── server.js         ← Exported as serverless function
│   ├── db.js
│   └── package.json
├── vercel.json           ← Vercel configuration
└── package.json
```

## Troubleshooting

### "Build failed"
```bash
# Try building locally first
npm run build --prefix frontend
npm install --prefix backend

# Check for errors
npm run test --prefix backend
```

### "Cannot find module"
- Ensure all dependencies are in package.json
- Check that imports match the file structure
- Vercel uses `npm install --legacy-peer-deps` by default

### "API not responding"
- Check that `/api` calls are working
- Verify `api/index.js` exports the app correctly
- Check Vercel logs: Dashboard → Deployments → Logs

### "Database is empty"
- This is expected - Vercel resets the database on each deploy
- Consider switching to a cloud database

## Redeploying

To redeploy after code changes:

```bash
git add .
git commit -m "Your changes"
git push origin main

# Vercel auto-deploys on push (or manually from dashboard)
```

## Monitoring

Track your deployment:
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Analytics:** See traffic, performance, errors
- **Logs:** Deployments tab shows build and runtime logs

## Next Steps

1. ✅ Current: Full app deployed on Vercel (database resets on deploy)
2. 🔄 Future: Add persistent database (Turso/Neon)
3. 🚀 Production: Add custom domain
4. 📊 Scale: Monitor and optimize performance

Enjoy your deployed app! 🎉
