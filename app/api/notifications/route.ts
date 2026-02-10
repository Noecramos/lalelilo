// API: Notification Queue Processor
// Supports both manual POST and Vercel Cron (GET)
import { NextRequest, NextResponse } from 'next/server';
import { processNotificationQueue } from '@/lib/services/core';

// Vercel Cron hits this as GET every 5 minutes
export async function GET(req: NextRequest) {
    // Verify cron secret (Vercel sets this header)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processNotificationQueue();
    return NextResponse.json(result);
}

// Manual trigger
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'process_queue') {
        const result = await processNotificationQueue();
        return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
