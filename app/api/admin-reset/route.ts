import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// TEMPORARY endpoint to reset super admin password
// DELETE THIS FILE AFTER USE
export async function POST(req: NextRequest) {
    try {
        const { secret } = await req.json();

        if (secret !== 'lalelilo-reset-2026') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            return NextResponse.json({
                error: 'Missing env vars',
                hasUrl: !!url,
                hasKey: !!key,
            }, { status: 500 });
        }

        const supabase = createClient(url, key);

        const newPassword = 'Lalelilo@Super2026';
        const hash = await bcrypt.hash(newPassword, 10);

        const { data, error } = await supabase
            .from('super_admin')
            .update({ password_hash: hash })
            .eq('username', 'super-admin')
            .select('id, username, is_active');

        if (error) {
            return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            credentials: {
                url: 'https://lalelilo.vercel.app/login',
                identifier: 'super-admin',
                password: newPassword,
            },
            record: data,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack?.substring(0, 300) }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ status: 'ok', message: 'Use POST with secret' });
}
