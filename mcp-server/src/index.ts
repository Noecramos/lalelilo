#!/usr/bin/env node
/**
 * Antigravity MCP Server
 * 
 * A Model Context Protocol server for the Antigravity workspace.
 * Provides tools for:
 *   - Supabase database queries (shops, orders, products, inventory, analytics)
 *   - WAHA WhatsApp messaging (send messages, check status, notifications)
 *   - Deployment management (Vercel status, trigger deploys)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load env from mcp-server root
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

// ============================================================================
// CONFIG
// ============================================================================

const CONFIG = {
    supabase: {
        url: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    waha: {
        url: process.env.WAHA_API_URL || '',
        apiKey: process.env.WAHA_API_KEY || '',
        session: process.env.WAHA_SESSION || 'default',
    },
    vercel: {
        token: process.env.VERCEL_TOKEN || '',
        projectId: process.env.VERCEL_PROJECT_ID || '',
        teamId: process.env.VERCEL_TEAM_ID || '',
    },
    defaultClientId: process.env.DEFAULT_CLIENT_ID || '',
};

// ============================================================================
// HELPERS
// ============================================================================

/** Supabase REST API helper */
async function supabaseQuery(
    table: string,
    params: Record<string, string> = {},
    options: { method?: string; body?: unknown; count?: boolean } = {}
): Promise<unknown> {
    const url = new URL(`${CONFIG.supabase.url}/rest/v1/${table}`);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }

    const headers: Record<string, string> = {
        'apikey': CONFIG.supabase.serviceRoleKey,
        'Authorization': `Bearer ${CONFIG.supabase.serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': options.count ? 'count=exact' : 'return=representation',
    };

    const res = await fetch(url.toString(), {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Supabase error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    const totalCount = res.headers.get('content-range');

    if (options.count && totalCount) {
        return { data, totalCount };
    }
    return data;
}

/** WAHA API helper */
async function wahaFetch(
    endpoint: string,
    method: string = 'GET',
    body?: unknown
): Promise<unknown> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(CONFIG.waha.apiKey ? { 'X-Api-Key': CONFIG.waha.apiKey } : {}),
    };

    const res = await fetch(`${CONFIG.waha.url}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`WAHA error ${res.status}: ${errorText}`);
    }

    return await res.json();
}

/** Vercel API helper */
async function vercelFetch(endpoint: string, method: string = 'GET', body?: unknown): Promise<unknown> {
    if (!CONFIG.vercel.token) {
        throw new Error('VERCEL_TOKEN not configured. Add it to mcp-server/.env');
    }

    const url = new URL(`https://api.vercel.com${endpoint}`);
    if (CONFIG.vercel.teamId) {
        url.searchParams.set('teamId', CONFIG.vercel.teamId);
    }

    const res = await fetch(url.toString(), {
        method,
        headers: {
            'Authorization': `Bearer ${CONFIG.vercel.token}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Vercel error ${res.status}: ${errorText}`);
    }

    return await res.json();
}

/** Format phone number for WhatsApp (Brazil default) */
function formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length <= 11) return `55${digits}`;
    return digits;
}

// ============================================================================
// CREATE MCP SERVER
// ============================================================================

const server = new McpServer({
    name: 'antigravity',
    version: '1.0.0',
});

// ============================================================================
// 📊 SUPABASE TOOLS
// ============================================================================

server.tool(
    'supabase_query',
    'Run a read-only query on any Supabase table. Use PostgREST filter syntax (eq, gt, lt, like, etc). Returns JSON data.',
    {
        table: z.string().describe('Table name (e.g. shops, orders, products, inventory, categories, users, analytics_daily, contacts, conversations, messages)'),
        select: z.string().optional().describe('Columns to select, PostgREST syntax (e.g. "id,name,status" or "*" for all). Supports joins like "*, shops(name)"'),
        filters: z.record(z.string()).optional().describe('PostgREST filters as key-value pairs. Keys use column=operator format (e.g. {"status": "eq.active", "created_at": "gte.2026-01-01"}). Common operators: eq, neq, gt, gte, lt, lte, like, ilike, in, is'),
        order: z.string().optional().describe('Order by column (e.g. "created_at.desc" or "name.asc")'),
        limit: z.number().optional().describe('Maximum number of rows to return (default 50)'),
    },
    async ({ table, select, filters, order, limit }) => {
        const params: Record<string, string> = {};

        if (select) params['select'] = select;
        if (order) params['order'] = order;
        params['limit'] = String(limit || 50);

        if (filters) {
            for (const [key, value] of Object.entries(filters)) {
                params[key] = value;
            }
        }

        const data = await supabaseQuery(table, params);
        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify(data, null, 2),
            }],
        };
    }
);

server.tool(
    'supabase_rpc',
    'Call a Supabase RPC (stored procedure/function). Useful for complex queries, aggregations, or custom database functions.',
    {
        functionName: z.string().describe('Name of the Supabase RPC function'),
        params: z.record(z.unknown()).optional().describe('Parameters to pass to the function'),
    },
    async ({ functionName, params }) => {
        const data = await supabaseQuery(`rpc/${functionName}`, {}, {
            method: 'POST',
            body: params || {},
        });
        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify(data, null, 2),
            }],
        };
    }
);

server.tool(
    'supabase_sql',
    'Execute a raw SQL query via Supabase. Use for complex analytics, joins, or aggregations that PostgREST cannot handle. READ-ONLY queries recommended.',
    {
        query: z.string().describe('SQL query to execute. Use read-only queries (SELECT) for safety.'),
    },
    async ({ query }) => {
        // Use the pg_net or SQL execution endpoint
        const res = await fetch(`${CONFIG.supabase.url}/rest/v1/rpc/`, {
            method: 'POST',
            headers: {
                'apikey': CONFIG.supabase.serviceRoleKey,
                'Authorization': `Bearer ${CONFIG.supabase.serviceRoleKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        // Fallback: describe what we'd need
        if (!res.ok) {
            return {
                content: [{
                    type: 'text' as const,
                    text: `⚠️ Raw SQL not available via REST API. Use supabase_query tool with PostgREST filters instead, or create an RPC function in Supabase for this query:\n\n${query}`,
                }],
            };
        }

        const data = await res.json();
        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify(data, null, 2),
            }],
        };
    }
);

server.tool(
    'get_dashboard_summary',
    'Get a comprehensive dashboard summary: total shops, orders today, revenue, low stock alerts, and active conversations. Perfect for daily reports.',
    {},
    async () => {
        const today = new Date().toISOString().split('T')[0];
        const clientId = CONFIG.defaultClientId;

        // Run parallel queries — each wrapped in try/catch to be resilient
        const safeQuery = async (fn: () => Promise<unknown>) => {
            try { return await fn(); } catch { return []; }
        };

        const [shops, todayOrders, lowStock, conversations] = await Promise.all([
            safeQuery(() => supabaseQuery('shops', { select: 'id,name,is_active', 'client_id': `eq.${clientId}` })),
            safeQuery(() => supabaseQuery('orders', {
                select: '*',
                'created_at': `gte.${today}T00:00:00`,
                'client_id': `eq.${clientId}`,
                order: 'created_at.desc',
            })),
            safeQuery(() => supabaseQuery('inventory', {
                select: 'product_id,shop_id,quantity,min_quantity',
                limit: '20',
            })),
            safeQuery(() => supabaseQuery('conversations', {
                select: 'id,status,channel_type,unread_count',
                'client_id': `eq.${clientId}`,
                'status': 'eq.open',
            })),
        ]);

        const shopList = (shops || []) as any[];
        const orderList = (todayOrders || []) as any[];
        const lowStockList = (Array.isArray(lowStock) ? lowStock : []).filter((i: any) => i.quantity <= (i.min_quantity || 5));
        const convList = (conversations || []) as any[];

        const totalRevenue = orderList
            .filter((o: any) => o.status !== 'cancelled')
            .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

        const summary = {
            date: today,
            shops: {
                total: shopList.length,
                active: shopList.filter((s: any) => s.is_active).length,
            },
            orders_today: {
                total: orderList.length,
                revenue: `R$ ${totalRevenue.toFixed(2)}`,
                by_status: orderList.reduce((acc: any, o: any) => {
                    acc[o.status] = (acc[o.status] || 0) + 1;
                    return acc;
                }, {}),
            },
            low_stock_alerts: lowStockList.length,
            low_stock_items: lowStockList.slice(0, 10),
            open_conversations: {
                total: convList.length,
                unread: convList.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0),
                by_channel: convList.reduce((acc: any, c: any) => {
                    acc[c.channel_type] = (acc[c.channel_type] || 0) + 1;
                    return acc;
                }, {}),
            },
        };

        return {
            content: [{
                type: 'text' as const,
                text: `📊 **Antigravity Dashboard Summary**\n\n${JSON.stringify(summary, null, 2)}`,
            }],
        };
    }
);

// ============================================================================
// 📱 WAHA (WhatsApp) TOOLS
// ============================================================================

server.tool(
    'whatsapp_status',
    'Check the WAHA WhatsApp session status. Returns whether WhatsApp is connected and working.',
    {},
    async () => {
        try {
            const status = await wahaFetch(`/api/sessions/${CONFIG.waha.session}`) as any;
            const me = status.me ? `\nPhone: ${status.me.pushName} (${status.me.id})` : '';
            const engine = status.engine ? `\nEngine: ${status.engine.engine} (${status.engine.state})` : '';
            return {
                content: [{
                    type: 'text' as const,
                    text: `📱 **WhatsApp Session Status**\n\n${JSON.stringify(status, null, 2)}`,
                }],
            };
        } catch (err: any) {
            return {
                content: [{
                    type: 'text' as const,
                    text: `❌ **WhatsApp Connection Error**\n\n${err.message}\n\nMake sure WAHA is running at: ${CONFIG.waha.url}`,
                }],
            };
        }
    }
);

server.tool(
    'whatsapp_send_message',
    'Send a WhatsApp text message to a phone number via WAHA. Phone number should include country code or will default to Brazil (+55).',
    {
        phone: z.string().describe('Phone number (e.g. "5581999998888" or "81999998888" for Brazil)'),
        message: z.string().describe('Text message to send'),
    },
    async ({ phone, message }) => {
        const chatId = `${formatPhone(phone)}@c.us`;
        const result = await wahaFetch('/api/sendText', 'POST', {
            chatId,
            text: message,
            session: CONFIG.waha.session,
        });
        return {
            content: [{
                type: 'text' as const,
                text: `✅ **Message Sent**\n\nTo: ${phone}\nMessage: ${message}\n\nResponse: ${JSON.stringify(result, null, 2)}`,
            }],
        };
    }
);

server.tool(
    'whatsapp_send_image',
    'Send an image via WhatsApp with an optional caption.',
    {
        phone: z.string().describe('Phone number'),
        imageUrl: z.string().describe('URL of the image to send'),
        caption: z.string().optional().describe('Optional caption for the image'),
    },
    async ({ phone, imageUrl, caption }) => {
        const chatId = `${formatPhone(phone)}@c.us`;
        const result = await wahaFetch('/api/sendImage', 'POST', {
            chatId,
            file: { url: imageUrl },
            caption: caption || '',
            session: CONFIG.waha.session,
        });
        return {
            content: [{
                type: 'text' as const,
                text: `✅ **Image Sent**\n\nTo: ${phone}\nImage: ${imageUrl}\nCaption: ${caption || '(none)'}\n\nResponse: ${JSON.stringify(result, null, 2)}`,
            }],
        };
    }
);

server.tool(
    'whatsapp_send_bulk',
    'Send a WhatsApp message to multiple phone numbers. Includes a delay between messages to avoid being flagged as spam.',
    {
        phones: z.array(z.string()).describe('Array of phone numbers to send to'),
        message: z.string().describe('Message text to send to all recipients'),
        delayMs: z.number().optional().describe('Delay in milliseconds between messages (default: 3000)'),
    },
    async ({ phones, message, delayMs }) => {
        const delay = delayMs || 3000;
        const results: { phone: string; status: string; error?: string }[] = [];

        for (const phone of phones) {
            try {
                const chatId = `${formatPhone(phone)}@c.us`;
                await wahaFetch('/api/sendText', 'POST', {
                    chatId,
                    text: message,
                    session: CONFIG.waha.session,
                });
                results.push({ phone, status: 'sent' });
            } catch (err: any) {
                results.push({ phone, status: 'failed', error: err.message });
            }
            // Wait between messages
            if (phones.indexOf(phone) < phones.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        const sent = results.filter(r => r.status === 'sent').length;
        const failed = results.filter(r => r.status === 'failed').length;

        return {
            content: [{
                type: 'text' as const,
                text: `📤 **Bulk Send Complete**\n\nSent: ${sent}/${phones.length}\nFailed: ${failed}\n\nDetails:\n${JSON.stringify(results, null, 2)}`,
            }],
        };
    }
);

server.tool(
    'whatsapp_notify_order',
    'Send an order status notification to a customer via WhatsApp. Automatically formats a branded Lalelilo message.',
    {
        phone: z.string().describe('Customer phone number'),
        orderNumber: z.string().describe('Order number/ID'),
        status: z.enum(['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']).describe('New order status'),
        customerName: z.string().describe('Customer name for personalization'),
    },
    async ({ phone, orderNumber, status, customerName }) => {
        const statusMessages: Record<string, string> = {
            confirmed: '✅ Pedido confirmado!',
            preparing: '👗 Seu pedido está sendo preparado!',
            ready: '📦 Pedido pronto para retirada!',
            out_for_delivery: '🚚 Pedido saiu para entrega!',
            delivered: '🎉 Pedido entregue! Obrigada pela compra!',
            cancelled: '❌ Pedido cancelado.',
        };

        const message = `Olá ${customerName}! 👋\n\n${statusMessages[status]}\n\nPedido: #${orderNumber}\n\n🛍️ Lalelilo - Moda Infantil`;

        const chatId = `${formatPhone(phone)}@c.us`;
        const result = await wahaFetch('/api/sendText', 'POST', {
            chatId,
            text: message,
            session: CONFIG.waha.session,
        });

        return {
            content: [{
                type: 'text' as const,
                text: `✅ **Order Notification Sent**\n\nTo: ${customerName} (${phone})\nOrder: #${orderNumber}\nStatus: ${status}\n\nMessage sent: ${message}`,
            }],
        };
    }
);

server.tool(
    'whatsapp_get_chats',
    'Get the list of recent WhatsApp chats/conversations from WAHA.',
    {
        limit: z.number().optional().describe('Maximum number of chats to return (default 20)'),
    },
    async ({ limit }) => {
        const chats = await wahaFetch(`/api/chats?session=${CONFIG.waha.session}`);
        const chatList = Array.isArray(chats) ? chats.slice(0, limit || 20) : [];

        return {
            content: [{
                type: 'text' as const,
                text: `💬 **WhatsApp Chats** (${chatList.length})\n\n${JSON.stringify(chatList, null, 2)}`,
            }],
        };
    }
);

// ============================================================================
// 🚀 DEPLOYMENT TOOLS
// ============================================================================

server.tool(
    'vercel_deployments',
    'List recent Vercel deployments for the Lalelilo project. Shows status, URL, and creation time.',
    {
        limit: z.number().optional().describe('Number of deployments to show (default 5)'),
    },
    async ({ limit }) => {
        const data = await vercelFetch(
            `/v6/deployments?projectId=${CONFIG.vercel.projectId}&limit=${limit || 5}`
        ) as any;

        const deployments = (data.deployments || []).map((d: any) => ({
            id: d.uid,
            url: d.url,
            state: d.state || d.readyState,
            created: new Date(d.created).toISOString(),
            target: d.target,
            source: d.source,
        }));

        return {
            content: [{
                type: 'text' as const,
                text: `🚀 **Recent Deployments**\n\n${JSON.stringify(deployments, null, 2)}`,
            }],
        };
    }
);

server.tool(
    'vercel_deployment_status',
    'Get detailed status of a specific Vercel deployment.',
    {
        deploymentId: z.string().describe('Deployment ID or URL'),
    },
    async ({ deploymentId }) => {
        const data = await vercelFetch(`/v13/deployments/${deploymentId}`);
        return {
            content: [{
                type: 'text' as const,
                text: `📋 **Deployment Details**\n\n${JSON.stringify(data, null, 2)}`,
            }],
        };
    }
);

server.tool(
    'vercel_env_vars',
    'List environment variables configured in the Vercel project (values are redacted for security).',
    {},
    async () => {
        const data = await vercelFetch(
            `/v9/projects/${CONFIG.vercel.projectId}/env`
        ) as any;

        const envVars = (data.envs || []).map((e: any) => ({
            key: e.key,
            target: e.target,
            type: e.type,
            updated: e.updatedAt ? new Date(e.updatedAt).toISOString() : 'unknown',
        }));

        return {
            content: [{
                type: 'text' as const,
                text: `🔐 **Vercel Environment Variables** (${envVars.length})\n\n${JSON.stringify(envVars, null, 2)}`,
            }],
        };
    }
);

server.tool(
    'vercel_project_info',
    'Get project information from Vercel including domains, framework, and settings.',
    {},
    async () => {
        const data = await vercelFetch(`/v9/projects/${CONFIG.vercel.projectId}`);
        return {
            content: [{
                type: 'text' as const,
                text: `📦 **Vercel Project Info**\n\n${JSON.stringify(data, null, 2)}`,
            }],
        };
    }
);

server.tool(
    'check_services_health',
    'Check the health of all connected services: Supabase, WAHA, and Vercel. Quick diagnostic tool.',
    {},
    async () => {
        const results: Record<string, { status: string; details?: string }> = {};

        // Check Supabase
        try {
            await supabaseQuery('shops', { select: 'id', limit: '1' });
            results['supabase'] = { status: '✅ Connected' };
        } catch (err: any) {
            results['supabase'] = { status: '❌ Error', details: err.message };
        }

        // Check WAHA
        try {
            const wahaStatus = await wahaFetch(`/api/sessions/${CONFIG.waha.session}`) as any;
            results['waha'] = {
                status: wahaStatus.status === 'WORKING' ? '✅ Connected & Working' : `⚠️ ${wahaStatus.status}`,
                details: `Session: ${CONFIG.waha.session}`,
            };
        } catch (err: any) {
            results['waha'] = { status: '❌ Error', details: err.message };
        }

        // Check Vercel
        if (CONFIG.vercel.token) {
            try {
                const project = await vercelFetch(`/v9/projects/${CONFIG.vercel.projectId}`) as any;
                results['vercel'] = {
                    status: '✅ Connected',
                    details: `Project: ${project.name}`,
                };
            } catch (err: any) {
                results['vercel'] = { status: '❌ Error', details: err.message };
            }
        } else {
            results['vercel'] = { status: '⚠️ Not configured', details: 'Add VERCEL_TOKEN to .env' };
        }

        return {
            content: [{
                type: 'text' as const,
                text: `🏥 **Services Health Check**\n\n${JSON.stringify(results, null, 2)}`,
            }],
        };
    }
);

// ============================================================================
// 📋 RESOURCES (Read-only data exposed to clients)
// ============================================================================

server.resource(
    'schema',
    'schema://lalelilo/tables',
    async (uri) => ({
        contents: [{
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({
                tables: [
                    'shops', 'products', 'categories', 'inventory', 'orders', 'order_items',
                    'users', 'clients', 'analytics_daily', 'contacts', 'conversations',
                    'messages', 'inbound_messages', 'tickets', 'kudos',
                ],
                relationships: {
                    'clients → shops': '1:N',
                    'clients → categories': '1:N',
                    'categories → products': '1:N',
                    'products + shops → inventory': 'M:N',
                    'shops → orders': '1:N',
                    'orders → order_items': '1:N',
                    'contacts → conversations': '1:N',
                    'conversations → messages': '1:N',
                },
            }, null, 2),
        }],
    })
);

server.resource(
    'config',
    'config://antigravity/services',
    async (uri) => ({
        contents: [{
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({
                supabase: { url: CONFIG.supabase.url, connected: !!CONFIG.supabase.serviceRoleKey },
                waha: { url: CONFIG.waha.url, session: CONFIG.waha.session, connected: !!CONFIG.waha.apiKey },
                vercel: { projectId: CONFIG.vercel.projectId, connected: !!CONFIG.vercel.token },
            }, null, 2),
        }],
    })
);

// ============================================================================
// START SERVER
// ============================================================================

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('🚀 Antigravity MCP Server running on stdio');
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
