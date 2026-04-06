# Live Lecture 500 Error - Diagnostic & Fix Guide

## Problem
Live Lecture API returns HTTP 500 errors on all requests, preventing recording functionality.

**Error Symptoms:**
- POST to `/api/live-lecture` returns 500 (Internal Server Error)
- Recording button doesn't work
- Console shows: "Failed to load resource: the server responded with a status of 500"

## Root Cause (Most Likely)
Azure OpenAI credentials are missing or incorrectly configured in Vercel environment variables.

## How to Fix

### Step 1: Deploy Enhanced Error Logging
✅ **COMPLETED** - The enhanced error logging has been added to `/api/live-lecture/route.ts`

This includes:
- Detailed transcription error logging
- Notes generation error logging  
- Environment variable status checks
- Full error response with type indicators

### Step 2: Redeploy to Vercel
```bash
# Commit and push your changes
git add app/api/live-lecture/route.ts
git commit -m "Add comprehensive error logging to Live Lecture API"
git push origin main
```

Vercel will automatically redeploy. Monitor the deployment in your Vercel Dashboard.

### Step 3: Check Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings**
2. Navigate to **Environment Variables**
3. Add/verify these variables are set:

```
AZURE_PROJECT_ENDPOINT=<your-azure-endpoint>
AZURE_PROJECT_API_KEY=<your-azure-api-key>
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-5.2-chat
AZURE_OPENAI_AUDIO_DEPLOYMENT=gpt-audio
AZURE_SPEECH_KEY=<your-speech-key>
AZURE_SPEECH_REGION=<your-speech-region>
AZURE_OPENAI_API_VERSION=2024-08-01-preview
NODE_ENV=production
```

**Note:** These values come from your `.env.production` file locally. Copy them to Vercel settings.

### Step 4: Test & Check Logs

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click on the latest deployment
3. Go to **Functions** → **api/live-lecture** 
4. Try recording on your live site
5. Check the **Logs** tab for detailed error messages

The enhanced logging will show:
- Which Azure credentials are missing
- Exact API error responses
- Whether it's a transcription or chat completion issue

### Step 5: Based on Error Messages

**If you see:** `Azure AI Project credentials not configured`
- Verify `AZURE_PROJECT_ENDPOINT` and `AZURE_PROJECT_API_KEY` are set in Vercel

**If you see:** `Azure OpenAI API error: 401`
- Invalid API key - check credentials are correct

**If you see:** `Azure OpenAI API error: 404`
- Invalid endpoint or deployment name

**If you see:** `Azure OpenAI Audio API error: 403`
- Speech service key/region invalid or missing

## Alternative: Use Azure AI Foundry Target URI

If you're using Azure AI Foundry, you can use Target URI format:

```
# Instead of separate endpoint + key, use Target URI:
AZURE_PROJECT_ENDPOINT=https://<project>.<region>.api.azureml.ms
AZURE_PROJECT_API_KEY=<your-api-key>
```

The API code supports both formats automatically.

## Quick Verification Checklist

- [ ] Enhanced error logging is in the code
- [ ] Built locally with `npm run build` (no errors)
- [ ] Pushed to Vercel and deployment succeeded
- [ ] All Azure credentials are set in Vercel Environment Variables
- [ ] Tested recording on live site
- [ ] Checked Vercel Function logs for detailed error messages

## Next Steps if Still Not Working

If you've done all steps and still get 500 errors:

1. **Check Azure Service Status**
   - Verify your Azure region is operational
   - Check API quota hasn't been exceeded

2. **Test with Development Credentials**
   - Try running locally with `npm run dev` using your `.env.local`
   - If it works locally, the issue is definitely Vercel environment variables

3. **Contact Azure Support**
   - If all variables are set and it works locally but not on Vercel, there may be an Azure service issue

## Files Modified
- `/app/api/live-lecture/route.ts` - Added comprehensive error logging and environment variable checks

## Build Status
✅ Build passes: `npm run build` → 57 pages compiled successfully
