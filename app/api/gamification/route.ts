// API: Gamification (Leaderboard, Profile, Kudos, Feedback)
import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, getGamificationProfile, sendKudos, giveFeedback, getAllBadges } from '@/lib/services/gamification';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'leaderboard') {
        const period = (searchParams.get('period') || 'monthly') as 'weekly' | 'monthly' | 'all_time';
        const shopId = searchParams.get('shop_id') || undefined;
        const { data } = await getLeaderboard({ period, shopId, limit: 20 });
        return NextResponse.json(data);
    }

    if (action === 'profile') {
        const userId = searchParams.get('user_id');
        if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });
        const profile = await getGamificationProfile(userId);
        return NextResponse.json(profile);
    }

    if (action === 'badges') {
        const clientId = searchParams.get('client_id');
        if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 });
        const { data } = await getAllBadges(clientId);
        return NextResponse.json(data);
    }

    return NextResponse.json({
        api: 'gamification',
        available_actions: {
            GET: {
                leaderboard: '?action=leaderboard&period=weekly|monthly|all_time&shop_id=optional',
                profile: '?action=profile&user_id=required',
                badges: '?action=badges&client_id=required',
            },
            POST: {
                kudos: '{ action: "kudos", fromUserId, toUserId, message, category?, shopId?, clientId }',
                feedback: '{ action: "feedback", managerId, employeeId, type, content, isPrivate?, shopId?, clientId }',
            }
        }
    });
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { action } = body;

    if (action === 'kudos') {
        const { fromUserId, toUserId, message, category, shopId, clientId } = body;
        if (!fromUserId || !toUserId || !message || !clientId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const { data, error } = await sendKudos({ fromUserId, toUserId, message, category, shopId, clientId });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    }

    if (action === 'feedback') {
        const { managerId, employeeId, type, content, isPrivate, shopId, clientId } = body;
        if (!managerId || !employeeId || !type || !content || !clientId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const { data, error } = await giveFeedback({ managerId, employeeId, type, content, isPrivate, shopId, clientId });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
