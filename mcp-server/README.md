# 🚀 Antigravity MCP Server

A **Model Context Protocol** server for the Antigravity workspace. Connects AI assistants (Claude Desktop, VS Code Copilot, Cursor) to your Supabase database, WAHA WhatsApp, and Vercel deployments.

## 🛠️ Tools Available

### 📊 Supabase (Database)
| Tool | Description |
|------|-------------|
| `supabase_query` | Query any table with PostgREST filters |
| `supabase_rpc` | Call stored procedures / RPC functions |
| `supabase_sql` | Execute raw SQL (read-only recommended) |
| `get_dashboard_summary` | Full daily summary: orders, revenue, stock alerts, conversations |

### 📱 WAHA (WhatsApp)
| Tool | Description |
|------|-------------|
| `whatsapp_status` | Check if WhatsApp is connected |
| `whatsapp_send_message` | Send a text message |
| `whatsapp_send_image` | Send an image with caption |
| `whatsapp_send_bulk` | Send to multiple numbers with delay |
| `whatsapp_notify_order` | Send branded order status notification |
| `whatsapp_get_chats` | List recent conversations |

### 🚀 Deployment (Vercel)
| Tool | Description |
|------|-------------|
| `vercel_deployments` | List recent deployments |
| `vercel_deployment_status` | Get deployment details |
| `vercel_env_vars` | List environment variables (redacted values) |
| `vercel_project_info` | Get project settings and domains |
| `check_services_health` | Health check all services at once |

## ⚡ Quick Start

### 1. Install dependencies
```bash
cd mcp-server
npm install
```

### 2. Configure environment
Edit `mcp-server/.env` — most values are pre-filled. You only need to add:
- `VERCEL_TOKEN` — Get from [Vercel Settings > Tokens](https://vercel.com/account/tokens)

### 3. Test locally
```bash
npm run dev
```

## 🖥️ Client Configuration

### VS Code (GitHub Copilot)
Already configured in `.vscode/mcp.json`. Just:
1. Open VS Code in the lalelilo workspace
2. Open Copilot Chat
3. The MCP tools will be available automatically

### Claude Desktop
Add this to your Claude Desktop config file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

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
Add to Cursor Settings > MCP Servers:
```json
{
  "antigravity": {
    "command": "npx",
    "args": ["tsx", "D:/Antigravity/lalelilo/mcp-server/src/index.ts"]
  }
}
```

## 💡 Example Prompts

Once connected, you can ask your AI assistant things like:

**Business Intelligence:**
- "Give me today's dashboard summary"
- "What are the top 5 shops by order count this month?"
- "Which products are running low on stock?"

**WhatsApp Automation:**
- "Send a WhatsApp message to 81999998888 saying 'Olá! Seu pedido está pronto!'"
- "Notify customer João (81999998888) that order #1234 is out for delivery"
- "Send a promotional message to these 10 customers about our weekend sale"
- "Check if WhatsApp is connected and working"

**Deployment:**
- "What's the status of our latest Vercel deployment?"
- "Show me the last 5 deployments"
- "Check if all services are healthy"

## 🔒 Security Notes
- The MCP server uses the **Supabase service role key** (full admin access)
- WhatsApp messages are sent through WAHA on Railway
- Vercel API token should have minimal required scopes
- The `.env` file is gitignored — never commit secrets

## 📁 Project Structure
```
mcp-server/
├── src/
│   └── index.ts      # Main MCP server (all tools)
├── .env              # Environment variables (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```
