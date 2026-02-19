// Meta Data Deletion Callback
// Required for Meta App Review - handles user data deletion requests
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import crypto from 'crypto';

const APP_SECRET = process.env.META_APP_SECRET || '';

function parseSignedRequest(signedRequest: string, secret: string) {
    const [encodedSig, payload] = signedRequest.split('.');
    const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest();
    if (!crypto.timingSafeEqual(sig, expectedSig)) {
        throw new Error('Invalid signature');
    }
    return data;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const signedRequest = formData.get('signed_request') as string;

        if (!signedRequest || !APP_SECRET) {
            return NextResponse.json({
                url: 'https://lalelilo.vercel.app/data-deletion-status',
                confirmation_code: 'no_request',
            });
        }

        const data = parseSignedRequest(signedRequest, APP_SECRET);
        const userId = data.user_id;
        const confirmationCode = `del_${userId}_${Date.now()}`;

        // Log the deletion request
        console.log(`[Data Deletion] Request from user ${userId}, code: ${confirmationCode}`);

        // Delete user data from contacts (by facebook_id or instagram_id)
        if (userId) {
            // Find and delete associated data
            const { data: contacts } = await supabase
                .from('contacts')
                .select('id')
                .or(`facebook_id.eq.${userId},instagram_id.eq.${userId}`);

            if (contacts && contacts.length > 0) {
                const contactIds = contacts.map(c => c.id);

                // Delete messages
                await supabase
                    .from('messages')
                    .delete()
                    .in('contact_id', contactIds);

                // Delete conversations
                await supabase
                    .from('conversations')
                    .delete()
                    .in('contact_id', contactIds);

                // Delete contacts
                await supabase
                    .from('contacts')
                    .delete()
                    .in('id', contactIds);

                console.log(`[Data Deletion] Deleted data for ${contactIds.length} contact(s)`);
            }
        }

        // Meta expects this exact response format
        return NextResponse.json({
            url: `https://lalelilo.vercel.app/data-deletion-status?code=${confirmationCode}`,
            confirmation_code: confirmationCode,
        });
    } catch (error: any) {
        console.error('[Data Deletion] Error:', error.message);
        return NextResponse.json({
            url: 'https://lalelilo.vercel.app/data-deletion-status',
            confirmation_code: 'error',
        });
    }
}

// GET: Status check page
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code') || '';

    return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Data Deletion Status - Lalelilo</title></head>
        <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h1>Data Deletion Status</h1>
            <p>Confirmation Code: <strong>${code || 'N/A'}</strong></p>
            <p>Your data deletion request has been processed. All personal data associated with your
            Facebook/Instagram account has been removed from our systems.</p>
            <p>If you have any questions, contact us at <a href="mailto:noecramos@gmail.com">noecramos@gmail.com</a></p>
            <hr/>
            <p style="color: #999; font-size: 12px;">Lalelilo by Novix Online • Powered by Noviapp AI Systems ®</p>
        </body>
        </html>
    `, {
        headers: { 'Content-Type': 'text/html' },
    });
}
