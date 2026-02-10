---
description: How to deploy WAHA (WhatsApp HTTP API) on Railway for Lalelilo
---

# Deploy WAHA on Railway

## Prerequisites
- Railway account (sign up at https://railway.app)
- A dedicated WhatsApp phone number
- Lalelilo project deployed on Vercel

## Steps

### 1. Create Railway Project
1. Go to https://railway.app/new
2. Click **"Deploy from Docker Image"**
3. Enter the Docker image: `devlikeapro/waha-plus:latest`
   - If you don't have WAHA Plus, use the free version: `devlikeapro/waha:latest`
4. Click **Deploy**

### 2. Set Environment Variables
In your Railway project, go to **Variables** and add:

| Variable | Value |
|---|---|
| `WHATSAPP_API_KEY` | `REDACTED_WAHA_API_KEY` |
| `WHATSAPP_SWAGGER_ENABLED` | `true` |
| `WHATSAPP_START_SESSION` | `default` |
| `WHATSAPP_DEFAULT_ENGINE` | `WEBJS` |
| `WAHA_DASHBOARD_ENABLED` | `true` |
| `WAHA_DASHBOARD_USERNAME` | `admin` |
| `WAHA_DASHBOARD_PASSWORD` | (choose a strong password) |
| `WHATSAPP_HOOK_URL` | `https://lalelilo.vercel.app/api/webhooks/waha` |
| `WHATSAPP_HOOK_EVENTS` | `message,message.ack,session.status` |

### 3. Configure Networking
1. In Railway, go to **Settings > Networking**
2. Click **"Generate Domain"** — this gives you a URL like `waha-lalelilo.up.railway.app`
3. Copy this URL

### 4. Update Lalelilo .env.local
Update the `WAHA_API_URL` in your `.env.local`:
```
WAHA_API_URL="https://YOUR-RAILWAY-URL.up.railway.app"
```

Also update this in Vercel Environment Variables:
1. Go to Vercel Dashboard > Lalelilo > Settings > Environment Variables
2. Add `WAHA_API_URL`, `WAHA_API_KEY`, `WAHA_SESSION`, `WAHA_WEBHOOK_SECRET`

### 5. Connect WhatsApp
1. Open `https://YOUR-RAILWAY-URL.up.railway.app/dashboard`
2. Login with admin credentials
3. Click "Start Session" (session name: `default`)
4. Scan the QR code with your WhatsApp phone
5. Wait for "WORKING" status

### 6. Test the Connection
// turbo
```bash
curl -X GET "https://YOUR-RAILWAY-URL.up.railway.app/api/sessions" -H "X-Api-Key: REDACTED_WAHA_API_KEY"
```

### 7. Verify Webhook
Send a test message to the connected WhatsApp number. Check Vercel logs to confirm the webhook receives the message at `/api/webhooks/waha`.

## Troubleshooting
- If the QR code doesn't appear, restart the Railway deployment
- If webhook isn't firing, check that `WHATSAPP_HOOK_URL` points to your Vercel production URL
- Minimum Railway plan: Hobby ($5/mo) — WAHA needs ~512MB RAM minimum
- For session persistence, Railway provides ephemeral storage. Sessions may need re-scanning after deploys.

## Cost Estimate
- Railway Hobby: ~$5/mo base + usage (~$2-5/mo for WAHA)
- Total: ~$7-10/mo for WAHA hosting
