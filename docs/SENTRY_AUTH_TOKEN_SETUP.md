# Quick Guide: Setting Up Sentry Auth Token

## Why You Need This

The warnings you're seeing indicate that Sentry cannot upload source maps or create releases because no auth token is configured. This means:

- ❌ Stack traces will be minified and hard to read
- ❌ No release tracking
- ✅ Errors will still be captured, but with less detail

## Quick Setup (5 minutes)

### 1. Create Auth Token in Sentry

1. Open: https://evgeny-pl.sentry.io/settings/auth-tokens/
2. Click **"Create New Token"**
3. Give it a name: `r2r-dashboard-sourcemaps`
4. Set scopes (check these):
   - ✅ `project:read`
   - ✅ `project:releases`
   - ✅ `org:read`
5. Click **"Create Token"**
6. **Copy the token immediately** (you won't see it again!)

### 2. Add to Local `.env` File

Add this line to your `.env` file:

```bash
SENTRY_AUTH_TOKEN=your_copied_token_here
```

### 3. Add to Vercel

1. Go to: https://vercel.com/eagurins-projects/r2r-dashboard/settings/environment-variables
2. Click **"Add New"**
3. Name: `SENTRY_AUTH_TOKEN`
4. Value: `your_copied_token_here`
5. Select all environments: Production, Preview, Development
6. Click **"Save"**

### 4. Redeploy

After adding the token to Vercel, trigger a new deployment:

```bash
vercel deploy --prod
```

Or push a new commit to trigger automatic deployment.

## Verify It Works

After deployment, check the build logs. You should see:

- ✅ `Creating release...`
- ✅ `Uploading source maps...`
- ❌ No more warnings about missing auth token

## Security Notes

- ⚠️ Never commit the token to git
- ✅ `.env` is already in `.gitignore`
- ✅ `.env.sentry-build-plugin` is already in `.gitignore`
- ✅ Token is only used during build time, not in runtime

## Alternative: Organization Token

Instead of a personal token, you can use an Organization Token:

1. Go to: https://evgeny-pl.sentry.io/settings/auth-tokens/
2. Use the organization token if available
3. Same setup process applies
