---
description: How to set up and manage the Antigravity MCP server for Supabase, WhatsApp, and deployments
---

# Antigravity MCP Server

## Overview
The MCP server lives at `d:\Antigravity\lalelilo\mcp-server\` and provides AI tools for:
- **Supabase**: Query database, run RPCs, dashboard summaries
- **WAHA**: Send WhatsApp messages, check status, bulk send, order notifications
- **Vercel**: View deployments, check status, environment variables

## Setup

### 1. Install dependencies
// turbo
```bash
cd d:\Antigravity\lalelilo\mcp-server && npm install
```

### 2. Configure .env
Edit `mcp-server/.env` and ensure all values are set. Key ones to verify:
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `WAHA_API_URL` and `WAHA_API_KEY`
- `VERCEL_TOKEN` (get from https://vercel.com/account/tokens)

### 3. Test the server
// turbo
```bash
cd d:\Antigravity\lalelilo\mcp-server && npm run dev
```

## Client Configuration

### VS Code (Copilot)
Already configured at `.vscode/mcp.json`. Just open the workspace.

### Claude Desktop
Add to `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "antigravity": {
      "command": "npx",
      "args": ["tsx", "D:/Antigravity/lalelilo/mcp-server/src/index.ts"]
    }
  }
}
```

### Cursor
Settings > MCP Servers > Add:
- Name: `antigravity`
- Command: `npx`
- Args: `tsx D:/Antigravity/lalelilo/mcp-server/src/index.ts`

## Available Tools (13 total)

### Supabase
- `supabase_query` — Query any table
- `supabase_rpc` — Call stored procedures
- `supabase_sql` — Raw SQL
- `get_dashboard_summary` — Daily summary

### WhatsApp
- `whatsapp_status` — Check connection
- `whatsapp_send_message` — Send text
- `whatsapp_send_image` — Send image
- `whatsapp_send_bulk` — Bulk send
- `whatsapp_notify_order` — Order notifications
- `whatsapp_get_chats` — List chats

### Deployment
- `vercel_deployments` — List deployments
- `vercel_deployment_status` — Deployment details
- `vercel_env_vars` — Environment variables
- `vercel_project_info` — Project settings
- `check_services_health` — Health check all services

## Troubleshooting
- If MCP won't start, run `npm run dev` in `mcp-server/` to see errors
- If Supabase fails, check `SUPABASE_SERVICE_ROLE_KEY` is correct
- If WAHA fails, verify the Railway URL is active
- If Vercel fails, ensure `VERCEL_TOKEN` is set with appropriate permissions
