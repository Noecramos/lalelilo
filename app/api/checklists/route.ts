// API: Checklists (Templates + Submissions)
import { NextRequest, NextResponse } from 'next/server';
import { createChecklistTemplate, getChecklistTemplates, submitChecklist } from '@/lib/services/audit';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');
    if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 });

    const { data, error } = await getChecklistTemplates(clientId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { action } = body;

    if (action === 'create_template') {
        const { clientId, name, description, category, createdBy, items } = body;
        if (!clientId || !name || !createdBy || !items?.length) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const { data, error } = await createChecklistTemplate({ clientId, name, description, category, createdBy, items });
        if (error) return NextResponse.json({ error: (error as Error).message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    }

    if (action === 'submit') {
        const { templateId, clientId, shopId, submittedBy, responses, notes } = body;
        if (!templateId || !clientId || !shopId || !submittedBy || !responses?.length) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const { data, error } = await submitChecklist({ templateId, clientId, shopId, submittedBy, responses, notes });
        if (error) return NextResponse.json({ error: (error as Error).message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
