'use client';

import React, { useEffect, useState, use } from 'react';
import { Card } from '@/components/ui';
import {
    Megaphone, Calendar, FileText, Download, Image as ImageIcon,
    CheckCircle2, Clock, AlertTriangle, Eye, X, ExternalLink,
    Sparkles, ChevronRight, Store
} from 'lucide-react';

interface CampaignFile {
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
}

interface Campaign {
    id: string;
    title: string;
    description: string;
    instructions: string;
    campaign_type: string;
    status: string;
    cover_image_url: string;
    start_date: string;
    end_date: string;
    priority: string;
    created_at: string;
    published_at: string;
    campaign_files: CampaignFile[];
    isAcknowledgedByShop: boolean;
    totalAcknowledgements: number;
}

const typeConfig: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
    seasonal: { label: 'Sazonal', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', emoji: '🌸' },
    black_friday: { label: 'Black Friday', color: 'text-white', bg: 'bg-gray-900 border-gray-700', emoji: '🖤' },
    launch: { label: 'Lançamento', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', emoji: '🚀' },
    promotion: { label: 'Promoção', color: 'text-red-700', bg: 'bg-red-50 border-red-200', emoji: '🔥' },
    general: { label: 'Geral', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', emoji: '📢' },
};

const priorityColors: Record<string, string> = {
    low: 'text-gray-500',
    normal: 'text-blue-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
};

export default function ShopMarketingPage({
    params
}: {
    params: Promise<{ 'shop-id': string }>;
}) {
    const { 'shop-id': shopId } = use(params);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDetail, setShowDetail] = useState<Campaign | null>(null);
    const [acknowledging, setAcknowledging] = useState(false);

    useEffect(() => { loadCampaigns(); }, [shopId]);

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/marketing/campaigns?shop_id=${shopId}&status=active`);
            const data = await res.json();
            setCampaigns(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const acknowledge = async (campaignId: string) => {
        setAcknowledging(true);
        try {
            const res = await fetch('/api/marketing/acknowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaign_id: campaignId, shop_id: shopId }),
            });
            if (res.ok) {
                loadCampaigns();
                if (showDetail) {
                    setShowDetail({ ...showDetail, isAcknowledgedByShop: true });
                }
            }
        } catch (e) { console.error(e); }
        setAcknowledging(false);
    };

    const isExpiring = (c: Campaign) => {
        if (!c.end_date) return false;
        const diff = new Date(c.end_date).getTime() - Date.now();
        return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
    };

    const unacknowledged = campaigns.filter(c => !c.isAcknowledgedByShop);
    const acknowledged = campaigns.filter(c => c.isAcknowledgedByShop);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-lale-pink" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Megaphone className="text-lale-pink" size={28} />
                    Marketing & Campanhas
                </h2>
                <p className="text-gray-500 mt-1">Campanhas ativas e instruções da marca</p>
            </div>

            {/* Alert banner for unacknowledged campaigns */}
            {unacknowledged.length > 0 && (
                <div className="bg-gradient-to-r from-lale-pink/10 to-lale-orange/10 border border-lale-pink/30 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-lale-pink/20 rounded-xl">
                            <Sparkles size={20} className="text-lale-pink" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">
                                {unacknowledged.length} campanha{unacknowledged.length > 1 ? 's' : ''} nova{unacknowledged.length > 1 ? 's' : ''}!
                            </h3>
                            <p className="text-sm text-gray-600 mt-0.5">
                                Leia as instruções e confirme o recebimento para cada campanha.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Expiring campaigns banner */}
            {campaigns.some(isExpiring) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
                    <div>
                        <p className="font-medium text-amber-800">Campanhas próximas do fim!</p>
                        <p className="text-sm text-amber-600 mt-0.5">
                            {campaigns.filter(isExpiring).map(c => c.title).join(', ')} — terminam em menos de 3 dias
                        </p>
                    </div>
                </div>
            )}

            {/* Unacknowledged Section */}
            {unacknowledged.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Clock size={14} /> Pendentes de Confirmação ({unacknowledged.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {unacknowledged.map(c => (
                            <CampaignCard key={c.id} campaign={c} isExpiring={isExpiring(c)} onClick={() => setShowDetail(c)} />
                        ))}
                    </div>
                </div>
            )}

            {/* Acknowledged Section */}
            {acknowledged.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-500" /> Já Confirmadas ({acknowledged.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {acknowledged.map(c => (
                            <CampaignCard key={c.id} campaign={c} isExpiring={isExpiring(c)} onClick={() => setShowDetail(c)} acknowledged />
                        ))}
                    </div>
                </div>
            )}

            {/* No campaigns */}
            {campaigns.length === 0 && (
                <Card padding="lg">
                    <div className="text-center py-12">
                        <Megaphone size={48} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-500 font-medium">Nenhuma campanha ativa</p>
                        <p className="text-sm text-gray-400 mt-1">Quando a equipe de marketing publicar novas campanhas, elas aparecerão aqui.</p>
                    </div>
                </Card>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                DETAIL MODAL
            ═══════════════════════════════════════════════════════════════════ */}
            {showDetail && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Cover */}
                        <div className="h-52 bg-gradient-to-br from-lale-pink/20 to-lale-orange/20 relative">
                            {showDetail.cover_image_url ? (
                                <img src={showDetail.cover_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-7xl">{typeConfig[showDetail.campaign_type]?.emoji || '📢'}</span>
                                </div>
                            )}
                            <button onClick={() => setShowDetail(null)} className="absolute top-3 right-3 bg-white/90 hover:bg-white p-1.5 rounded-lg shadow-sm">
                                <X size={18} />
                            </button>
                            {/* Type badge */}
                            {(() => {
                                const tc = typeConfig[showDetail.campaign_type] || typeConfig.general;
                                return (
                                    <div className={`absolute top-3 left-3 text-xs font-bold px-3 py-1.5 rounded-lg border ${tc.bg} ${tc.color}`}>
                                        {tc.emoji} {tc.label}
                                    </div>
                                );
                            })()}
                            {isExpiring(showDetail) && (
                                <div className="absolute bottom-3 left-3 bg-amber-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg animate-pulse">
                                    ⏰ Termina em breve!
                                </div>
                            )}
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Title */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{showDetail.title}</h2>
                                {showDetail.priority && showDetail.priority !== 'normal' && (
                                    <p className={`text-sm font-medium mt-1 ${priorityColors[showDetail.priority]}`}>
                                        ⚡ Prioridade: {showDetail.priority === 'high' ? 'Alta' : showDetail.priority === 'urgent' ? 'Urgente' : showDetail.priority}
                                    </p>
                                )}
                            </div>

                            {/* Dates */}
                            {(showDetail.start_date || showDetail.end_date) && (
                                <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
                                    <Calendar size={16} className="text-gray-400" />
                                    <span>
                                        {showDetail.start_date && new Date(showDetail.start_date).toLocaleDateString('pt-BR')}
                                        {showDetail.end_date && ` → ${new Date(showDetail.end_date).toLocaleDateString('pt-BR')}`}
                                    </span>
                                </div>
                            )}

                            {/* Description */}
                            {showDetail.description && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-sm text-gray-700 leading-relaxed">{showDetail.description}</p>
                                </div>
                            )}

                            {/* Instructions */}
                            {showDetail.instructions && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <FileText size={14} className="text-lale-orange" /> Instruções
                                    </h4>
                                    <div className="bg-gradient-to-b from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                                        {showDetail.instructions}
                                    </div>
                                </div>
                            )}

                            {/* Files */}
                            {showDetail.campaign_files?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Download size={14} className="text-lale-orange" /> Arquivos & Materiais
                                    </h4>
                                    <div className="space-y-2">
                                        {showDetail.campaign_files.map(file => (
                                            <a key={file.id} href={file.file_url} target="_blank" rel="noopener" className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-lale-orange/30 transition-all group">
                                                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-orange-50 transition-colors">
                                                    {file.file_type?.startsWith('image') ? <ImageIcon size={18} className="text-purple-500" /> : <FileText size={18} className="text-blue-500" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{file.file_name}</p>
                                                    <p className="text-xs text-gray-400">{file.file_type}</p>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-lale-orange font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Abrir <ExternalLink size={12} />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Acknowledge button */}
                            {!showDetail.isAcknowledgedByShop ? (
                                <button
                                    onClick={() => acknowledge(showDetail.id)}
                                    disabled={acknowledging}
                                    className="w-full px-4 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                >
                                    <CheckCircle2 size={20} />
                                    {acknowledging ? 'Confirmando...' : '✓ Confirmar Recebimento'}
                                </button>
                            ) : (
                                <div className="w-full px-4 py-3.5 bg-green-50 border-2 border-green-200 text-green-700 rounded-xl font-bold text-center flex items-center justify-center gap-2">
                                    <CheckCircle2 size={20} /> Campanha Confirmada ✓
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Campaign Card ──────────────────────────────────────────────────────────
function CampaignCard({ campaign, isExpiring, onClick, acknowledged }: { campaign: Campaign; isExpiring: boolean; onClick: () => void; acknowledged?: boolean }) {
    const tc = typeConfig[campaign.campaign_type] || typeConfig.general;
    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group ${isExpiring ? 'border-amber-300 ring-2 ring-amber-100' : acknowledged ? 'border-green-200' : 'border-gray-100 ring-2 ring-lale-pink/20'}`}
        >
            {/* Cover */}
            <div className="h-32 bg-gradient-to-br from-lale-pink/15 to-lale-orange/15 relative overflow-hidden">
                {campaign.cover_image_url ? (
                    <img src={campaign.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center"><span className="text-4xl">{tc.emoji}</span></div>
                )}
                <div className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-lg border ${campaign.campaign_type === 'black_friday' ? 'bg-gray-900 text-white border-gray-700' : tc.bg + ' ' + tc.color}`}>
                    {tc.emoji} {tc.label}
                </div>
                {isExpiring && <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg animate-pulse">⏰ Termina em breve</div>}
                {acknowledged && <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full"><CheckCircle2 size={14} /></div>}
                {!acknowledged && <div className="absolute top-2 right-2 bg-lale-pink text-white text-xs font-bold px-2 py-1 rounded-lg">NOVA</div>}
            </div>
            {/* Content */}
            <div className="p-4">
                <h3 className="font-bold text-gray-900 line-clamp-1">{campaign.title}</h3>
                {campaign.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{campaign.description}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        {campaign.start_date && <span><Calendar size={12} className="inline mr-1" />{new Date(campaign.start_date).toLocaleDateString('pt-BR')}</span>}
                        {campaign.campaign_files?.length > 0 && <span>📎 {campaign.campaign_files.length}</span>}
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-lale-orange transition-colors" />
                </div>
            </div>
        </div>
    );
}
