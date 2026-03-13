import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { hashPassword } from '@/lib/auth';

// TEMPORARY endpoint to reset super admin password
// DELETE THIS FILE AFTER USE
export async function POST(req: NextRequest) {
    try {
        const { secret } = await req.json();

        // Simple secret check
        if (secret !== 'lalelilo-reset-2026') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const newPassword = 'Lalelilo@Super2026';
        const hash = await hashPassword(newPassword);

        const { data, error } = await supabaseAdmin
            .from('super_admin')
            .update({ password_hash: hash })
            .eq('username', 'super-admin')
            .select('id, username, is_active');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully',
            credentials: {
                url: 'https://lalelilo.vercel.app/login',
                identifier: 'super-admin',
                password: newPassword,
            },
            record: data,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
