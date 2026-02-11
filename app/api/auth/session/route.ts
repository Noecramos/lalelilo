import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('auth_session');

        if (!session) {
            return NextResponse.json({ authenticated: false });
        }

        const sessionData = JSON.parse(session.value);

        return NextResponse.json({
            authenticated: true,
            ...sessionData
        });
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json({ authenticated: false });
    }
}
