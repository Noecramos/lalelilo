import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// GET /api/products/[id] - Get product by ID
// GET /api/products/[id] - Get product by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: product, error } = await supabase
            .from('products')
            .select('*, categories(id, name, slug)')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Product not found' },
                    { status: 404 }
                );
            }
            console.error('Error fetching product:', error);
            return NextResponse.json(
                { error: 'Failed to fetch product', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/products/[id] - Update product
// PUT /api/products/[id] - Update product
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Remove fields that shouldn't be updated directly
        const { id: _, client_id, created_at, ...updateData } = body;

        // Parse numeric fields
        if (updateData.price) {
            updateData.price = parseFloat(updateData.price);
        }
        if (updateData.compare_at_price) {
            updateData.compare_at_price = parseFloat(updateData.compare_at_price);
        }
        if (updateData.cost_price) {
            updateData.cost_price = parseFloat(updateData.cost_price);
        }

        const { data: product, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Product not found' },
                    { status: 404 }
                );
            }
            console.error('Error updating product:', error);
            return NextResponse.json(
                { error: 'Failed to update product', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/products/[id] - Delete product (soft delete)
// DELETE /api/products/[id] - Delete product (soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Soft delete by setting is_active to false
        const { data: product, error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Product not found' },
                    { status: 404 }
                );
            }
            console.error('Error deleting product:', error);
            return NextResponse.json(
                { error: 'Failed to delete product', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Product deactivated successfully',
            product
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
