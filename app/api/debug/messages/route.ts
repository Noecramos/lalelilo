import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(request: NextRequest) {
    try {
        // Security check: usually you'd want a secret or auth here
        // For this debugging session, we'll allow it but log it.
        console.warn('RESET MESSAGES TRIGGERED');

        const { error } = await supabaseAdmin
            .from('messages')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'All messages deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    // Debug info
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasKey = !!serviceKey && serviceKey !== 'placeholder-service-role-key';

    return NextResponse.json({
        hasServiceKey: hasKey,
        keyLength: serviceKey?.length || 0,
        env: process.env.NODE_ENV
    });
}
