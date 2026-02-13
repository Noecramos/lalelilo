// Lalelilo - Module 1: Store Operations / Replenishment Service
// Handles stock requests from stores to Distribution Center

import { supabaseAdmin } from '@/lib/supabase-admin';
import { logActivity, createNotification } from './core';
import { buildReplenishmentStatusMessage } from './waha';


// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
    requested: ['processing', 'cancelled'],
    processing: ['in_transit', 'cancelled'],
    in_transit: ['received'],
    received: [],
    cancelled: [],
};

// ============================================================================
// REPLENISHMENT REQUEST CRUD
// ============================================================================

interface ReplenishmentItem {
    product_id: string;
    size: string;
    quantity_requested: number;
}

interface CreateReplenishmentParams {
    clientId: string;
    shopId: string;
    dcId: string;
    requestedBy: string;
    items: ReplenishmentItem[];
    notes?: string;
    expectedDelivery?: string;
}

export async function createReplenishmentRequest(params: CreateReplenishmentParams) {
    const supabase = supabaseAdmin;

    // Create the request
    const { data: request, error: reqError } = await supabase
        .from('replenishment_requests')
        .insert({
            client_id: params.clientId,
            shop_id: params.shopId,
            dc_id: params.dcId,
            requested_by: params.requestedBy || null,
            status: 'requested',
            notes: params.notes,
            expected_delivery: params.expectedDelivery,
            total_items: params.items.reduce((sum, i) => sum + i.quantity_requested, 0),
        })
        .select()
        .single();

    if (reqError || !request) return { error: reqError };

    // Insert items
    const itemRows = params.items
        .filter(i => i.quantity_requested > 0)
        .map(i => ({
            request_id: request.id,
            product_id: i.product_id,
            size: i.size,
            quantity_requested: i.quantity_requested,
        }));

    if (itemRows.length > 0) {
        const { error: itemsError } = await supabase
            .from('replenishment_items')
            .insert(itemRows);
        if (itemsError) return { error: itemsError };
    }

    // Log initial status
    await supabase.from('replenishment_status_log').insert({
        request_id: request.id,
        from_status: null,
        to_status: 'requested',
        changed_by: params.requestedBy,
        notes: 'Pedido criado',
    });

    // Activity log
    await logActivity({
        actorId: params.requestedBy,
        action: 'replenishment.created',
        entityType: 'replenishment_request',
        entityId: request.id,
        shopId: params.shopId,
        clientId: params.clientId,
        metadata: { total_items: itemRows.length },
    });

    return { data: request };
}

export async function getReplenishmentRequests(filters: {
    shopId?: string;
    dcId?: string;
    status?: string;
    limit?: number;
}) {
    const supabase = supabaseAdmin;
    let query = supabase
        .from('replenishment_requests')
        .select(`
      *,
      shop:shops(id, name),
      dc:distribution_centers(id, name),
      requester:users!requested_by(id, name),
      items:replenishment_items(*, product:products(id, name, image_url, product_type, product_tier, gender))
    `)
        .order('created_at', { ascending: false })
        .limit(filters.limit || 50);

    if (filters.shopId) query = query.eq('shop_id', filters.shopId);
    if (filters.dcId) query = query.eq('dc_id', filters.dcId);
    if (filters.status) query = query.eq('status', filters.status);

    return query;
}

export async function getReplenishmentById(id: string) {
    const supabase = supabaseAdmin;
    return supabase
        .from('replenishment_requests')
        .select(`
      *,
      shop:shops(id, name, whatsapp),
      dc:distribution_centers(id, name),
      requester:users!requested_by(id, name, phone),
      items:replenishment_items(*, product:products(id, name, image_url, sku, product_type, product_tier, gender)),
      status_log:replenishment_status_log(*, changed_by_user:users!changed_by(id, name))
    `)
        .eq('id', id)
        .single();
}

// ============================================================================
// STATUS TRANSITIONS (State Machine)
// ============================================================================

export async function updateReplenishmentStatus(
    requestId: string,
    newStatus: string,
    changedBy: string,
    notes?: string,
) {
    const supabase = supabaseAdmin;

    // Get current request
    const { data: request, error: fetchError } = await supabase
        .from('replenishment_requests')
        .select('*, shop:shops(id, name, whatsapp), requester:users!requested_by(id, name, phone)')
        .eq('id', requestId)
        .single();

    if (fetchError || !request) return { error: fetchError || new Error('Not found') };

    // Validate transition
    const allowed = VALID_TRANSITIONS[request.status];
    if (!allowed || !allowed.includes(newStatus)) {
        return { error: new Error(`Cannot transition from '${request.status}' to '${newStatus}'`) };
    }

    // Update status
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'received') updateData.received_at = new Date().toISOString();

    const { error: updateError } = await supabase
        .from('replenishment_requests')
        .update(updateData)
        .eq('id', requestId);

    if (updateError) return { error: updateError };

    // Log status change
    await supabase.from('replenishment_status_log').insert({
        request_id: requestId,
        from_status: request.status,
        to_status: newStatus,
        changed_by: changedBy,
        notes,
    });

    // ON RECEIVED: Transfer inventory from DC to Store
    if (newStatus === 'received') {
        await transferInventory(requestId);
    }

    // Send WhatsApp notification
    const shopPhone = request.shop?.whatsapp || request.requester?.phone;
    if (shopPhone) {
        await createNotification({
            type: 'replenishment_status',
            body: buildReplenishmentStatusMessage(requestId, newStatus, request.shop?.name || ''),
            phoneNumber: shopPhone,
            metadata: { request_id: requestId, status: newStatus },
        });
    }

    // Activity log
    await logActivity({
        actorId: changedBy,
        action: `replenishment.${newStatus}`,
        entityType: 'replenishment_request',
        entityId: requestId,
        shopId: request.shop_id,
        clientId: request.client_id,
    });

    return { data: { ...request, status: newStatus } };
}

// ============================================================================
// INVENTORY TRANSFER (DC → Store)
// ============================================================================

async function transferInventory(requestId: string) {
    const supabase = supabaseAdmin;

    // Get request with items
    const { data: request } = await supabase
        .from('replenishment_requests')
        .select('*, items:replenishment_items(*)')
        .eq('id', requestId)
        .single();

    if (!request?.items) return;

    for (const item of request.items) {
        const qty = item.quantity_fulfilled || item.quantity_requested;

        // Decrement DC inventory
        const { data: dcStock } = await supabase
            .from('dc_inventory')
            .select('quantity')
            .eq('dc_id', request.dc_id)
            .eq('product_id', item.product_id)
            .eq('size', item.size)
            .single();

        if (dcStock) {
            await supabase
                .from('dc_inventory')
                .update({ quantity: Math.max(0, dcStock.quantity - qty) })
                .eq('dc_id', request.dc_id)
                .eq('product_id', item.product_id)
                .eq('size', item.size);
        }

        // Increment store inventory (upsert)
        const { data: storeStock } = await supabase
            .from('inventory')
            .select('id, quantity')
            .eq('shop_id', request.shop_id)
            .eq('product_id', item.product_id)
            .eq('size', item.size)
            .single();

        if (storeStock) {
            await supabase
                .from('inventory')
                .update({ quantity: storeStock.quantity + qty })
                .eq('id', storeStock.id);
        } else {
            await supabase.from('inventory').insert({
                shop_id: request.shop_id,
                product_id: item.product_id,
                size: item.size,
                quantity: qty,
            });
        }
    }
}
