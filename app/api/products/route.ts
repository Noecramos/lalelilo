import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/products - List all products
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('client_id');
        const categoryId = searchParams.get('category_id');
        const isActive = searchParams.get('is_active');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = supabase
            .from('products')
            .select('*, categories(name)', { count: 'exact' })
            .order('name', { ascending: true })
            .range(offset, offset + limit - 1);

        // Filters
        if (clientId) {
            query = query.eq('client_id', clientId);
        }

        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }

        if (isActive !== null) {
            query = query.eq('is_active', isActive === 'true');
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
        }

        const { data: products, error, count } = await query;

        if (error) {
            console.error('Error fetching products:', error);
            return NextResponse.json(
                { error: 'Failed to fetch products', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            products,
            count,
            limit,
            offset
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/products - Create new product (Super Admin only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            client_id,
            category_id,
            name,
            slug,
            description,
            price,
            compare_at_price,
            cost_price,
            sku,
            barcode,
            image_url,
            images,
            sizes,
            colors
        } = body;

        // Validation
        if (!client_id || !name || !slug || !price) {
            return NextResponse.json(
                { error: 'Missing required fields: client_id, name, slug, price' },
                { status: 400 }
            );
        }

        // Check if slug already exists for this client
        const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('client_id', client_id)
            .eq('slug', slug)
            .single();

        if (existingProduct) {
            return NextResponse.json(
                { error: 'Product with this slug already exists' },
                { status: 409 }
            );
        }

        // Create product
        const { data: product, error } = await supabase
            .from('products')
            .insert({
                client_id,
                category_id,
                name,
                slug,
                description,
                price: parseFloat(price),
                compare_at_price: compare_at_price ? parseFloat(compare_at_price) : null,
                cost_price: cost_price ? parseFloat(cost_price) : null,
                sku,
                barcode,
                image_url,
                images: images || [],
                sizes: sizes || [],
                colors: colors || [],
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating product:', error);
            return NextResponse.json(
                { error: 'Failed to create product', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            product
        }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
