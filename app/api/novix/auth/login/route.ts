import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Find Novix manager
        console.log('[Novix Login] Looking for username:', username);
        const { data: manager, error } = await supabaseAdmin
            .from('novix_managers')
            .select('*')
            .eq('username', username)
            .eq('is_active', true)
            .single();

        if (error) {
            console.error('[Novix Login] Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        if (!manager) {
            console.log('[Novix Login] No manager found for username:', username);
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        console.log('[Novix Login] Manager found:', manager.username);
        console.log('[Novix Login] Has password hash:', !!manager.password_hash);

        // Verify password
        const isValid = await bcrypt.compare(password, manager.password_hash);
        console.log('[Novix Login] Password valid:', isValid);

        if (!isValid) {
            console.log('[Novix Login] Password verification failed');
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Update last login
        await supabaseAdmin
            .from('novix_managers')
            .update({ last_login: new Date().toISOString() })
            .eq('id', manager.id);

        // Create session
        const session = {
            id: manager.id,
            username: manager.username,
            email: manager.email
        };

        const response = NextResponse.json({
            success: true,
            manager: {
                username: manager.username,
                email: manager.email
            }
        });

        // Set HTTP-only cookie
        response.cookies.set('novix_session', JSON.stringify(session), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;
    } catch (error) {
        console.error('Novix login error:', error);
        return NextResponse.json(
            { success: false, error: 'An error occurred' },
            { status: 500 }
        );
    }
}
