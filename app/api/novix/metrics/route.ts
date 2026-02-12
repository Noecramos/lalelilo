import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    try {
        // Get total shops
        const { count: totalShops } = await supabaseAdmin
            .from('shops')
            .select('*', { count: 'exact', head: true });

        // Get active shops
        const { count: activeShops } = await supabaseAdmin
            .from('shops')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        // Get total users across all shops
        const { count: totalUsers } = await supabaseAdmin
            .from('users')
            .select('*', { count: 'exact', head: true });

        return NextResponse.json({
            totalShops: totalShops || 0,
            activeShops: activeShops || 0,
            totalUsers: totalUsers || 0
        });
    } catch (error) {
        console.error('Error fetching Novix metrics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch metrics' },
            { status: 500 }
        );
    }
}
