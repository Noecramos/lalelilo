import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/inventory - Get inventory levels
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const shopId = searchParams.get('shop_id');
        const productId = searchParams.get('product_id');
        const lowStock = searchParams.get('low_stock');

        let query = supabase
            .from('inventory')
            .select('*, shops(name, slug), products(name, slug, price, image_url)');

        // Filters
        if (shopId) {
            query = query.eq('shop_id', shopId);
        }

        if (productId) {
            query = query.eq('product_id', productId);
        }

        // Low stock filter
        if (lowStock === 'true') {
            // This will need to be done in post-processing since we can't compare columns directly
            const { data: allInventory, error } = await query;

            if (error) {
                console.error('Error fetching inventory:', error);
                return NextResponse.json(
                    { error: 'Failed to fetch inventory', details: error.message },
                    { status: 500 }
                );
            }

            const lowStockItems = allInventory?.filter(
                item => item.quantity <= item.low_stock_threshold
            ) || [];

            return NextResponse.json({
                success: true,
                inventory: lowStockItems,
                count: lowStockItems.length
            });
        }

        const { data: inventory, error } = await query;

        if (error) {
            console.error('Error fetching inventory:', error);
            return NextResponse.json(
                { error: 'Failed to fetch inventory', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            inventory,
            count: inventory?.length || 0
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/inventory - Create or update inventory
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shop_id, product_id, quantity, low_stock_threshold } = body;

        // Validation
        if (!shop_id || !product_id || quantity === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: shop_id, product_id, quantity' },
                { status: 400 }
            );
        }

        // Check if inventory record exists
        const { data: existing } = await supabase
            .from('inventory')
            .select('id')
            .eq('shop_id', shop_id)
            .eq('product_id', product_id)
            .single();

        let result;

        if (existing) {
            // Update existing
            const { data, error } = await supabase
                .from('inventory')
                .update({
                    quantity: parseInt(quantity),
                    low_stock_threshold: low_stock_threshold !== undefined
                        ? parseInt(low_stock_threshold)
                        : undefined
                })
                .eq('id', existing.id)
                .select('*, shops(name), products(name)')
                .single();

            if (error) {
                console.error('Error updating inventory:', error);
                return NextResponse.json(
                    { error: 'Failed to update inventory', details: error.message },
                    { status: 500 }
                );
            }

            result = data;
        } else {
            // Create new
            const { data, error } = await supabase
                .from('inventory')
                .insert({
                    shop_id,
                    product_id,
                    quantity: parseInt(quantity),
                    low_stock_threshold: low_stock_threshold !== undefined
                        ? parseInt(low_stock_threshold)
                        : 5
                })
                .select('*, shops(name), products(name)')
                .single();

            if (error) {
                console.error('Error creating inventory:', error);
                return NextResponse.json(
                    { error: 'Failed to create inventory', details: error.message },
                    { status: 500 }
                );
            }

            result = data;
        }

        return NextResponse.json({
            success: true,
            inventory: result
        }, { status: existing ? 200 : 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/inventory - Bulk update inventory
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { updates } = body; // Array of {shop_id, product_id, quantity}

        if (!Array.isArray(updates) || updates.length === 0) {
            return NextResponse.json(
                { error: 'Updates must be a non-empty array' },
                { status: 400 }
            );
        }

        const results = [];
        const errors = [];

        for (const update of updates) {
            const { shop_id, product_id, quantity } = update;

            try {
                const { data, error } = await supabase
                    .from('inventory')
                    .update({ quantity: parseInt(quantity) })
                    .eq('shop_id', shop_id)
                    .eq('product_id', product_id)
                    .select()
                    .single();

                if (error) {
                    errors.push({ shop_id, product_id, error: error.message });
                } else {
                    results.push(data);
                }
            } catch (err) {
                errors.push({ shop_id, product_id, error: 'Unexpected error' });
            }
        }

        return NextResponse.json({
            success: errors.length === 0,
            updated: results.length,
            failed: errors.length,
            results,
            errors
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
