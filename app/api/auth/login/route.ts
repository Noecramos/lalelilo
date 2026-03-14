import { NextRequest, NextResponse } from 'next/server';
import { authenticateShop, authenticateSuperAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const { identifier, password } = await req.json();

        if (!identifier || !password) {
            return NextResponse.json(
                { error: 'Identificador e senha são obrigatórios' },
                { status: 400 }
            );
        }

        // Check if it's super admin login
        if (identifier === 'super-admin' || identifier.startsWith('admin')) {
            const result = await authenticateSuperAdmin(identifier, password);

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 401 }
                );
            }

            // Set session cookie
            const cookieStore = await cookies();
            cookieStore.set('auth_session', JSON.stringify({
                role: 'super_admin',
                adminId: result.admin.id,
                username: result.admin.username
            }), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            return NextResponse.json({
                success: true,
                role: 'super_admin',
                username: result.admin.username
            });
        }

        // Check if it's a regional manager login (novix_managers table)
        const { data: manager } = await supabaseAdmin
            .from('novix_managers')
            .select('*')
            .eq('username', identifier)
            .eq('is_active', true)
            .single();

        if (manager) {
            // Verify manager password
            if (!manager.password_hash) {
                return NextResponse.json(
                    { error: 'Senha não configurada. Contate o administrador.' },
                    { status: 401 }
                );
            }

            const isValid = await verifyPassword(password, manager.password_hash);
            if (!isValid) {
                return NextResponse.json(
                    { error: 'Senha incorreta' },
                    { status: 401 }
                );
            }

            // Update last login
            await supabaseAdmin
                .from('novix_managers')
                .update({ last_login: new Date().toISOString() })
                .eq('id', manager.id);

            // Set session cookie
            const cookieStore = await cookies();
            cookieStore.set('auth_session', JSON.stringify({
                role: 'regional_manager',
                managerId: manager.id,
                username: manager.username,
                name: manager.name,
                managed_shop_ids: manager.managed_shop_ids || []
            }), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7
            });

            return NextResponse.json({
                success: true,
                role: 'regional_manager',
                managerId: manager.id,
                username: manager.username,
                name: manager.name
            });
        }

        // Shop login (fallback)
        const result = await authenticateShop(identifier, password);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 401 }
            );
        }

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set('auth_session', JSON.stringify({
            role: 'shop',
            shopId: result.shop.id,
            slug: result.shop.slug,
            name: result.shop.name
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return NextResponse.json({
            success: true,
            role: 'shop',
            shopId: result.shop.id,
            slug: result.shop.slug,
            name: result.shop.name
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Erro ao processar login' },
            { status: 500 }
        );
    }
}
