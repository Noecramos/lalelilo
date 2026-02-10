// API: Replenishment Status Update
import { NextRequest, NextResponse } from 'next/server';
import { updateReplenishmentStatus, getReplenishmentById } from '@/lib/services/replenishment';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data, error } = await getReplenishmentById(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, changedBy, notes } = await req.json();

    if (!status || !changedBy) {
        return NextResponse.json({ error: 'Missing status or changedBy' }, { status: 400 });
    }

    const { data, error } = await updateReplenishmentStatus(id, status, changedBy, notes);
    if (error) return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    return NextResponse.json(data);
}
