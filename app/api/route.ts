// API Index — lists all available endpoints
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        name: 'Lalelilo Platform API',
        version: '2.0',
        client_id: 'acb4b354-728f-479d-915a-c857d27da9ad',
        endpoints: {
            gamification: {
                url: '/api/gamification',
                GET: ['?action=leaderboard', '?action=profile&user_id=X', '?action=badges&client_id=X'],
                POST: ['kudos', 'feedback'],
            },
            replenishment: {
                url: '/api/replenishment',
                GET: '?client_id=X',
                POST: 'Create request',
            },
            checklists: {
                url: '/api/checklists',
                GET: ['?action=templates&client_id=X'],
                POST: ['create_template', 'submit_checklist'],
            },
            tickets: {
                url: '/api/tickets',
                GET: ['?action=list&client_id=X', '?action=heatmap&client_id=X'],
                POST: ['create', 'update_status', 'comment'],
            },
            ecommerce: {
                url: '/api/ecommerce',
                GET: ['?action=kpis&client_id=X&from=DATE&to=DATE', '?action=abandoned_carts&client_id=X', '?action=tracking&order_id=X'],
                POST: ['cart', 'promo_code', 'validate_promo', 'flag_abandoned'],
            },
            crm: {
                url: '/api/crm',
                GET: ['?action=events&client_id=X&from=DATE&to=DATE', '?action=contacts&client_id=X'],
                POST: ['create_event', 'upsert_contact', 'process_birthdays'],
            },
            messaging: {
                url: '/api/messaging',
                GET: ['?action=conversations&client_id=X', '?action=messages&conversation_id=X'],
                POST: ['send', 'inbound'],
            },
            notifications: {
                url: '/api/notifications',
                GET: 'Process notification queue (cron)',
                POST: '{ action: "process_queue" }',
            },
            webhooks: {
                waha: '/api/webhooks/waha (WhatsApp inbound)',
                meta: '/api/webhooks/meta (Instagram/Facebook)',
            },
        },
        frontend_pages: {
            storefront: ['/', '/products', '/cart', '/checkout', '/location'],
            super_admin: ['/super-admin', '/super-admin/shops', '/super-admin/users', '/super-admin/analytics', '/super-admin/messages', '/super-admin/reports'],
            shop_admin: ['/shop-admin/[shop-id]', '/shop-admin/[shop-id]/inventory', '/shop-admin/[shop-id]/orders', '/shop-admin/[shop-id]/messages'],
        }
    });
}
