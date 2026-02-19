import { NextRequest, NextResponse } from 'next/server';
import { microvix } from '@/lib/services/microvix';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

const CLIENT_ID = process.env.DEFAULT_CLIENT_ID || '';

/**
 * GET /api/microvix — Test connection or sync data
 * ?action=test — Test connection
 * ?action=sync-products — Sync products from Microvix to Supabase
 * ?action=sync-stock — Sync stock/details from Microvix
 * ?action=brands — Fetch brands
 * ?action=sectors — Fetch sectors
 * ?action=products — Fetch raw products
 * ?action=details — Fetch product details (sizes, colors, stock)
 */
export async function GET(request: NextRequest) {
    const action = request.nextUrl.searchParams.get('action') || 'test';
    const timestamp = request.nextUrl.searchParams.get('timestamp') || undefined;

    try {
        switch (action) {
            case 'test': {
                const result = await microvix.testConnection();
                return NextResponse.json(result);
            }

            case 'products': {
                const result = await microvix.getProducts(timestamp);
                return NextResponse.json(result);
            }

            case 'details': {
                const result = await microvix.getProductDetails(timestamp);
                return NextResponse.json(result);
            }

            case 'brands': {
                const result = await microvix.getBrands();
                return NextResponse.json(result);
            }

            case 'sectors': {
                const result = await microvix.getSectors();
                return NextResponse.json(result);
            }

            case 'lines': {
                const result = await microvix.getLines();
                return NextResponse.json(result);
            }

            case 'orders': {
                const result = await microvix.getOrders(timestamp);
                return NextResponse.json(result);
            }

            case 'customers': {
                const result = await microvix.getCustomers(timestamp);
                return NextResponse.json(result);
            }

            case 'nfe': {
                const result = await microvix.getNFe(timestamp);
                return NextResponse.json(result);
            }

            case 'sync-products': {
                return await syncProducts();
            }

            case 'sync-stock': {
                return await syncStock();
            }

            case 'full-sync': {
                const productsResult = await syncProductsInternal();
                const stockResult = await syncStockInternal();
                return NextResponse.json({
                    success: productsResult.success && stockResult.success,
                    products: productsResult,
                    stock: stockResult,
                    timestamp: new Date().toISOString(),
                });
            }

            default:
                return NextResponse.json({ error: 'Unknown action. Use: test, products, details, brands, sectors, sync-products, sync-stock, full-sync' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('[Microvix API Error]', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}

// ─── Sync Products from Microvix → Supabase ────────────────────────────────────

async function syncProductsInternal() {
    const { success, products, error } = await microvix.getProducts();

    if (!success || !products.length) {
        return { success: false, error: error || 'No products returned', synced: 0, fetched: 0 };
    }

    let synced = 0;
    const errors: string[] = [];

    for (const mvProduct of products) {
        try {
            // Check if product exists by SKU/reference
            const { data: existing } = await supabase
                .from('products')
                .select('id')
                .eq('client_id', CLIENT_ID)
                .eq('sku', mvProduct.codigoproduto)
                .single();

            const productData = {
                client_id: CLIENT_ID,
                name: mvProduct.nome || `Produto ${mvProduct.codigoproduto}`,
                sku: mvProduct.codigoproduto,
                price: mvProduct.preco || 0,
                cost_price: mvProduct.preco_custo || 0,
                active: mvProduct.ativo !== false,
                category: mvProduct.setor || mvProduct.linha || null,
                brand: mvProduct.marca || null,
                metadata: {
                    microvix_id: mvProduct.codigoproduto,
                    microvix_referencia: mvProduct.referencia,
                    microvix_codebar: mvProduct.codebar,
                    microvix_timestamp: mvProduct.timestamp,
                    synced_at: new Date().toISOString(),
                },
            };

            if (existing) {
                // Update existing
                await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', existing.id);
            } else {
                // Insert new
                await supabase
                    .from('products')
                    .insert(productData);
            }
            synced++;
        } catch (e: any) {
            errors.push(`${mvProduct.codigoproduto}: ${e.message}`);
        }
    }

    return {
        success: true,
        fetched: products.length,
        synced,
        errors: errors.length > 0 ? errors : undefined,
    };
}

async function syncProducts() {
    const result = await syncProductsInternal();
    return NextResponse.json(result);
}

// ─── Sync Stock/Details from Microvix → Supabase ───────────────────────────────

async function syncStockInternal() {
    const { success, details, error } = await microvix.getProductDetails();

    if (!success) {
        return { success: false, error: error || 'Failed to fetch details', synced: 0, fetched: 0 };
    }

    let synced = 0;
    const errors: string[] = [];

    // Group details by product
    const productMap = new Map<string, { sizes: string[]; total_stock: number; variants: any[] }>();

    for (const detail of details) {
        const key = detail.codigoproduto;
        if (!productMap.has(key)) {
            productMap.set(key, { sizes: [], total_stock: 0, variants: [] });
        }
        const entry = productMap.get(key)!;

        if (detail.tamanho && !entry.sizes.includes(detail.tamanho)) {
            entry.sizes.push(detail.tamanho);
        }
        entry.total_stock += detail.quantidade_estoque || 0;
        entry.variants.push({
            size: detail.tamanho,
            color: detail.cor,
            stock: detail.quantidade_estoque,
            barcode: detail.codebar,
            price: detail.preco,
        });
    }

    // Update products in Supabase
    for (const [codigoproduto, data] of productMap) {
        try {
            const { data: existing } = await supabase
                .from('products')
                .select('id, metadata')
                .eq('client_id', CLIENT_ID)
                .eq('sku', codigoproduto)
                .single();

            if (existing) {
                await supabase
                    .from('products')
                    .update({
                        sizes: data.sizes,
                        stock_quantity: data.total_stock,
                        metadata: {
                            ...(existing.metadata || {}),
                            microvix_variants: data.variants,
                            stock_synced_at: new Date().toISOString(),
                        },
                    })
                    .eq('id', existing.id);
                synced++;
            }
        } catch (e: any) {
            errors.push(`${codigoproduto}: ${e.message}`);
        }
    }

    return {
        success: true,
        fetched: details.length,
        products_updated: synced,
        unique_products: productMap.size,
        errors: errors.length > 0 ? errors : undefined,
    };
}

async function syncStock() {
    const result = await syncStockInternal();
    return NextResponse.json(result);
}

/**
 * POST /api/microvix — Push data to Microvix
 * body.action: 'create-order' | 'register-customer'
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'register-customer': {
                const result = await microvix.registerCustomer(body.customer);
                return NextResponse.json(result);
            }

            case 'create-order': {
                const orderResult = await microvix.createOrder(body.order);
                if (!orderResult.success) {
                    return NextResponse.json(orderResult, { status: 400 });
                }

                if (body.items?.length && orderResult.orderId) {
                    const itemsResult = await microvix.addOrderItems(orderResult.orderId, body.items);
                    return NextResponse.json({
                        success: true,
                        orderId: orderResult.orderId,
                        items: itemsResult,
                    });
                }

                return NextResponse.json(orderResult);
            }

            default:
                return NextResponse.json({ error: 'Unknown action. Use: register-customer, create-order' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('[Microvix POST Error]', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}
