'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import {
    Megaphone, Plus, Eye, Edit3, Trash2, X, Send, Clock,
    CheckCircle2, XCircle, Calendar, Tag, Target, Image as ImageIcon,
    FileText, Download, Store, AlertTriangle, Sparkles, ChevronDown
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface CampaignFile {
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
    sort_order: number;
}

interface Acknowledgement {
    id: string;
    shop_id: string;
    acknowledged_at: string;
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
    target_shops: string[];
    priority: string;
    created_at: string;
    published_at: string;
    campaign_files: CampaignFile[];
    campaign_acknowledgements: Acknowledgement[];
    totalAcknowledgements: number;
}

const typeConfig: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
    seasonal: { label: 'Sazonal', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', emoji: '🌸' },
    black_friday: { label: 'Black Friday', color: 'text-gray-900', bg: 'bg-gray-900 border-gray-700 !text-white', emoji: '🖤' },
    launch: { label: 'Lançamento', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', emoji: '🚀' },
    promotion: { label: 'Promoção', color: 'text-red-700', bg: 'bg-red-50 border-red-200', emoji: '🔥' },
    general: { label: 'Geral', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', emoji: '📢' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    draft: { label: 'Rascunho', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200', icon: Edit3 },
    active: { label: 'Ativa', color: 'text-green-600', bg: 'bg-green-100 border-green-200', icon: CheckCircle2 },
    completed: { label: 'Finalizada', color: 'text-blue-600', bg: 'bg-blue-100 border-blue-200', icon: CheckCircle2 },
    cancelled: { label: 'Cancelada', color: 'text-red-500', bg: 'bg-red-100 border-red-200', icon: XCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
    low: { label: 'Baixa', color: 'text-gray-500' },
    normal: { label: 'Normal', color: 'text-blue-600' },
    high: { label: 'Alta', color: 'text-orange-600' },
    urgent: { label: 'Urgente', color: 'text-red-600' },
};

// ─── Component ──────────────────────────────────────────────────────────────
export default function MarketingPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [showCreate, setShowCreate] = useState(false);
    const [showDetail, setShowDetail] = useState<Campaign | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [shops, setShops] = useState<{ id: string; name: string }[]>([]);

    // Form state
    const [form, setForm] = useState({
        title: '',
        description: '',
        instructions: '',
        campaign_type: 'general',
        cover_image_url: '',
        start_date: '',
        end_date: '',
        target_shops: [] as string[],
        priority: 'normal',
        status: 'draft',
    });

    useEffect(() => {
        loadCampaigns();
        loadShops();
    }, []);

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/marketing/campaigns');
            const data = await res.json();
            setCampaigns(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const loadShops = async () => {
        try {
            const res = await fetch('/api/shops');
            const data = await res.json();
            setShops(Array.isArray(data) ? data : data?.shops || []);
        } catch (e) { console.error(e); }
    };

    const resetForm = () => {
        setForm({ title: '', description: '', instructions: '', campaign_type: 'general', cover_image_url: '', start_date: '', end_date: '', target_shops: [], priority: 'normal', status: 'draft' });
        setEditId(null);
    };

    const handleCreate = async () => {
        if (!form.title.trim()) { alert('Título é obrigatório'); return; }
        try {
            const method = editId ? 'PUT' : 'POST';
            const body = editId ? { id: editId, ...form } : form;
            const res = await fetch('/api/marketing/campaigns', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) { const e = await res.json(); alert(`❌ ${e.error}`); return; }
            setShowCreate(false);
            resetForm();
            loadCampaigns();
        } catch (e) { alert('❌ Erro ao salvar'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir esta campanha?')) return;
        try {
            await fetch(`/api/marketing/campaigns?id=${id}`, { method: 'DELETE' });
            loadCampaigns();
            if (showDetail?.id === id) setShowDetail(null);
        } catch (e) { alert('❌ Erro'); }
    };

    const handlePublish = async (id: string) => {
        if (!confirm('Publicar campanha? As lojas poderão visualizar imediatamente.')) return;
        try {
            await fetch('/api/marketing/campaigns', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'active' }),
            });
            loadCampaigns();
        } catch (e) { alert('❌ Erro'); }
    };

    const startEdit = (c: Campaign) => {
        setForm({
            title: c.title || '',
            description: c.description || '',
            instructions: c.instructions || '',
            campaign_type: c.campaign_type || 'general',
            cover_image_url: c.cover_image_url || '',
            start_date: c.start_date || '',
            end_date: c.end_date || '',
            target_shops: c.target_shops || [],
            priority: c.priority || 'normal',
            status: c.status || 'draft',
        });
        setEditId(c.id);
        setShowCreate(true);
    };

    // ─── Filtering ────────────────────────────────────────────────────────
    const filtered = campaigns.filter(c => {
        if (filterStatus !== 'all' && c.status !== filterStatus) return false;
        if (filterType !== 'all' && c.campaign_type !== filterType) return false;
        return true;
    });

    const countByStatus = (s: string) => campaigns.filter(c => c.status === s).length;

    const isExpiring = (c: Campaign) => {
        if (!c.end_date || c.status !== 'active') return false;
        const diff = new Date(c.end_date).getTime() - Date.now();
        return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // 3 days
    };

    // ─── Render ─────────────────────────────────────────────────────────────
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Megaphone className="text-lale-pink" size={28} />
                        Marketing & Campanhas
                    </h2>
                    <p className="text-gray-500 mt-1">Crie e gerencie campanhas de marketing para suas lojas</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowCreate(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-lale-pink to-lale-orange text-white rounded-xl font-medium hover:opacity-90 shadow-md transition-all"
                >
                    <Plus size={18} /> Nova Campanha
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total', value: campaigns.length, color: 'from-gray-500 to-gray-600', icon: Megaphone },
                    { label: 'Ativas', value: countByStatus('active'), color: 'from-green-500 to-emerald-600', icon: CheckCircle2 },
                    { label: 'Rascunhos', value: countByStatus('draft'), color: 'from-gray-400 to-gray-500', icon: Edit3 },
                    { label: 'Finalizadas', value: countByStatus('completed'), color: 'from-blue-500 to-blue-600', icon: CheckCircle2 },
                ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                            <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${s.color} mb-2`}>
                                <Icon size={16} className="text-white" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                            <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Expiring banner */}
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

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {['all', 'active', 'draft', 'completed'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${filterStatus === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                            {s === 'all' ? 'Todas' : statusConfig[s]?.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {['all', ...Object.keys(typeConfig)].map(t => (
                        <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${filterType === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                            {t === 'all' ? 'Tipo: Todos' : `${typeConfig[t]?.emoji} ${typeConfig[t]?.label}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Campaign Grid */}
            {filtered.length === 0 ? (
                <Card padding="lg">
                    <div className="text-center py-12">
                        <Megaphone size={48} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-500 font-medium">Nenhuma campanha encontrada</p>
                        <p className="text-gray-400 text-sm mt-1">Crie sua primeira campanha para começar</p>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(campaign => {
                        const tc = typeConfig[campaign.campaign_type] || typeConfig.general;
                        const sc = statusConfig[campaign.status] || statusConfig.draft;
                        const StatusIcon = sc.icon;
                        const expiring = isExpiring(campaign);
                        return (
                            <div
                                key={campaign.id}
                                className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group ${expiring ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100'}`}
                                onClick={() => setShowDetail(campaign)}
                            >
                                {/* Cover image */}
                                <div className="h-36 bg-gradient-to-br from-lale-pink/20 to-lale-orange/20 relative overflow-hidden">
                                    {campaign.cover_image_url ? (
                                        <img src={campaign.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-5xl">{tc.emoji}</span>
                                        </div>
                                    )}
                                    {/* Type badge */}
                                    <div className={`absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-lg border ${campaign.campaign_type === 'black_friday' ? 'bg-gray-900 text-white border-gray-700' : tc.bg} ${tc.color}`}>
                                        {tc.emoji} {tc.label}
                                    </div>
                                    {/* Status badge */}
                                    <div className={`absolute top-3 right-3 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border ${sc.bg} ${sc.color}`}>
                                        <StatusIcon size={12} /> {sc.label}
                                    </div>
                                    {/* Expiring badge */}
                                    {expiring && (
                                        <div className="absolute bottom-3 left-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg animate-pulse">
                                            ⏰ Termina em breve!
                                        </div>
                                    )}
                                </div>
                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{campaign.title}</h3>
                                    {campaign.description && (
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{campaign.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 flex-wrap">
                                        {campaign.start_date && (
                                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(campaign.start_date).toLocaleDateString('pt-BR')}</span>
                                        )}
                                        {campaign.end_date && (
                                            <span>→ {new Date(campaign.end_date).toLocaleDateString('pt-BR')}</span>
                                        )}
                                        {campaign.campaign_files?.length > 0 && (
                                            <span className="flex items-center gap-1"><FileText size={12} /> {campaign.campaign_files.length} arquivo{campaign.campaign_files.length > 1 ? 's' : ''}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                        <div className="flex items-center gap-1">
                                            <Target size={12} className="text-gray-400" />
                                            <span className="text-xs text-gray-400">
                                                {campaign.target_shops?.length > 0
                                                    ? `${campaign.target_shops.length} loja${campaign.target_shops.length > 1 ? 's' : ''}`
                                                    : 'Todas as lojas'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Store size={12} className="text-green-500" />
                                            <span className="text-xs text-green-600 font-medium">{campaign.totalAcknowledgements || 0} ✓</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                CREATE / EDIT MODAL
            ═══════════════════════════════════════════════════════════════════ */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <Sparkles className="text-lale-pink" size={22} />
                                <h3 className="text-lg font-bold text-gray-900">
                                    {editId ? 'Editar Campanha' : 'Nova Campanha'}
                                </h3>
                            </div>
                            <button onClick={() => { setShowCreate(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lale-pink/30 focus:border-lale-pink" placeholder="Ex: Coleção Inverno 2026" />
                            </div>
                            {/* Type + Priority */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select value={form.campaign_type} onChange={e => setForm(f => ({ ...f, campaign_type: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lale-pink/30">
                                        {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lale-pink/30">
                                        {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                                    <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lale-pink/30" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                                    <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lale-pink/30" />
                                </div>
                            </div>
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lale-pink/30 resize-none" placeholder="Resumo da campanha..." />
                            </div>
                            {/* Instructions */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Instruções para as Lojas</label>
                                <textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} rows={5} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lale-pink/30 resize-none font-mono text-sm" placeholder="Instruções detalhadas...&#10;&#10;- Regras de vitrine&#10;- Material de divulgação&#10;- Preços especiais" />
                            </div>
                            {/* Cover image */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem de Capa</label>
                                <input type="url" value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lale-pink/30" placeholder="https://..." />
                                {form.cover_image_url && (
                                    <img src={form.cover_image_url} alt="Preview" className="mt-2 h-32 rounded-xl object-cover border" />
                                )}
                            </div>
                            {/* Target shops */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lojas Alvo <span className="text-xs text-gray-400"> (vazio = todas as lojas)</span>
                                </label>
                                <div className="border border-gray-200 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
                                    {shops.map(shop => (
                                        <label key={shop.id} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.target_shops.includes(shop.id)}
                                                onChange={e => {
                                                    if (e.target.checked) setForm(f => ({ ...f, target_shops: [...f.target_shops, shop.id] }));
                                                    else setForm(f => ({ ...f, target_shops: f.target_shops.filter(id => id !== shop.id) }));
                                                }}
                                                className="rounded border-gray-300 text-lale-pink focus:ring-lale-pink"
                                            />
                                            <span className="text-sm text-gray-700">{shop.name}</span>
                                        </label>
                                    ))}
                                    {shops.length === 0 && <p className="text-xs text-gray-400">Carregando lojas...</p>}
                                </div>
                            </div>
                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setForm(f => ({ ...f, status: 'draft' })); handleCreate(); }}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit3 size={16} /> Salvar Rascunho
                                </button>
                                <button
                                    onClick={() => { setForm(f => ({ ...f, status: 'active' })); handleCreate(); }}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-lale-pink to-lale-orange text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
                                >
                                    <Send size={16} /> Publicar Agora
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                DETAIL MODAL
            ═══════════════════════════════════════════════════════════════════ */}
            {showDetail && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Cover */}
                        <div className="h-48 bg-gradient-to-br from-lale-pink/20 to-lale-orange/20 relative">
                            {showDetail.cover_image_url ? (
                                <img src={showDetail.cover_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-6xl">{typeConfig[showDetail.campaign_type]?.emoji || '📢'}</span>
                                </div>
                            )}
                            <button onClick={() => setShowDetail(null)} className="absolute top-3 right-3 bg-white/90 hover:bg-white p-1.5 rounded-lg shadow-sm">
                                <X size={18} />
                            </button>
                            {isExpiring(showDetail) && (
                                <div className="absolute bottom-3 left-3 bg-amber-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg animate-pulse">
                                    ⏰ Campanha termina em menos de 3 dias!
                                </div>
                            )}
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Title + badges */}
                            <div>
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                    {(() => {
                                        const tc = typeConfig[showDetail.campaign_type] || typeConfig.general;
                                        const sc = statusConfig[showDetail.status] || statusConfig.draft;
                                        const StatusIcon = sc.icon;
                                        return (
                                            <>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${showDetail.campaign_type === 'black_friday' ? 'bg-gray-900 text-white border-gray-700' : tc.bg + ' ' + tc.color}`}>{tc.emoji} {tc.label}</span>
                                                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-lg border ${sc.bg} ${sc.color}`}><StatusIcon size={10} /> {sc.label}</span>
                                                <span className={`text-xs font-medium ${priorityConfig[showDetail.priority]?.color}`}>⚡ {priorityConfig[showDetail.priority]?.label}</span>
                                            </>
                                        );
                                    })()}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">{showDetail.title}</h2>
                            </div>
                            {/* Dates */}
                            {(showDetail.start_date || showDetail.end_date) && (
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <Calendar size={16} />
                                    {showDetail.start_date && new Date(showDetail.start_date).toLocaleDateString('pt-BR')}
                                    {showDetail.end_date && ` → ${new Date(showDetail.end_date).toLocaleDateString('pt-BR')}`}
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
                                        <FileText size={14} /> Instruções
                                    </h4>
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 whitespace-pre-wrap text-sm text-blue-900 font-mono leading-relaxed">
                                        {showDetail.instructions}
                                    </div>
                                </div>
                            )}
                            {/* Files */}
                            {showDetail.campaign_files?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Arquivos</h4>
                                    <div className="space-y-2">
                                        {showDetail.campaign_files.map(file => (
                                            <a key={file.id} href={file.file_url} target="_blank" rel="noopener" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                                    {file.file_type?.startsWith('image') ? <ImageIcon size={16} className="text-purple-500" /> : <FileText size={16} className="text-blue-500" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{file.file_name}</p>
                                                    <p className="text-xs text-gray-400">{file.file_type} • {(file.file_size / 1024).toFixed(0)}KB</p>
                                                </div>
                                                <Download size={16} className="text-gray-400" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Acknowledgement stats */}
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Store size={16} className="text-green-600" />
                                        <span className="text-sm font-medium text-green-800">Confirmações das Lojas</span>
                                    </div>
                                    <span className="text-lg font-bold text-green-700">{showDetail.totalAcknowledgements || 0}</span>
                                </div>
                                {showDetail.campaign_acknowledgements?.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {showDetail.campaign_acknowledgements.map(ack => (
                                            <div key={ack.id} className="text-xs text-green-600 flex items-center gap-2">
                                                <CheckCircle2 size={10} />
                                                <span>Loja {ack.shop_id.slice(0, 8)} — {new Date(ack.acknowledged_at).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                {showDetail.status === 'draft' && (
                                    <button onClick={() => handlePublish(showDetail.id)} className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:opacity-90 flex items-center justify-center gap-2 shadow-md">
                                        <Send size={16} /> Publicar
                                    </button>
                                )}
                                <button onClick={() => { setShowDetail(null); startEdit(showDetail); }} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                                    <Edit3 size={16} /> Editar
                                </button>
                                <button onClick={() => handleDelete(showDetail.id)} className="px-4 py-3 border border-red-200 rounded-xl text-red-600 hover:bg-red-50 flex items-center justify-center gap-2">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
