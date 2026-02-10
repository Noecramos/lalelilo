'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import { Trophy, Medal, Star, TrendingUp, Award, Heart, Zap } from 'lucide-react';

const CLIENT_ID = 'acb4b354-728f-479d-915a-c857d27da9ad';

interface LeaderboardEntry {
    rank: number;
    user_id: string;
    xp: number;
    user: { id: string; name: string; avatar_url: string | null; shop_id: string | null; role: string };
}

interface Badge {
    id: string;
    name: string;
    description: string;
    icon_url: string;
    xp_threshold: number;
    category: string;
}

export default function GamificationPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('monthly');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [lbRes, bdgRes] = await Promise.all([
                    fetch(`/api/gamification?action=leaderboard&period=${period}`),
                    fetch(`/api/gamification?action=badges&client_id=${CLIENT_ID}`),
                ]);
                const lbData = await lbRes.json();
                const bdgData = await bdgRes.json();
                setLeaderboard(Array.isArray(lbData) ? lbData : []);
                setBadges(Array.isArray(bdgData) ? bdgData : []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [period]);

    const rankEmoji = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`;
    const roleLabel = (r: string) => {
        const map: Record<string, string> = {
            super_admin: 'Admin', store_manager: 'Gerente', sales_associate: 'Vendedor',
            auditor: 'Auditor', staff: 'Equipe',
        };
        return map[r] || r;
    };
    const roleColor = (r: string) => {
        const map: Record<string, string> = {
            super_admin: 'bg-purple-100 text-purple-700',
            store_manager: 'bg-blue-100 text-blue-700',
            sales_associate: 'bg-green-100 text-green-700',
            auditor: 'bg-yellow-100 text-yellow-700',
            staff: 'bg-gray-100 text-gray-700',
        };
        return map[r] || 'bg-gray-100 text-gray-700';
    };

    const categoryIcon = (c: string) => {
        const map: Record<string, React.ReactNode> = {
            milestone: <Star className="text-yellow-500" size={18} />,
            sales: <TrendingUp className="text-green-500" size={18} />,
            audit: <Award className="text-blue-500" size={18} />,
            social: <Heart className="text-pink-500" size={18} />,
            tickets: <Zap className="text-orange-500" size={18} />,
        };
        return map[c] || <Medal className="text-gray-500" size={18} />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-lale-orange" />
            </div>
        );
    }

    const totalXP = leaderboard.reduce((sum, e) => sum + e.xp, 0);
    const topUser = leaderboard[0];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Trophy className="text-lale-orange" size={28} />
                        Gamificação
                    </h2>
                    <p className="text-gray-500 mt-1">Engajamento e desempenho da equipe</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 p-2.5 rounded-lg">
                            <Trophy className="text-yellow-600" size={22} />
                        </div>
                        <div>
                            <p className="text-sm text-yellow-700 font-medium">Líder do Mês</p>
                            <p className="text-lg font-bold text-gray-900">{topUser?.user.name || '-'}</p>
                            <p className="text-xs text-yellow-600">{topUser?.xp || 0} XP</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2.5 rounded-lg">
                            <Zap className="text-blue-600" size={22} />
                        </div>
                        <div>
                            <p className="text-sm text-blue-700 font-medium">XP Total da Equipe</p>
                            <p className="text-lg font-bold text-gray-900">{totalXP.toLocaleString('pt-BR')}</p>
                            <p className="text-xs text-blue-600">{leaderboard.length} membros ativos</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2.5 rounded-lg">
                            <Medal className="text-purple-600" size={22} />
                        </div>
                        <div>
                            <p className="text-sm text-purple-700 font-medium">Badges Disponíveis</p>
                            <p className="text-lg font-bold text-gray-900">{badges.length}</p>
                            <p className="text-xs text-purple-600">Em {[...new Set(badges.map(b => b.category))].length} categorias</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Leaderboard */}
                <div className="lg:col-span-2">
                    <Card padding="none">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <TrendingUp size={18} className="text-lale-orange" /> Ranking XP
                            </h3>
                            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                                {(['weekly', 'monthly', 'all_time'] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === p
                                                ? 'bg-white text-lale-orange shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {p === 'weekly' ? 'Semanal' : p === 'monthly' ? 'Mensal' : 'Geral'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {leaderboard.length === 0 ? (
                                <div className="px-5 py-10 text-center text-gray-400">
                                    Nenhum dado de XP para este período
                                </div>
                            ) : (
                                leaderboard.map((entry) => (
                                    <div key={entry.user_id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                        <div className="text-2xl w-10 text-center font-bold">
                                            {rankEmoji(entry.rank)}
                                        </div>
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                                entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                                                    entry.rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-500' :
                                                        'bg-gradient-to-br from-lale-pink to-lale-orange'
                                            }`}>
                                            {entry.user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{entry.user.name}</p>
                                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${roleColor(entry.user.role)}`}>
                                                {roleLabel(entry.user.role)}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900">{entry.xp}</p>
                                            <p className="text-xs text-gray-400">XP</p>
                                        </div>
                                        {/* XP Bar */}
                                        <div className="w-24 hidden sm:block">
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-lale-orange to-lale-pink rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, (entry.xp / (topUser?.xp || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                {/* Badges */}
                <div>
                    <Card padding="none">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Medal size={18} className="text-purple-500" /> Badges
                            </h3>
                        </div>
                        <div className="p-3 space-y-2">
                            {badges.map(badge => (
                                <div key={badge.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="text-2xl">{badge.icon_url}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900 truncate">{badge.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{badge.description}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {categoryIcon(badge.category)}
                                        <span className="text-xs font-bold text-gray-600">{badge.xp_threshold}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
