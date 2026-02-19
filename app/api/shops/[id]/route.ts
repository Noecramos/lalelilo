import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// GET /api/shops/[id] - Get shop by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: shop, error } = await supabase
            .from('shops')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Shop not found' },
                    { status: 404 }
                );
            }
            console.error('Error fetching shop:', error);
            return NextResponse.json(
                { error: 'Failed to fetch shop', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            shop
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/shops/[id] - Update shop
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Remove fields that shouldn't be updated directly
        const { id: _, client_id, created_at, ...updateData } = body;

        const { data: shop, error } = await supabase
            .from('shops')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Shop not found' },
                    { status: 404 }
                );
            }
            console.error('Error updating shop:', error);
            return NextResponse.json(
                { error: 'Failed to update shop', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            shop
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/shops/[id] - Delete shop (soft delete by setting is_active = false)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Soft delete by setting is_active to false
        const { data: shop, error } = await supabase
            .from('shops')
            .update({ is_active: false })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Shop not found' },
                    { status: 404 }
                );
            }
            console.error('Error deleting shop:', error);
            return NextResponse.json(
                { error: 'Failed to delete shop', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Shop deactivated successfully',
            shop
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
