'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Megaphone, Store, CheckCircle2, Clock, TrendingUp, Calendar, Target } from 'lucide-react';

interface Campaign {
    id: string;
    title: string;
    campaign_type: string;
    status: string;
    target_shops: string[];
    totalAcknowledgements: number;
    start_date: string;
    end_date: string;
    created_at: string;
    campaign_acknowledgements: { id: string; shop_id: string; acknowledged_at: string }[];
}

const typeEmoji: Record<string, string> = {
    seasonal: '🌸', black_friday: '🖤', launch: '🚀', promotion: '🔥', general: '📢',
};
const typeLabel: Record<string, string> = {
    seasonal: 'Sazonal', black_friday: 'Black Friday', launch: 'Lançamento', promotion: 'Promoção', general: 'Geral',
};

export default function MarketingReportsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/marketing/campaigns');
                const data = await res.json();
                setCampaigns(Array.isArray(data) ? data : []);
            } catch (e) { console.error(e); }
            setLoading(false);
        })();
    }, []);

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalAcks = campaigns.reduce((sum, c) => sum + (c.totalAcknowledgements || 0), 0);
    const avgAcks = totalCampaigns > 0 ? (totalAcks / totalCampaigns).toFixed(1) : '0';

    // By type
    const byType = Object.keys(typeLabel).map(type => ({
        type,
        label: typeLabel[type],
        emoji: typeEmoji[type],
        count: campaigns.filter(c => c.campaign_type === type).length,
        acks: campaigns.filter(c => c.campaign_type === type).reduce((s, c) => s + (c.totalAcknowledgements || 0), 0),
    })).filter(t => t.count > 0);

    // By status
    const statusData = [
        { status: 'active', label: 'Ativas', color: 'bg-green-500', count: campaigns.filter(c => c.status === 'active').length },
        { status: 'draft', label: 'Rascunho', color: 'bg-gray-400', count: campaigns.filter(c => c.status === 'draft').length },
        { status: 'completed', label: 'Finalizadas', color: 'bg-blue-500', count: campaigns.filter(c => c.status === 'completed').length },
        { status: 'cancelled', label: 'Canceladas', color: 'bg-red-400', count: campaigns.filter(c => c.status === 'cancelled').length },
    ];

    // Top campaigns by acknowledgements
    const topCampaigns = [...campaigns].sort((a, b) => (b.totalAcknowledgements || 0) - (a.totalAcknowledgements || 0)).slice(0, 5);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-lale-pink" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="text-lale-pink" size={28} />
                    Relatórios de Marketing
                </h2>
                <p className="text-gray-500 mt-1">Visão geral de desempenho das campanhas</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total de Campanhas', value: totalCampaigns, icon: Megaphone, gradient: 'from-violet-500 to-purple-600' },
                    { label: 'Campanhas Ativas', value: activeCampaigns, icon: TrendingUp, gradient: 'from-green-500 to-emerald-600' },
                    { label: 'Total Confirmações', value: totalAcks, icon: CheckCircle2, gradient: 'from-blue-500 to-cyan-600' },
                    { label: 'Média Confirmações', value: avgAcks, icon: Store, gradient: 'from-orange-500 to-amber-600' },
                ].map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${kpi.gradient} mb-3`}>
                                <Icon size={20} className="text-white" />
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
                            <p className="text-sm text-gray-500 mt-1">{kpi.label}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Status */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Por Status</h3>
                    <div className="space-y-3">
                        {statusData.map(s => (
                            <div key={s.status}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">{s.label}</span>
                                    <span className="text-sm font-bold text-gray-900">{s.count}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div
                                        className={`${s.color} h-2.5 rounded-full transition-all duration-500`}
                                        style={{ width: totalCampaigns > 0 ? `${(s.count / totalCampaigns) * 100}%` : '0%' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* By Type */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Por Tipo</h3>
                    {byType.length === 0 ? (
                        <p className="text-gray-400 text-sm">Nenhuma campanha criada ainda</p>
                    ) : (
                        <div className="space-y-3">
                            {byType.map(t => (
                                <div key={t.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{t.emoji}</span>
                                        <div>
                                            <p className="font-medium text-gray-900">{t.label}</p>
                                            <p className="text-xs text-gray-500">{t.acks} confirmações</p>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-bold text-gray-900">{t.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Top Campaigns */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-lale-pink" />
                    Top Campanhas por Confirmações
                </h3>
                {topCampaigns.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">Nenhuma campanha ainda</p>
                ) : (
                    <div className="space-y-2">
                        {topCampaigns.map((c, i) => (
                            <div key={c.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                <span className={`text-lg font-bold w-8 text-center ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-700' : 'text-gray-300'}`}>
                                    #{i + 1}
                                </span>
                                <span className="text-xl">{typeEmoji[c.campaign_type] || '📢'}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{c.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {c.start_date ? new Date(c.start_date).toLocaleDateString('pt-BR') : 'S/data'}
                                        {c.end_date && ` → ${new Date(c.end_date).toLocaleDateString('pt-BR')}`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-green-600">{c.totalAcknowledgements || 0}</p>
                                    <p className="text-xs text-gray-400">confirmações</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
