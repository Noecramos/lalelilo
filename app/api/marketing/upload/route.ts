import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const BUCKET_NAME = 'marketing-campaigns';

// Ensure bucket exists
async function ensureBucket() {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some(b => b.name === BUCKET_NAME);
    if (!exists) {
        await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 20 * 1024 * 1024, // 20MB
            allowedMimeTypes: [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'video/mp4', 'video/webm',
            ],
        });
    }
}

// POST /api/marketing/upload — Upload file to Supabase Storage
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const campaignId = formData.get('campaign_id') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        await ensureBucket();

        // Generate unique path
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const folder = campaignId || 'uncategorized';
        const filePath = `${folder}/${timestamp}_${safeName}`;

        // Read file into buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { data, error } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            console.error('[Upload Error]', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);

        return NextResponse.json({
            success: true,
            file_url: publicUrl,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: data.path,
        });
    } catch (err: any) {
        console.error('[Upload Error]', err);
        return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
    }
}
