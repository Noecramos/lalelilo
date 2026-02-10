# WAHA on Google Cloud Run - Deployment Guide

## Prerequisites
- Google Cloud account (same as your Gemini account)
- Google Cloud CLI installed
- Docker Desktop (optional, Cloud Build handles it)

## Quick Start

### 1. Enable APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 2. Set Project
```bash
gcloud config set project lalelilo-waha
```

### 3. Deploy
```powershell
cd waha-cloudrun
.\deploy.ps1
```

## Manual Deployment Steps

### Build Container
```bash
gcloud builds submit --tag gcr.io/lalelilo-waha/waha .
```

### Deploy to Cloud Run
```bash
gcloud run deploy waha \
  --image gcr.io/lalelilo-waha/waha \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --min-instances 1 \
  --set-env-vars "WHATSAPP_HOOK_URL=https://lalelilo.vercel.app/api/webhooks/waha,WAHA_API_KEY=REDACTED_WAHA_API_KEY"
```

## Configuration

### Environment Variables
- `WHATSAPP_HOOK_URL`: Your Vercel webhook URL
- `WHATSAPP_HOOK_EVENTS`: message,message.any
- `WAHA_API_KEY`: REDACTED_WAHA_API_KEY

### Resources
- Memory: 512Mi
- CPU: 1
- Min instances: 1 (always-on, no cold starts)
- Max instances: 3 (auto-scale)

## Cost Estimate
- **FREE Tier**: 2M requests/month, 360,000 GB-seconds
- **Expected**: $0-2/month (well within free tier)
- **Always-on**: ~$5/month (1 instance running 24/7)

## After Deployment

1. Get your WAHA URL:
```bash
gcloud run services describe waha --region us-central1 --format 'value(status.url)'
```

2. Update `.env.local`:
```
WAHA_API_URL=<your-cloud-run-url>
```

3. Test health:
```bash
curl <your-cloud-run-url>/api/health
```

4. Connect WhatsApp:
- Go to: `<your-url>/api/sessions/default/auth/qr`
- Scan QR code with WhatsApp

## Monitoring
- Logs: https://console.cloud.google.com/run/detail/us-central1/waha/logs
- Metrics: https://console.cloud.google.com/run/detail/us-central1/waha/metrics

## Troubleshooting

### Container won't start
```bash
gcloud run services logs read waha --region us-central1
```

### Update environment variables
```bash
gcloud run services update waha \
  --region us-central1 \
  --set-env-vars "NEW_VAR=value"
```

### Redeploy
```bash
cd waha-cloudrun
.\deploy.ps1
```
