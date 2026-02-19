import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// GET /api/shops - List all shops
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('client_id');
        const isActive = searchParams.get('is_active');

        let query = supabase
            .from('shops')
            .select('*')
            .order('name', { ascending: true });

        // Filter by client_id if provided
        if (clientId) {
            query = query.eq('client_id', clientId);
        }

        // Filter by active status if provided
        if (isActive !== null) {
            query = query.eq('is_active', isActive === 'true');
        }

        const { data: shops, error } = await query;

        if (error) {
            console.error('Error fetching shops:', error);
            return NextResponse.json(
                { error: 'Failed to fetch shops', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            shops,
            count: shops?.length || 0
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/shops - Create new shop (Super Admin only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            client_id,
            name,
            slug,
            address,
            city,
            state,
            cep,
            phone,
            whatsapp,
            email,
            latitude,
            longitude,
            delivery_radius,
            business_hours
        } = body;

        // Validation
        if (!client_id || !name || !slug) {
            return NextResponse.json(
                { error: 'Missing required fields: client_id, name, slug' },
                { status: 400 }
            );
        }

        // Check if slug already exists
        const { data: existingShop } = await supabase
            .from('shops')
            .select('id')
            .eq('slug', slug)
            .single();

        if (existingShop) {
            return NextResponse.json(
                { error: 'Shop with this slug already exists' },
                { status: 409 }
            );
        }

        // Create shop
        const { data: shop, error } = await supabase
            .from('shops')
            .insert({
                client_id,
                name,
                slug,
                address,
                city,
                state,
                cep,
                phone,
                whatsapp,
                email,
                latitude,
                longitude,
                delivery_radius: delivery_radius || 5000,
                business_hours: business_hours || {},
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating shop:', error);
            return NextResponse.json(
                { error: 'Failed to create shop', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            shop
        }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
