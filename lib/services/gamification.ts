// Lalelilo - Module 2: Gamification & Employee Experience
// XP Engine, Badges, Leaderboard, Kudos, Manager Feedback

import { createClient } from '@supabase/supabase-js';
import { logActivity, createNotification } from './core';
import { buildKudosMessage } from './waha';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const getSupabase = () => createClient(supabaseUrl, supabaseKey);

// XP values per action
const XP_VALUES: Record<string, number> = {
    'order.completed': 10,
    'checklist.submitted': 15,
    'kudos.received': 5,
    'ticket.resolved': 20,
    'replenishment.received': 8,
    'feedback.positive': 3,
    'sale.above_target': 25,
};

// ============================================================================
// XP ENGINE
// ============================================================================

export async function awardXP(params: {
    userId: string;
    reason: string;
    sourceType?: string;
    sourceId?: string;
    shopId?: string;
    customAmount?: number;
}) {
    const supabase = getSupabase();
    const amount = params.customAmount || XP_VALUES[params.reason] || 1;

    const { data, error } = await supabase.from('xp_ledger').insert({
        user_id: params.userId,
        amount,
        reason: params.reason,
        source_type: params.sourceType,
        source_id: params.sourceId,
        shop_id: params.shopId,
    }).select().single();

    if (!error) {
        // Check if user earned any new badges
        await checkAndAwardBadges(params.userId);
    }

    return { data, error };
}

export async function getUserXP(userId: string) {
    const supabase = getSupabase();
    const { data } = await supabase
        .from('xp_ledger')
        .select('amount')
        .eq('user_id', userId);

    const total = data?.reduce((sum, row) => sum + row.amount, 0) || 0;
    return total;
}

export async function getXPHistory(userId: string, limit = 20) {
    const supabase = getSupabase();
    return supabase
        .from('xp_ledger')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
}

// ============================================================================
// BADGES
// ============================================================================

async function checkAndAwardBadges(userId: string) {
    const supabase = getSupabase();
    const totalXP = await getUserXP(userId);

    // Get badges user doesn't have yet, where XP threshold is met
    const { data: availableBadges } = await supabase
        .from('badges')
        .select('id, name, xp_threshold')
        .eq('is_active', true)
        .not('id', 'in', `(SELECT badge_id FROM user_badges WHERE user_id = '${userId}')`)
        .lte('xp_threshold', totalXP);

    if (!availableBadges?.length) return;

    for (const badge of availableBadges) {
        await supabase.from('user_badges').insert({
            user_id: userId,
            badge_id: badge.id,
        });

        await logActivity({
            actorId: userId,
            action: 'badge.earned',
            entityType: 'badge',
            entityId: badge.id,
            clientId: '', // Will be filled from user context
            metadata: { badge_name: badge.name, total_xp: totalXP },
        });
    }
}

export async function getUserBadges(userId: string) {
    const supabase = getSupabase();
    return supabase
        .from('user_badges')
        .select('*, badge:badges(*)')
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false });
}

export async function getAllBadges(clientId: string) {
    const supabase = getSupabase();
    return supabase
        .from('badges')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('xp_threshold', { ascending: true });
}

// ============================================================================
// LEADERBOARD
// ============================================================================

export async function getLeaderboard(params: {
    period: 'weekly' | 'monthly' | 'all_time';
    shopId?: string;
    limit?: number;
}) {
    const supabase = getSupabase();

    let dateFilter: string | null = null;
    const now = new Date();

    if (params.period === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = weekAgo.toISOString();
    } else if (params.period === 'monthly') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        dateFilter = monthAgo.toISOString();
    }

    let query = supabase
        .from('xp_ledger')
        .select('user_id, amount, shop_id');

    if (dateFilter) {
        query = query.gte('created_at', dateFilter);
    }
    if (params.shopId) {
        query = query.eq('shop_id', params.shopId);
    }

    const { data: xpData } = await query;

    if (!xpData?.length) return { data: [] };

    // Aggregate XP per user
    const userXP: Record<string, number> = {};
    for (const row of xpData) {
        userXP[row.user_id] = (userXP[row.user_id] || 0) + row.amount;
    }

    // Sort and limit
    const sorted = Object.entries(userXP)
        .sort(([, a], [, b]) => b - a)
        .slice(0, params.limit || 20);

    // Get user details
    const userIds = sorted.map(([id]) => id);
    const { data: users } = await supabase
        .from('users')
        .select('id, name, avatar_url, shop_id, role')
        .in('id', userIds);

    const userMap = new Map(users?.map(u => [u.id, u]));

    const leaderboard = sorted.map(([userId, xp], index) => ({
        rank: index + 1,
        user_id: userId,
        xp,
        user: userMap.get(userId) || null,
    }));

    return { data: leaderboard };
}

// ============================================================================
// KUDOS (Peer-to-Peer Recognition)
// ============================================================================

export async function sendKudos(params: {
    fromUserId: string;
    toUserId: string;
    message: string;
    category?: string;
    shopId?: string;
    clientId: string;
}) {
    const supabase = getSupabase();

    const { data, error } = await supabase.from('kudos').insert({
        from_user_id: params.fromUserId,
        to_user_id: params.toUserId,
        message: params.message,
        category: params.category,
        shop_id: params.shopId,
    }).select().single();

    if (error) return { error };

    // Award XP to receiver
    await awardXP({
        userId: params.toUserId,
        reason: 'kudos.received',
        sourceType: 'kudos',
        sourceId: data.id,
        shopId: params.shopId,
    });

    // Get sender name for notification
    const { data: sender } = await supabase
        .from('users')
        .select('name, phone')
        .eq('id', params.fromUserId)
        .single();

    // Get receiver for notification
    const { data: receiver } = await supabase
        .from('users')
        .select('phone')
        .eq('id', params.toUserId)
        .single();

    if (receiver?.phone && sender?.name) {
        await createNotification({
            userId: params.toUserId,
            type: 'kudos',
            body: buildKudosMessage(sender.name, params.message),
            phoneNumber: receiver.phone,
        });
    }

    await logActivity({
        actorId: params.fromUserId,
        action: 'kudos.sent',
        entityType: 'kudos',
        entityId: data.id,
        shopId: params.shopId,
        clientId: params.clientId,
    });

    return { data };
}

export async function getKudosForUser(userId: string, limit = 20) {
    const supabase = getSupabase();
    return supabase
        .from('kudos')
        .select('*, from_user:users!from_user_id(id, name, avatar_url)')
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
}

// ============================================================================
// MANAGER FEEDBACK
// ============================================================================

export async function giveFeedback(params: {
    managerId: string;
    employeeId: string;
    type: 'praise' | 'improvement' | 'goal' | 'note';
    content: string;
    isPrivate?: boolean;
    shopId?: string;
    clientId: string;
}) {
    const supabase = getSupabase();

    const { data, error } = await supabase.from('manager_feedback').insert({
        manager_id: params.managerId,
        employee_id: params.employeeId,
        type: params.type,
        content: params.content,
        is_private: params.isPrivate || false,
        shop_id: params.shopId,
    }).select().single();

    if (!error && params.type === 'praise') {
        await awardXP({
            userId: params.employeeId,
            reason: 'feedback.positive',
            sourceType: 'manager_feedback',
            sourceId: data.id,
            shopId: params.shopId,
        });
    }

    return { data, error };
}

export async function getFeedbackForEmployee(employeeId: string, limit = 20) {
    const supabase = getSupabase();
    return supabase
        .from('manager_feedback')
        .select('*, manager:users!manager_id(id, name, avatar_url)')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(limit);
}

// ============================================================================
// GAMIFICATION PROFILE
// ============================================================================

export async function getGamificationProfile(userId: string) {
    const supabase = getSupabase();

    const [xp, badges, kudos, recentXP] = await Promise.all([
        getUserXP(userId),
        getUserBadges(userId),
        getKudosForUser(userId, 5),
        getXPHistory(userId, 10),
    ]);

    return {
        total_xp: xp,
        badges: badges.data || [],
        recent_kudos: kudos.data || [],
        recent_xp: recentXP.data || [],
    };
}
