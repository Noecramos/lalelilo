import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true });

    // Clear Novix session cookie
    response.cookies.delete('novix_session');

    return response;
}
