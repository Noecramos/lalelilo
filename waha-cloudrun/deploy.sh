#!/bin/bash

# Google Cloud Run Deployment Script for WAHA
# Run this after: gcloud auth login

PROJECT_ID="lalelilo-waha"
SERVICE_NAME="waha"
REGION="us-central1"  # Change if you want different region
IMAGE_NAME="gcr.io/${PROJECT_ID}/waha"

echo "🚀 Deploying WAHA to Google Cloud Run..."
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo ""

# Build and push container
echo "📦 Building container..."
gcloud builds submit --tag ${IMAGE_NAME} .

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 3 \
  --set-env-vars "WHATSAPP_HOOK_URL=https://lalelilo.vercel.app/api/webhooks/waha" \
  --set-env-vars "WHATSAPP_HOOK_EVENTS=message,message.any" \
  --set-env-vars "WAHA_API_KEY=REDACTED_WAHA_API_KEY"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Your WAHA URL:"
gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)'
echo ""
echo "🔑 API Key: REDACTED_WAHA_API_KEY"
echo ""
echo "📋 Next steps:"
echo "1. Copy the WAHA URL above"
echo "2. Update .env.local: WAHA_API_URL=<your-url>"
echo "3. Test: curl <your-url>/api/health"
