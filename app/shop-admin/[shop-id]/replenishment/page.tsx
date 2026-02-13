'use client';

import React, { useEffect, useState, use } from 'react';
import { Card } from '@/components/ui';
import {
    Package, Plus, Clock, CheckCircle2, Truck, XCircle,
    Eye, X, Search, RefreshCw, Send, ShoppingBag, ArrowRight
} from 'lucide-react';

const CLIENT_ID = 'acb4b354-728f-479d-915a-c857d27da9ad';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Product {
    id: string;
    name: string;
    image_url?: string;
    sku?: string;
    sizes?: string[];
}

interface ReplenishmentItem {
    id: string;
    product_id: string;
    size: string;
    quantity_requested: number;
    quantity_fulfilled: number;
    product?: Product;
}

interface ReplenishmentRequest {
    id: string;
    shop_id: string;
    dc_id: string;
    requested_by: string;
    status: string;
    notes?: string;
    request_date: string;
    expected_delivery?: string;
    received_at?: string;
    total_items: number;
    created_at: string;
    updated_at: string;
    shop?: { id: string; name: string };
    dc?: { id: string; name: string };
    requester?: { id: string; name: string };
    items?: ReplenishmentItem[];
    status_log?: { id: string; from_status: string; to_status: string; changed_by: string; notes?: string; created_at: string; changed_by_user?: { name: string } }[];
}

// ─── Config ─────────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType; textColor: string }> = {
    requested: { label: 'Solicitado', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200', icon: Clock, textColor: 'text-amber-700' },
    processing: { label: 'Em Separação', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', icon: Package, textColor: 'text-blue-700' },
    in_transit: { label: 'Em Trânsito', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200', icon: Truck, textColor: 'text-purple-700' },
    received: { label: 'Recebido', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200', icon: CheckCircle2, textColor: 'text-green-700' },
    cancelled: { label: 'Cancelado', color: 'text-red-500', bgColor: 'bg-red-50 border-red-200', icon: XCircle, textColor: 'text-red-600' },
};

// ─── Component ──────────────────────────────────────────────────────────────
export default function ShopReplenishmentPage({ params }: { params: Promise<{ 'shop-id': string }> }) {
    const { 'shop-id': shopId } = use(params);
    const [requests, setRequests] = useState<ReplenishmentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState<ReplenishmentRequest | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [products, setProducts] = useState<Product[]>([]);
    const [dcId, setDcId] = useState<string | null>(null);
    const [formNotes, setFormNotes] = useState('');
    const [expectedDelivery, setExpectedDelivery] = useState('');
    const [formItems, setFormItems] = useState<{ product_id: string; size: string; quantity_requested: number }[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchRequests();
        fetchProducts();
        fetchDC();
    }, []);

    const fetchDC = async () => {
        try {
            const res = await fetch(`/api/distribution-centers?client_id=${CLIENT_ID}`);
            const data = await res.json();
            if (data?.length > 0) {
                setDcId(data[0].id);
            } else if (data?.data?.length > 0) {
                setDcId(data.data[0].id);
            }
        } catch (e) {
            console.error('Error fetching DC:', e);
        }
    };

    // ─── Data Fetching ────────────────────────────────────────────────────
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/replenishment?shop_id=${shopId}`);
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Error fetching requests:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(`/api/products?client_id=${CLIENT_ID}`);
            const data = await res.json();
            setProducts(Array.isArray(data?.products) ? data.products : []);
        } catch (e) {
            console.error('Error fetching products:', e);
        }
    };

    const fetchRequestDetail = async (id: string) => {
        try {
            const res = await fetch(`/api/replenishment/${id}`);
            const data = await res.json();
            setShowDetail(data);
        } catch (e) {
            console.error('Error fetching detail:', e);
        }
    };

    // ─── Actions ──────────────────────────────────────────────────────────
    const createRequest = async () => {
        if (formItems.length === 0) {
            alert('Adicione pelo menos um item');
            return;
        }
        const validItems = formItems.filter(i => i.product_id && i.quantity_requested > 0);
        if (validItems.length === 0) {
            alert('Adicione pelo menos um item com quantidade válida');
            return;
        }
        if (!dcId) {
            alert('❌ Centro de distribuição não encontrado. Verifique a configuração.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/replenishment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: CLIENT_ID,
                    shopId: shopId,
                    dcId: dcId,
                    requestedBy: null,
                    items: validItems,
                    notes: formNotes,
                    expectedDelivery: expectedDelivery || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to create');

            setShowForm(false);
            resetForm();
            fetchRequests();
            alert('✅ Pedido de reabastecimento enviado! A equipe será notificada.');
        } catch (e: any) {
            console.error(e);
            alert('❌ Erro ao criar pedido: ' + (e?.message || ''));
        } finally {
            setSubmitting(false);
        }
    };

    const confirmReceived = async (requestId: string) => {
        if (!confirm('Confirmar que os produtos foram recebidos na loja?')) return;
        try {
            const res = await fetch(`/api/replenishment/${requestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'received', changedBy: 'shop' }),
            });
            if (!res.ok) throw new Error('Failed');
            fetchRequests();
            alert('✅ Recebimento confirmado!');
        } catch (e) {
            console.error(e);
            alert('❌ Erro ao confirmar recebimento');
        }
    };

    const cancelRequest = async (requestId: string) => {
        if (!confirm('Cancelar este pedido de reabastecimento?')) return;
        try {
            const res = await fetch(`/api/replenishment/${requestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled', changedBy: 'shop' }),
            });
            if (!res.ok) throw new Error('Failed');
            fetchRequests();
        } catch (e) {
            console.error(e);
            alert('❌ Erro ao cancelar');
        }
    };

    const resetForm = () => {
        setFormNotes('');
        setExpectedDelivery('');
        setFormItems([]);
    };

    const addItem = () => {
        setFormItems([...formItems, { product_id: '', size: '', quantity_requested: 1 }]);
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        const updated = [...formItems];
        (updated[index] as any)[field] = value;
        setFormItems(updated);
    };

    const removeItem = (index: number) => {
        setFormItems(formItems.filter((_, i) => i !== index));
    };

    // ─── Filtering ────────────────────────────────────────────────────────
    const filteredRequests = requests.filter(r => {
        if (filterStatus !== 'all' && r.status !== filterStatus) return false;
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            return r.id.toLowerCase().includes(s) || r.notes?.toLowerCase().includes(s);
        }
        return true;
    });

    const statusCounts = requests.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // ─── Render ───────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reabastecimento</h1>
                    <p className="text-sm text-gray-500 mt-1">Solicite produtos do centro de distribuição</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchRequests}
                        className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-lale-orange text-white rounded-lg hover:bg-[#e8a63e] transition-colors shadow-sm font-medium"
                    >
                        <Plus size={18} />
                        Novo Pedido
                    </button>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(statusConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    const count = statusCounts[key] || 0;
                    const isActive = filterStatus === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setFilterStatus(isActive ? 'all' : key)}
                            className={`p-3 rounded-xl border transition-all text-left ${isActive
                                ? `${config.bgColor} border-2 shadow-sm`
                                : 'bg-white border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Icon size={16} className={config.color} />
                                <span className={`text-xl font-bold ${isActive ? config.textColor : 'text-gray-900'}`}>{count}</span>
                            </div>
                            <p className={`text-xs ${isActive ? config.textColor : 'text-gray-500'}`}>{config.label}</p>
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por ID ou notas..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lale-orange/30 focus:border-lale-orange text-sm"
                />
            </div>

            {/* Request List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lale-orange mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-3">Carregando pedidos...</p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <Card padding="lg">
                    <div className="text-center py-8">
                        <Package size={48} className="mx-auto text-gray-300 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">
                            {requests.length === 0 ? 'Nenhum pedido' : 'Nenhum resultado'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {requests.length === 0
                                ? 'Crie seu primeiro pedido de reabastecimento clicando em "Novo Pedido"'
                                : 'Tente ajustar o filtro ou termo de busca'}
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredRequests.map((req) => {
                        const sc = statusConfig[req.status] || statusConfig.requested;
                        const StatusIcon = sc.icon;
                        return (
                            <Card key={req.id} padding="md" hover className="cursor-pointer" onClick={() => fetchRequestDetail(req.id)}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={`p-2 rounded-lg ${sc.bgColor} border`}>
                                            <StatusIcon size={18} className={sc.color} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-semibold text-gray-900">
                                                    Pedido #{req.id.slice(0, 8).toUpperCase()}
                                                </h4>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.bgColor} ${sc.textColor} border`}>
                                                    {sc.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                {req.total_items} itens • {new Date(req.created_at).toLocaleDateString('pt-BR')}
                                                {req.notes && <span className="ml-2 text-gray-400">— {req.notes.slice(0, 40)}{req.notes.length > 40 ? '...' : ''}</span>}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Confirm receipt button for in_transit */}
                                        {req.status === 'in_transit' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); confirmReceived(req.id); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                                            >
                                                <CheckCircle2 size={14} /> Confirmar Recebimento
                                            </button>
                                        )}

                                        {/* Cancel button for requested status only */}
                                        {req.status === 'requested' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); cancelRequest(req.id); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <XCircle size={14} /> Cancelar
                                            </button>
                                        )}

                                        <button
                                            onClick={(e) => { e.stopPropagation(); fetchRequestDetail(req.id); }}
                                            className="p-2 text-gray-400 hover:text-lale-orange rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ─── NEW REQUEST FORM MODAL ─────────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Solicitar Reabastecimento</h2>
                                <p className="text-sm text-gray-500">Preencha os itens que precisa na loja</p>
                            </div>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Date & Notes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Previsão de Entrega</label>
                                    <input
                                        type="date"
                                        value={expectedDelivery}
                                        onChange={e => setExpectedDelivery(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lale-orange/30 focus:border-lale-orange text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
                                    <input
                                        type="text"
                                        value={formNotes}
                                        onChange={e => setFormNotes(e.target.value)}
                                        placeholder="Ex: Urgente, para vitrine..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lale-orange/30 focus:border-lale-orange text-sm"
                                    />
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-gray-700">Itens</label>
                                    <button
                                        onClick={addItem}
                                        className="flex items-center gap-1 text-sm text-lale-orange hover:text-[#e8a63e] font-medium"
                                    >
                                        <Plus size={16} /> Adicionar Item
                                    </button>
                                </div>

                                {formItems.length === 0 ? (
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                                        <ShoppingBag size={32} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-sm text-gray-500">Clique em "Adicionar Item" para começar</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {formItems.map((item, idx) => {
                                            const selectedProduct = products.find(p => p.id === item.product_id);
                                            return (
                                                <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                        <select
                                                            value={item.product_id}
                                                            onChange={e => updateItem(idx, 'product_id', e.target.value)}
                                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                                                        >
                                                            <option value="">Selecione o produto</option>
                                                            {products.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={item.size}
                                                            onChange={e => updateItem(idx, 'size', e.target.value)}
                                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                                                        >
                                                            <option value="">Tamanho</option>
                                                            {(selectedProduct?.sizes || ['PP', 'P', 'M', 'G', 'GG', '2', '4', '6', '8', '10', '12']).map(s => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity_requested}
                                                            onChange={e => updateItem(idx, 'quantity_requested', Number(e.target.value))}
                                                            placeholder="Qtd"
                                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(idx)}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Summary */}
                            {formItems.length > 0 && (
                                <div className="bg-lale-bg-pink rounded-xl p-4 border border-pink-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">Total de itens</span>
                                        <span className="text-lg font-bold text-lale-orange">
                                            {formItems.reduce((sum, i) => sum + (i.quantity_requested || 0), 0)} unidades
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={() => { setShowForm(false); resetForm(); }}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={createRequest}
                                disabled={submitting || formItems.length === 0}
                                className="flex items-center gap-2 px-6 py-2 bg-lale-orange text-white rounded-lg hover:bg-[#e8a63e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                            >
                                {submitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                                        Enviando...
                                    </div>
                                ) : (
                                    <>
                                        <Send size={16} /> Enviar Pedido
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── DETAIL MODAL ───────────────────────────────────────────── */}
            {showDetail && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Pedido #{showDetail.id.slice(0, 8).toUpperCase()}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    {(() => {
                                        const sc = statusConfig[showDetail.status] || statusConfig.requested;
                                        const StatusIcon = sc.icon;
                                        return (
                                            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sc.bgColor} ${sc.textColor} border`}>
                                                <StatusIcon size={12} /> {sc.label}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>
                            <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Total Itens</p>
                                    <p className="font-semibold text-gray-900">{showDetail.total_items}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Data do Pedido</p>
                                    <p className="font-semibold text-gray-900">{new Date(showDetail.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                                {showDetail.expected_delivery && (
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Previsão Entrega</p>
                                        <p className="font-semibold text-gray-900">{new Date(showDetail.expected_delivery).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                )}
                                {showDetail.notes && (
                                    <div className="col-span-2">
                                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Observações</p>
                                        <p className="text-gray-700">{showDetail.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Items Table */}
                            {showDetail.items && showDetail.items.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Itens do Pedido</h3>
                                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                                                    <th className="px-4 py-2 text-left">Produto</th>
                                                    <th className="px-4 py-2 text-center">Tam.</th>
                                                    <th className="px-4 py-2 text-center">Pedido</th>
                                                    <th className="px-4 py-2 text-center">Enviado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {showDetail.items.map((item, idx) => (
                                                    <tr key={item.id || idx} className="border-t border-gray-50">
                                                        <td className="px-4 py-2.5 font-medium text-gray-900">
                                                            {item.product?.name || item.product_id.slice(0, 8)}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center text-gray-600">{item.size || '-'}</td>
                                                        <td className="px-4 py-2.5 text-center font-semibold">{item.quantity_requested}</td>
                                                        <td className="px-4 py-2.5 text-center">
                                                            <span className={item.quantity_fulfilled >= item.quantity_requested ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                                                                {item.quantity_fulfilled}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Status Timeline */}
                            {showDetail.status_log && showDetail.status_log.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Histórico</h3>
                                    <div className="space-y-3">
                                        {showDetail.status_log.map((log, idx) => {
                                            const toConfig = statusConfig[log.to_status] || statusConfig.requested;
                                            const ToIcon = toConfig.icon;
                                            return (
                                                <div key={log.id || idx} className="flex items-start gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`p-1.5 rounded-full ${toConfig.bgColor} border`}>
                                                            <ToIcon size={12} className={toConfig.color} />
                                                        </div>
                                                        {idx < showDetail.status_log!.length - 1 && (
                                                            <div className="w-0.5 h-6 bg-gray-200 mt-1"></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-medium ${toConfig.textColor}`}>{toConfig.label}</span>
                                                            <span className="text-xs text-gray-400">
                                                                {new Date(log.created_at).toLocaleString('pt-BR')}
                                                            </span>
                                                        </div>
                                                        {log.notes && <p className="text-xs text-gray-500 mt-0.5">{log.notes}</p>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Action: Confirm receipt if in_transit */}
                            {showDetail.status === 'in_transit' && (
                                <button
                                    onClick={() => { confirmReceived(showDetail.id); setShowDetail(null); }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                                >
                                    <CheckCircle2 size={18} /> Confirmar Recebimento
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
