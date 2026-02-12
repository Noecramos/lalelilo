'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import {
    Package, Plus, Clock, CheckCircle2, Truck, XCircle,
    ChevronRight, Filter, Eye, X, AlertTriangle,
    ArrowRight, ChevronDown, Search, RefreshCw, Send
} from 'lucide-react';

const CLIENT_ID = 'acb4b354-728f-479d-915a-c857d27da9ad';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Shop {
    id: string;
    name: string;
}

interface DC {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    image_url?: string;
    sku?: string;
    product_type?: string;
    product_tier?: string;
    gender?: string;
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

const nextStatus: Record<string, string> = {
    requested: 'processing',
    processing: 'in_transit',
    in_transit: 'received',
};

const nextStatusLabel: Record<string, string> = {
    requested: 'Iniciar Separação',
    processing: 'Enviado / Em Trânsito',
    in_transit: 'Confirmar Recebimento',
};

// ─── Component ──────────────────────────────────────────────────────────────
export default function ReplenishmentPage() {
    const [requests, setRequests] = useState<ReplenishmentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState<ReplenishmentRequest | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [shops, setShops] = useState<Shop[]>([]);
    const [dcs, setDcs] = useState<DC[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedShop, setSelectedShop] = useState('');
    const [selectedDC, setSelectedDC] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [expectedDelivery, setExpectedDelivery] = useState('');
    const [formItems, setFormItems] = useState<{ product_id: string; size: string; quantity_requested: number }[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchRequests();
        fetchShopsAndDCs();
        fetchProducts();
    }, []);

    // ─── Data Fetching ────────────────────────────────────────────────────
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/replenishment');
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Error fetching requests:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchShopsAndDCs = async () => {
        try {
            const shopsRes = await fetch(`/api/shops?client_id=${CLIENT_ID}`);
            const shopsData = await shopsRes.json();
            setShops(Array.isArray(shopsData?.shops) ? shopsData.shops : []);

            // For DCs, we'll try to fetch them; if the endpoint doesn't exist, use a default
            try {
                const dcRes = await fetch(`/api/replenishment?dc_list=true`);
                const dcData = await dcRes.json();
                if (Array.isArray(dcData) && dcData.length > 0) {
                    setDcs(dcData);
                } else {
                    setDcs([{ id: 'dc-default', name: 'CD Principal' }]);
                }
            } catch {
                setDcs([{ id: 'dc-default', name: 'CD Principal' }]);
            }
        } catch (e) {
            console.error('Error fetching shops/DCs:', e);
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
        if (!selectedShop || formItems.length === 0) {
            alert('Selecione uma loja e adicione pelo menos um item');
            return;
        }
        const validItems = formItems.filter(i => i.product_id && i.quantity_requested > 0);
        if (validItems.length === 0) {
            alert('Adicione pelo menos um item com quantidade válida');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/replenishment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: CLIENT_ID,
                    shopId: selectedShop,
                    dcId: selectedDC || dcs[0]?.id || 'dc-default',
                    requestedBy: 'admin',
                    items: validItems,
                    notes: formNotes,
                    expectedDelivery: expectedDelivery || undefined,
                }),
            });

            if (!res.ok) throw new Error('Failed to create');

            setShowForm(false);
            resetForm();
            fetchRequests();
            alert('✅ Pedido de reabastecimento criado com sucesso!');
        } catch (e) {
            console.error(e);
            alert('❌ Erro ao criar pedido');
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (requestId: string, newStatus: string) => {
        const confirmMessages: Record<string, string> = {
            processing: 'Iniciar separação deste pedido?',
            in_transit: 'Confirmar envio para a loja?',
            received: 'Confirmar recebimento na loja?',
            cancelled: 'Cancelar este pedido?',
        };

        if (!confirm(confirmMessages[newStatus] || `Mudar status para ${newStatus}?`)) return;

        try {
            const res = await fetch(`/api/replenishment/${requestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    changedBy: 'admin',
                    notes: `Status atualizado para ${statusConfig[newStatus]?.label}`,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                alert(`❌ Erro: ${error.error}`);
                return;
            }

            fetchRequests();
            if (showDetail?.id === requestId) {
                fetchRequestDetail(requestId);
            }
        } catch (e) {
            console.error(e);
            alert('❌ Erro ao atualizar status');
        }
    };

    const resetForm = () => {
        setSelectedShop('');
        setSelectedDC('');
        setFormNotes('');
        setExpectedDelivery('');
        setFormItems([]);
    };

    const addItem = () => {
        setFormItems([...formItems, { product_id: '', size: 'P', quantity_requested: 1 }]);
    };

    const removeItem = (index: number) => {
        setFormItems(formItems.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        setFormItems(formItems.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };

    // ─── Filtering ────────────────────────────────────────────────────────
    const filtered = requests.filter(r => {
        const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
        const matchesSearch = !searchTerm ||
            r.shop?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.id.includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    const countByStatus = (s: string) => requests.filter(r => r.status === s).length;

    // ─── Render ───────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-lale-orange" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="text-lale-orange" size={28} />
                        Reabastecimento
                    </h2>
                    <p className="text-gray-500 mt-1">Gerencie pedidos de estoque das lojas para o CD</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchRequests}
                        className="flex items-center gap-2 px-3 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-lale-orange to-lale-pink text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-md"
                    >
                        <Plus size={18} /> Novo Pedido
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(statusConfig).map(([key, cfg]) => {
                    const StatusIcon = cfg.icon;
                    const count = countByStatus(key);
                    return (
                        <button
                            key={key}
                            onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
                            className={`p-4 rounded-xl border-2 transition-all ${filterStatus === key ? 'ring-2 ring-lale-orange ring-offset-2' : ''} ${cfg.bgColor}`}
                        >
                            <div className="flex items-center gap-2">
                                <StatusIcon size={18} className={cfg.color} />
                                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                        </button>
                    );
                })}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar por loja ou ID..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                />
            </div>

            {/* Request List */}
            <Card padding="none">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Filter size={16} className="text-gray-400" />
                        {filterStatus === 'all' ? 'Todos os Pedidos' : statusConfig[filterStatus]?.label}
                        <span className="text-sm font-normal text-gray-400">({filtered.length})</span>
                    </h3>
                </div>

                {filtered.length === 0 ? (
                    <div className="px-5 py-16 text-center">
                        <Package size={48} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Nenhum pedido encontrado</p>
                        <p className="text-gray-400 text-sm mt-1">Crie um novo pedido clicando em &quot;Novo Pedido&quot;</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filtered.map(request => {
                            const sCfg = statusConfig[request.status] || statusConfig.requested;
                            const StatusIcon = sCfg.icon;
                            const next = nextStatus[request.status];
                            const nextLabel = nextStatusLabel[request.status];

                            return (
                                <div key={request.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 p-2 rounded-lg border ${sCfg.bgColor}`}>
                                            <StatusIcon size={18} className={sCfg.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                    #{request.id.slice(0, 8).toUpperCase()}
                                                </span>
                                                <p className="font-medium text-gray-900">
                                                    {request.shop?.name || 'Loja'}
                                                </p>
                                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${sCfg.bgColor} ${sCfg.textColor}`}>
                                                    {sCfg.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                                                <span>📦 {request.total_items} itens</span>
                                                <span>📅 {new Date(request.created_at).toLocaleDateString('pt-BR')}</span>
                                                {request.dc?.name && <span>🏭 {request.dc.name}</span>}
                                                {request.requester?.name && <span>👤 {request.requester.name}</span>}
                                                {request.expected_delivery && (
                                                    <span>🚚 Previsão: {new Date(request.expected_delivery).toLocaleDateString('pt-BR')}</span>
                                                )}
                                            </div>
                                            {request.notes && (
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">&quot;{request.notes}&quot;</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {next && (
                                                <button
                                                    onClick={() => updateStatus(request.id, next)}
                                                    className="text-xs px-3 py-1.5 bg-lale-orange text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                                                >
                                                    <ArrowRight size={12} />
                                                    <span className="hidden sm:inline">{nextLabel}</span>
                                                </button>
                                            )}
                                            {request.status === 'requested' && (
                                                <button
                                                    onClick={() => updateStatus(request.id, 'cancelled')}
                                                    className="text-xs px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Cancelar"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => fetchRequestDetail(request.id)}
                                                className="text-gray-400 hover:text-gray-600 p-1"
                                                title="Ver detalhes"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* ═══════════════════════════════════════════════════════════════════
                CREATE REQUEST MODAL
            ═══════════════════════════════════════════════════════════════════ */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Package className="text-lale-orange" size={24} />
                                Novo Pedido de Reabastecimento
                            </h3>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="p-6 space-y-5">
                            {/* Shop & DC Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Loja <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={selectedShop}
                                        onChange={e => setSelectedShop(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                    >
                                        <option value="">Selecione a loja...</option>
                                        {shops.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Centro de Distribuição
                                    </label>
                                    <select
                                        value={selectedDC}
                                        onChange={e => setSelectedDC(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                    >
                                        <option value="">CD Principal</option>
                                        {dcs.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Expected Delivery */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Data Prevista de Entrega
                                </label>
                                <input
                                    type="date"
                                    value={expectedDelivery}
                                    onChange={e => setExpectedDelivery(e.target.value)}
                                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                />
                            </div>

                            {/* Items */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Itens do Pedido <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                        onClick={addItem}
                                        className="flex items-center gap-1 text-sm text-lale-orange hover:text-lale-pink font-medium"
                                    >
                                        <Plus size={16} /> Adicionar Item
                                    </button>
                                </div>

                                {formItems.length === 0 ? (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-200">
                                        <Package size={32} className="text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-400 text-sm">Nenhum item adicionado</p>
                                        <button
                                            onClick={addItem}
                                            className="mt-3 text-sm text-lale-orange hover:text-lale-pink font-medium"
                                        >
                                            + Adicionar primeiro item
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {formItems.map((item, index) => {
                                            const selectedProduct = products.find(p => p.id === item.product_id);
                                            const sizes = selectedProduct?.sizes || ['PP', 'P', 'M', 'G', 'GG', 'XG'];

                                            return (
                                                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="flex-1 min-w-0">
                                                        <select
                                                            value={item.product_id}
                                                            onChange={e => updateItem(index, 'product_id', e.target.value)}
                                                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                                        >
                                                            <option value="">Selecione o produto...</option>
                                                            {products.map(p => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.name} {p.sku ? `(${p.sku})` : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <select
                                                        value={item.size}
                                                        onChange={e => updateItem(index, 'size', e.target.value)}
                                                        className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-md"
                                                    >
                                                        {(Array.isArray(sizes) ? sizes : ['PP', 'P', 'M', 'G', 'GG', 'XG']).map((s: string) => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity_requested}
                                                        onChange={e => updateItem(index, 'quantity_requested', parseInt(e.target.value) || 0)}
                                                        className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-md text-center"
                                                        placeholder="Qtd"
                                                    />
                                                    <button
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Observações
                                </label>
                                <textarea
                                    value={formNotes}
                                    onChange={e => setFormNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Notas adicionais sobre o pedido..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                />
                            </div>

                            {/* Summary */}
                            {formItems.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Resumo do Pedido</h4>
                                    <p className="text-sm text-amber-700">
                                        {formItems.filter(i => i.product_id).length} produto(s) • {' '}
                                        {formItems.reduce((sum, i) => sum + (i.quantity_requested || 0), 0)} unidades no total
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={createRequest}
                                disabled={submitting || !selectedShop || formItems.length === 0}
                                className="px-6 py-2 bg-gradient-to-r from-lale-orange to-lale-pink text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Send size={16} />
                                {submitting ? 'Enviando...' : 'Enviar Pedido'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                DETAIL MODAL
            ═══════════════════════════════════════════════════════════════════ */}
            {showDetail && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Eye className="text-lale-orange" size={22} />
                                    Detalhes do Pedido
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5 font-mono">#{showDetail.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                            <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Status & Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 mb-1">Status</p>
                                    <div className="flex items-center gap-2">
                                        {(() => {
                                            const cfg = statusConfig[showDetail.status] || statusConfig.requested;
                                            const Icon = cfg.icon;
                                            return (
                                                <>
                                                    <Icon size={18} className={cfg.color} />
                                                    <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 mb-1">Total de Itens</p>
                                    <p className="text-lg font-bold text-gray-900">{showDetail.total_items}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 mb-1">Loja</p>
                                    <p className="font-medium text-gray-900">{showDetail.shop?.name || '—'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 mb-1">Centro de Distribuição</p>
                                    <p className="font-medium text-gray-900">{showDetail.dc?.name || '—'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 mb-1">Solicitado por</p>
                                    <p className="font-medium text-gray-900">{showDetail.requester?.name || '—'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 mb-1">Data do Pedido</p>
                                    <p className="font-medium text-gray-900">{new Date(showDetail.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>

                            {showDetail.notes && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-xs text-amber-600 font-medium mb-1">Observações</p>
                                    <p className="text-sm text-amber-800">{showDetail.notes}</p>
                                </div>
                            )}

                            {/* Items */}
                            {showDetail.items && showDetail.items.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Itens do Pedido</h4>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Produto</th>
                                                    <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">Tam.</th>
                                                    <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">Solicitado</th>
                                                    <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">Enviado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {showDetail.items.map(item => (
                                                    <tr key={item.id}>
                                                        <td className="px-4 py-2.5">
                                                            <div className="flex items-center gap-2">
                                                                {item.product?.image_url && (
                                                                    <img src={item.product.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                                                                )}
                                                                <span className="font-medium text-gray-900">{item.product?.name || 'Produto'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-center px-3 py-2.5">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-xs font-medium">{item.size}</span>
                                                        </td>
                                                        <td className="text-center px-3 py-2.5 font-medium">{item.quantity_requested}</td>
                                                        <td className="text-center px-3 py-2.5 font-medium text-green-600">{item.quantity_fulfilled || '—'}</td>
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
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Histórico de Status</h4>
                                    <div className="space-y-3">
                                        {showDetail.status_log
                                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                            .map((log, i) => {
                                                const cfg = statusConfig[log.to_status] || statusConfig.requested;
                                                const LogIcon = cfg.icon;
                                                return (
                                                    <div key={log.id || i} className="flex items-start gap-3">
                                                        <div className={`p-1.5 rounded-lg border ${cfg.bgColor} mt-0.5`}>
                                                            <LogIcon size={14} className={cfg.color} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {log.from_status ? `${statusConfig[log.from_status]?.label || log.from_status} → ` : ''}
                                                                {cfg.label}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                                                <span>{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                                                                {log.changed_by_user?.name && <span>• {log.changed_by_user.name}</span>}
                                                            </div>
                                                            {log.notes && <p className="text-xs text-gray-500 mt-1 italic">{log.notes}</p>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {nextStatus[showDetail.status] && (
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => updateStatus(showDetail.id, nextStatus[showDetail.status])}
                                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-lale-orange to-lale-pink text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        <ArrowRight size={16} />
                                        {nextStatusLabel[showDetail.status]}
                                    </button>
                                    {showDetail.status === 'requested' && (
                                        <button
                                            onClick={() => updateStatus(showDetail.id, 'cancelled')}
                                            className="px-4 py-2.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
                                        >
                                            Cancelar Pedido
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
