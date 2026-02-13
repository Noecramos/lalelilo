import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const CLIENT_ID = 'acb4b354-728f-479d-915a-c857d27da9ad';

// GET /api/marketing/campaigns — List campaigns
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const shopId = searchParams.get('shop_id');

        let query = supabaseAdmin
            .from('marketing_campaigns')
            .select(`
                *,
                campaign_files(id, file_url, file_name, file_type, file_size, sort_order),
                campaign_acknowledgements(id, shop_id, acknowledged_at)
            `)
            .eq('client_id', CLIENT_ID)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[GET /api/marketing/campaigns]', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        let campaigns = data || [];

        // If shop_id filter, only show campaigns targeted to this shop or all shops
        if (shopId) {
            campaigns = campaigns.filter(c => {
                const targets = c.target_shops || [];
                return targets.length === 0 || targets.includes(shopId);
            });
        }

        // Add acknowledgement stats
        const enriched = campaigns.map(c => {
            const acks = c.campaign_acknowledgements || [];
            return {
                ...c,
                totalAcknowledgements: acks.length,
                isAcknowledgedByShop: shopId ? acks.some((a: any) => a.shop_id === shopId) : undefined,
            };
        });

        return NextResponse.json(enriched);
    } catch (err: any) {
        console.error('[GET /api/marketing/campaigns]', err);
        return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
    }
}

// POST /api/marketing/campaigns — Create campaign
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            title, description, instructions, campaign_type,
            cover_image_url, start_date, end_date,
            target_shops, priority, status, files
        } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const campaignData: any = {
            client_id: CLIENT_ID,
            title,
            description: description || null,
            instructions: instructions || null,
            campaign_type: campaign_type || 'general',
            cover_image_url: cover_image_url || null,
            start_date: start_date || null,
            end_date: end_date || null,
            target_shops: target_shops || [],
            priority: priority || 'normal',
            status: status || 'draft',
        };

        if (campaignData.status === 'active') {
            campaignData.published_at = new Date().toISOString();
        }

        const { data: campaign, error } = await supabaseAdmin
            .from('marketing_campaigns')
            .insert(campaignData)
            .select()
            .single();

        if (error) {
            console.error('[POST /api/marketing/campaigns]', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Insert files if provided
        if (files && files.length > 0 && campaign) {
            const fileRows = files.map((f: any, idx: number) => ({
                campaign_id: campaign.id,
                file_url: f.file_url,
                file_name: f.file_name || `File ${idx + 1}`,
                file_type: f.file_type || 'application/octet-stream',
                file_size: f.file_size || 0,
                sort_order: idx,
            }));

            await supabaseAdmin.from('campaign_files').insert(fileRows);
        }

        return NextResponse.json(campaign, { status: 201 });
    } catch (err: any) {
        console.error('[POST /api/marketing/campaigns]', err);
        return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
    }
}

// PUT /api/marketing/campaigns — Update campaign
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
        }

        // If publishing, set published_at
        if (updates.status === 'active') {
            updates.published_at = new Date().toISOString();
        }

        const { data, error } = await supabaseAdmin
            .from('marketing_campaigns')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
    }
}

// DELETE /api/marketing/campaigns — Delete campaign
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('marketing_campaigns')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
    }
}
