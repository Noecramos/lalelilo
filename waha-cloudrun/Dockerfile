# WAHA (WhatsApp HTTP API) for Google Cloud Run
FROM devlikeapro/waha:latest

# Environment variables will be set in Cloud Run
ENV WHATSAPP_HOOK_EVENTS=message,message.any
ENV WHATSAPP_HOOK_EVENTS_INCLUDE_MEDIA=true

# Cloud Run uses PORT environment variable
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/main"]
