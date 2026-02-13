'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui';
import {
    Package, Warehouse, Store, TrendingUp, AlertTriangle,
    Search, RefreshCw, Printer, ArrowUpDown, ChevronDown, ChevronUp,
    Eye, X, ArrowRight, Clock, CheckCircle2, Truck, XCircle,
    BarChart3, BoxIcon, ShoppingBag, History
} from 'lucide-react';

const CLIENT_ID = 'acb4b354-728f-479d-915a-c857d27da9ad';

// ─── Types ──────────────────────────────────────────────────────────────────
interface DCStats {
    totalSKUs: number;
    totalUnits: number;
    lowStockCount: number;
    activeRequests: number;
    totalRequests: number;
    uniqueShopsRequesting: number;
    totalItemsRequested: number;
    recentTransfers: number;
    statusBreakdown: Record<string, number>;
}

interface ShopRequest {
    id: string;
    name: string;
    slug: string;
    totalRequests: number;
    pendingRequests: number;
    pendingItems: number;
}

interface InventoryItem {
    id: string;
    dc_id: string;
    product_id: string;
    size: string;
    quantity: number;
    low_stock_threshold: number;
    products: {
        id: string;
        name: string;
        slug: string;
        image_url?: string;
        sku?: string;
        price: number;
        cost_price?: number;
    };
}

interface ReplenishmentRequest {
    id: string;
    shop_id: string;
    status: string;
    notes?: string;
    total_items: number;
    created_at: string;
    expected_delivery?: string;
    shop?: { id: string; name: string };
    dc?: { id: string; name: string };
    items?: { id: string; product_id: string; size: string; quantity_requested: number; quantity_fulfilled: number; product?: { name: string; image_url?: string } }[];
    status_log?: { id: string; from_status: string; to_status: string; notes?: string; created_at: string }[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    requested: { label: 'Solicitado', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock },
    processing: { label: 'Em Separação', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Package },
    in_transit: { label: 'Em Trânsito', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: Truck },
    received: { label: 'Recebido', color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: CheckCircle2 },
    cancelled: { label: 'Cancelado', color: 'text-red-500', bg: 'bg-red-50 border-red-200', icon: XCircle },
};

const nextStatus: Record<string, string> = { requested: 'processing', processing: 'in_transit', in_transit: 'received' };
const nextStatusLabel: Record<string, string> = { requested: 'Iniciar Separação', processing: 'Marcar Enviado', in_transit: 'Confirmar Recebido' };

// ─── Component ──────────────────────────────────────────────────────────────
export default function CDManagementPage() {
    const [tab, setTab] = useState<'overview' | 'inventory' | 'requests' | 'history'>('overview');
    const [stats, setStats] = useState<DCStats | null>(null);
    const [dcInfo, setDcInfo] = useState<any>(null);
    const [shopsWithRequests, setShopsWithRequests] = useState<ShopRequest[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [requests, setRequests] = useState<ReplenishmentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<'name' | 'quantity' | 'size'>('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [filterStatus, setFilterStatus] = useState<string>('active');
    const [showDetail, setShowDetail] = useState<ReplenishmentRequest | null>(null);
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        await Promise.all([loadStats(), loadInventory(), loadRequests()]);
        setLoading(false);
    };

    const loadStats = async () => {
        try {
            const res = await fetch(`/api/dc/stats?client_id=${CLIENT_ID}`);
            const data = await res.json();
            setStats(data.stats);
            setDcInfo(data.dc);
            setShopsWithRequests(data.shopsWithRequests || []);
        } catch (e) { console.error('Stats error:', e); }
    };

    const loadInventory = async () => {
        try {
            const res = await fetch(`/api/dc/inventory?client_id=${CLIENT_ID}`);
            const data = await res.json();
            setInventory(data.inventory || []);
        } catch (e) { console.error('Inventory error:', e); }
    };

    const loadRequests = async () => {
        try {
            const res = await fetch('/api/replenishment');
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch (e) { console.error('Requests error:', e); }
    };

    const fetchDetail = async (id: string) => {
        try {
            const res = await fetch(`/api/replenishment/${id}`);
            const data = await res.json();
            setShowDetail(data);
        } catch (e) { console.error(e); }
    };

    const updateStatus = async (requestId: string, newStatus: string) => {
        if (!confirm(`Confirmar mudança de status para "${statusConfig[newStatus]?.label}"?`)) return;
        try {
            const res = await fetch(`/api/replenishment/${requestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, changedBy: null, notes: `Status → ${statusConfig[newStatus]?.label}` }),
            });
            if (!res.ok) { const e = await res.json(); alert(`❌ ${e.error}`); return; }
            loadAll();
            if (showDetail?.id === requestId) fetchDetail(requestId);
        } catch (e) { alert('❌ Erro'); }
    };

    // ─── Print Order ────────────────────────────────────────────────────────
    const printOrder = (request: ReplenishmentRequest) => {
        const w = window.open('', '_blank', 'width=800,height=600');
        if (!w) return;
        const items = request.items || [];
        w.document.write(`
            <html><head><title>Pedido #${request.id.slice(0, 8).toUpperCase()}</title>
            <style>
                * { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
                body { padding: 40px; color: #333; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #ffa944; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 28px; font-weight: bold; color: #ffa944; }
                .subtitle { color: #888; font-size: 14px; }
                .order-id { font-family: monospace; font-size: 18px; background: #f5f5f5; padding: 8px 16px; border-radius: 8px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px; }
                .info-box { background: #fafafa; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #ffa944; }
                .info-label { font-size: 11px; text-transform: uppercase; color: #999; letter-spacing: 0.5px; }
                .info-value { font-size: 15px; font-weight: 600; margin-top: 4px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background: #ffa944; color: white; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
                td { padding: 10px 12px; border-bottom: 1px solid #eee; }
                tr:nth-child(even) { background: #fafafa; }
                .total { text-align: right; font-size: 18px; font-weight: bold; padding: 16px 0; border-top: 2px solid #333; margin-top: 10px; }
                .footer { margin-top: 40px; text-align: center; color: #bbb; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
                .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .pick-check { width: 20px; height: 20px; border: 2px solid #ccc; border-radius: 4px; display: inline-block; }
                @media print { body { padding: 20px; } }
            </style></head><body>
            <div class="header">
                <div><div class="logo">🏭 Lalelilo CD</div><div class="subtitle">Lista de Separação / Picking List</div></div>
                <div class="order-id">#${request.id.slice(0, 8).toUpperCase()}</div>
            </div>
            <div class="info-grid">
                <div class="info-box"><div class="info-label">Loja Destino</div><div class="info-value">${request.shop?.name || '—'}</div></div>
                <div class="info-box"><div class="info-label">Data do Pedido</div><div class="info-value">${new Date(request.created_at).toLocaleDateString('pt-BR')}</div></div>
                <div class="info-box"><div class="info-label">Previsão Entrega</div><div class="info-value">${request.expected_delivery ? new Date(request.expected_delivery).toLocaleDateString('pt-BR') : '—'}</div></div>
                <div class="info-box"><div class="info-label">Total de Itens</div><div class="info-value">${request.total_items} unidades</div></div>
            </div>
            ${request.notes ? `<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:12px;margin-bottom:20px"><strong>📝 Observações:</strong> ${request.notes}</div>` : ''}
            <table>
                <thead><tr><th style="width:40px">✓</th><th>Produto</th><th style="width:80px;text-align:center">Tam.</th><th style="width:100px;text-align:center">Qtd. Solicitada</th><th style="width:100px;text-align:center">Qtd. Separada</th></tr></thead>
                <tbody>${items.map(item => `
                    <tr>
                        <td><div class="pick-check"></div></td>
                        <td><strong>${item.product?.name || 'Produto'}</strong></td>
                        <td style="text-align:center"><span style="background:#f0f0f0;padding:2px 10px;border-radius:4px;font-weight:600">${item.size}</span></td>
                        <td style="text-align:center;font-weight:600">${item.quantity_requested}</td>
                        <td style="text-align:center">____</td>
                    </tr>
                `).join('')}</tbody>
            </table>
            <div class="total">Total: ${items.reduce((s, i) => s + i.quantity_requested, 0)} unidades</div>
            <div style="margin-top:30px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
                <div style="border-top:1px solid #ccc;padding-top:8px;text-align:center;font-size:13px;color:#888">Separado por: _______________<br>Data: ___/___/______</div>
                <div style="border-top:1px solid #ccc;padding-top:8px;text-align:center;font-size:13px;color:#888">Conferido por: _______________<br>Data: ___/___/______</div>
            </div>
            <div class="footer">Lalelilo Moda Infantil • Centro de Distribuição • Impresso em ${new Date().toLocaleString('pt-BR')}</div>
            </body></html>
        `);
        w.document.close();
        setTimeout(() => w.print(), 500);
    };

    // ─── Sorting/Filtering ────────────────────────────────────────────────
    const filteredInventory = inventory
        .filter(item => {
            if (showLowStockOnly && item.quantity > item.low_stock_threshold) return false;
            if (!searchTerm) return true;
            const s = searchTerm.toLowerCase();
            return item.products?.name?.toLowerCase().includes(s) || item.size.toLowerCase().includes(s) || item.products?.sku?.toLowerCase().includes(s);
        })
        .sort((a, b) => {
            let cmp = 0;
            if (sortField === 'name') cmp = (a.products?.name || '').localeCompare(b.products?.name || '');
            else if (sortField === 'quantity') cmp = a.quantity - b.quantity;
            else if (sortField === 'size') cmp = a.size.localeCompare(b.size);
            return sortDir === 'asc' ? cmp : -cmp;
        });

    const filteredRequests = requests.filter(r => {
        if (filterStatus === 'active') return !['received', 'cancelled'].includes(r.status);
        if (filterStatus !== 'all') return r.status === filterStatus;
        return true;
    });

    const toggleSort = (field: typeof sortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    // ─── Render ─────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-lale-orange mx-auto" />
                    <p className="text-sm text-gray-500 mt-3">Carregando dados do CD...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Warehouse className="text-lale-orange" size={28} />
                        Centro de Distribuição
                    </h2>
                    <p className="text-gray-500 mt-1">{dcInfo?.name || 'CD Lalelilo'} — {dcInfo?.city || ''} {dcInfo?.state || ''}</p>
                </div>
                <button onClick={loadAll} className="flex items-center gap-2 px-4 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <RefreshCw size={16} /> Atualizar
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total SKUs', value: stats?.totalSKUs || 0, icon: BoxIcon, color: 'from-blue-500 to-blue-600', detail: 'produtos/tamanhos cadastrados' },
                    { label: 'Unidades em Estoque', value: stats?.totalUnits || 0, icon: Package, color: 'from-green-500 to-emerald-600', detail: 'unidades totais' },
                    { label: 'Pedidos Ativos', value: stats?.activeRequests || 0, icon: ShoppingBag, color: 'from-amber-500 to-orange-600', detail: `${stats?.uniqueShopsRequesting || 0} lojas` },
                    { label: 'Estoque Baixo', value: stats?.lowStockCount || 0, icon: AlertTriangle, color: stats?.lowStockCount ? 'from-red-500 to-red-600' : 'from-gray-400 to-gray-500', detail: 'abaixo do mínimo' },
                ].map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${kpi.color} shadow-sm`}>
                                    <Icon size={20} className="text-white" />
                                </div>
                                {i === 3 && stats?.lowStockCount ? (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium animate-pulse">⚠️ Atenção</span>
                                ) : null}
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{kpi.value.toLocaleString('pt-BR')}</p>
                            <p className="text-xs text-gray-400 mt-1">{kpi.detail}</p>
                            <p className="text-sm font-medium text-gray-600 mt-0.5">{kpi.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Mini stats row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <History size={16} />
                        <span className="text-xs font-medium">Últimos 30 dias</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-700">{stats?.recentTransfers || 0}</p>
                    <p className="text-xs text-purple-500">transferências completas</p>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-orange-100 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <TrendingUp size={16} />
                        <span className="text-xs font-medium">Itens Solicitados</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-700">{stats?.totalItemsRequested || 0}</p>
                    <p className="text-xs text-amber-500">unidades em aberto</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                        <BarChart3 size={16} />
                        <span className="text-xs font-medium">Total Pedidos</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{stats?.totalRequests || 0}</p>
                    <p className="text-xs text-green-500">histórico completo</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {([
                    { key: 'overview', label: 'Visão Geral', icon: BarChart3 },
                    { key: 'inventory', label: 'Estoque CD', icon: Package },
                    { key: 'requests', label: 'Pedidos', icon: ShoppingBag },
                    { key: 'history', label: 'Histórico', icon: History },
                ] as const).map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Icon size={16} /> <span className="hidden sm:inline">{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                TAB: OVERVIEW
            ═══════════════════════════════════════════════════════════════════ */}
            {tab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Shops with requests */}
                    <Card padding="none">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Store size={18} className="text-lale-orange" />
                                Lojas com Pedidos
                            </h3>
                        </div>
                        {shopsWithRequests.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Store size={40} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Nenhuma loja com pedidos</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {shopsWithRequests.map(shop => (
                                    <div key={shop.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="font-medium text-gray-900">{shop.name}</p>
                                            <p className="text-xs text-gray-400">{shop.totalRequests} total • {shop.pendingItems} itens pendentes</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {shop.pendingRequests > 0 && (
                                                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                                                    {shop.pendingRequests} pendente{shop.pendingRequests > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Status breakdown */}
                    <Card padding="none">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <BarChart3 size={18} className="text-lale-orange" />
                                Distribuição por Status
                            </h3>
                        </div>
                        <div className="p-5 space-y-3">
                            {Object.entries(statusConfig).map(([key, cfg]) => {
                                const count = stats?.statusBreakdown?.[key] || 0;
                                const total = stats?.totalRequests || 1;
                                const pct = Math.round((count / total) * 100);
                                const Icon = cfg.icon;
                                return (
                                    <div key={key}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <Icon size={14} className={cfg.color} />
                                                <span className="text-sm font-medium text-gray-700">{cfg.label}</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">{count}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${key === 'requested' ? 'bg-amber-400' : key === 'processing' ? 'bg-blue-400' : key === 'in_transit' ? 'bg-purple-400' : key === 'received' ? 'bg-green-400' : 'bg-red-300'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Low stock alerts */}
                    <Card padding="none" className="lg:col-span-2">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <AlertTriangle size={18} className="text-red-500" />
                                Alertas de Estoque Baixo
                            </h3>
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{stats?.lowStockCount || 0} itens</span>
                        </div>
                        {inventory.filter(i => i.quantity <= i.low_stock_threshold).length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <CheckCircle2 size={40} className="mx-auto mb-2 opacity-30 text-green-300" />
                                <p className="text-sm">Todos os itens acima do nível mínimo! 🎉</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="bg-red-50 text-red-700">
                                        <th className="px-4 py-2.5 text-left text-xs font-medium uppercase">Produto</th>
                                        <th className="px-3 py-2.5 text-center text-xs font-medium uppercase">Tam</th>
                                        <th className="px-3 py-2.5 text-center text-xs font-medium uppercase">Atual</th>
                                        <th className="px-3 py-2.5 text-center text-xs font-medium uppercase">Mínimo</th>
                                        <th className="px-3 py-2.5 text-center text-xs font-medium uppercase">Déficit</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {inventory.filter(i => i.quantity <= i.low_stock_threshold).map(item => (
                                            <tr key={item.id} className="hover:bg-red-50/50">
                                                <td className="px-4 py-2.5 font-medium text-gray-900">{item.products?.name}</td>
                                                <td className="px-3 py-2.5 text-center"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">{item.size}</span></td>
                                                <td className="px-3 py-2.5 text-center font-bold text-red-600">{item.quantity}</td>
                                                <td className="px-3 py-2.5 text-center text-gray-500">{item.low_stock_threshold}</td>
                                                <td className="px-3 py-2.5 text-center font-bold text-red-700">-{item.low_stock_threshold - item.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                TAB: INVENTORY
            ═══════════════════════════════════════════════════════════════════ */}
            {tab === 'inventory' && (
                <Card padding="none">
                    <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Estoque do Centro de Distribuição</h3>
                        <div className="flex gap-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={showLowStockOnly} onChange={e => setShowLowStockOnly(e.target.checked)} className="rounded border-gray-300 text-lale-orange focus:ring-lale-orange" />
                                <span className="text-gray-600">Só estoque baixo</span>
                            </label>
                        </div>
                    </div>
                    <div className="px-5 py-3 border-b border-gray-50">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar produto, SKU, tamanho..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-lale-orange/30 focus:border-lale-orange" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => toggleSort('name')}>
                                        <div className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase">Produto <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => toggleSort('size')}>
                                        <div className="flex items-center justify-center gap-1">Tam <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => toggleSort('quantity')}>
                                        <div className="flex items-center justify-center gap-1">Qtd <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mínimo</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredInventory.map(item => {
                                    const isLow = item.quantity <= item.low_stock_threshold;
                                    return (
                                        <tr key={item.id} className={`hover:bg-gray-50 ${isLow ? 'bg-red-50/30' : ''}`}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                                                        {item.products?.image_url ? (
                                                            <img src={item.products.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                                                        ) : (
                                                            <Package size={16} className="text-lale-orange" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{item.products?.name || '—'}</p>
                                                        {item.products?.sku && <p className="text-xs text-gray-400">{item.products.sku}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-center"><span className="bg-gray-100 px-2.5 py-0.5 rounded text-xs font-semibold">{item.size}</span></td>
                                            <td className={`px-3 py-3 text-center font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>{item.quantity}</td>
                                            <td className="px-3 py-3 text-center text-gray-500">{item.low_stock_threshold}</td>
                                            <td className="px-3 py-3 text-center">
                                                {isLow ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                                        <AlertTriangle size={10} /> Baixo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                                        <CheckCircle2 size={10} /> OK
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredInventory.length === 0 && (
                            <div className="p-12 text-center text-gray-400">
                                <Package size={40} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Nenhum item encontrado</p>
                            </div>
                        )}
                    </div>
                    <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
                        Mostrando {filteredInventory.length} de {inventory.length} itens
                    </div>
                </Card>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                TAB: REQUESTS
            ═══════════════════════════════════════════════════════════════════ */}
            {tab === 'requests' && (
                <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { key: 'active', label: 'Ativos' },
                            { key: 'requested', label: 'Solicitados' },
                            { key: 'processing', label: 'Em Separação' },
                            { key: 'in_transit', label: 'Em Trânsito' },
                            { key: 'all', label: 'Todos' },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilterStatus(f.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === f.key ? 'bg-lale-orange text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {filteredRequests.length === 0 ? (
                        <Card padding="lg">
                            <div className="text-center py-8">
                                <Package size={48} className="mx-auto text-gray-200 mb-3" />
                                <p className="text-gray-500">Nenhum pedido neste filtro</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredRequests.map(req => {
                                const sc = statusConfig[req.status] || statusConfig.requested;
                                const Icon = sc.icon;
                                const next = nextStatus[req.status];
                                return (
                                    <Card key={req.id} padding="md" hover className="cursor-pointer" onClick={() => fetchDetail(req.id)}>
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg border ${sc.bg}`}><Icon size={18} className={sc.color} /></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">#{req.id.slice(0, 8).toUpperCase()}</span>
                                                    <p className="font-medium text-gray-900">{req.shop?.name || 'Loja'}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${sc.bg} ${sc.color}`}>{sc.label}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">📦 {req.total_items} itens • 📅 {new Date(req.created_at).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); printOrder(req); }}
                                                    className="p-2 text-gray-400 hover:text-lale-orange hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="Imprimir"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                {next && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); updateStatus(req.id, next); }}
                                                        className="flex items-center gap-1 text-xs px-3 py-1.5 bg-lale-orange text-white rounded-lg hover:opacity-90"
                                                    >
                                                        <ArrowRight size={12} />
                                                        <span className="hidden sm:inline">{nextStatusLabel[req.status]}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                TAB: HISTORY
            ═══════════════════════════════════════════════════════════════════ */}
            {tab === 'history' && (
                <Card padding="none">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <History size={18} className="text-lale-orange" />
                            Histórico de Transferências
                        </h3>
                    </div>
                    {requests.filter(r => r.status === 'received').length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <History size={40} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Nenhuma transferência concluída ainda</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {requests.filter(r => r.status === 'received').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(req => (
                                <div key={req.id} className="px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => fetchDetail(req.id)}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={16} className="text-green-500" />
                                                <span className="font-medium text-gray-900">{req.shop?.name || 'Loja'}</span>
                                                <span className="text-xs font-mono text-gray-400">#{req.id.slice(0, 8)}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">{req.total_items} itens • {new Date(req.created_at).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); printOrder(req); }} className="p-2 text-gray-400 hover:text-lale-orange rounded-lg"><Printer size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                DETAIL MODAL
            ═══════════════════════════════════════════════════════════════════ */}
            {showDetail && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Pedido #{showDetail.id.slice(0, 8).toUpperCase()}</h3>
                                <p className="text-sm text-gray-500">{showDetail.shop?.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => printOrder(showDetail)} className="p-2 text-gray-500 hover:text-lale-orange hover:bg-orange-50 rounded-lg transition-colors" title="Imprimir">
                                    <Printer size={18} />
                                </button>
                                <button onClick={() => setShowDetail(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X size={20} /></button>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Status & info */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Status', value: statusConfig[showDetail.status]?.label || showDetail.status },
                                    { label: 'Total Itens', value: `${showDetail.total_items} un.` },
                                    { label: 'Data', value: new Date(showDetail.created_at).toLocaleDateString('pt-BR') },
                                    { label: 'Previsão', value: showDetail.expected_delivery ? new Date(showDetail.expected_delivery).toLocaleDateString('pt-BR') : '—' },
                                ].map((info, i) => (
                                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-0.5">{info.label}</p>
                                        <p className="font-semibold text-gray-900">{info.value}</p>
                                    </div>
                                ))}
                            </div>
                            {/* Items (picking list) */}
                            {showDetail.items && showDetail.items.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Itens para Separação</h4>
                                    <div className="border rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead><tr className="bg-gray-50"><th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Produto</th><th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500">Tam</th><th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500">Pedido</th><th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500">Separado</th></tr></thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {showDetail.items.map(item => (
                                                    <tr key={item.id}>
                                                        <td className="px-4 py-2.5 font-medium">{item.product?.name || 'Produto'}</td>
                                                        <td className="px-3 py-2.5 text-center"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-semibold">{item.size}</span></td>
                                                        <td className="px-3 py-2.5 text-center font-bold">{item.quantity_requested}</td>
                                                        <td className="px-3 py-2.5 text-center font-bold text-green-600">{item.quantity_fulfilled || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {/* Timeline */}
                            {showDetail.status_log && showDetail.status_log.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Histórico</h4>
                                    <div className="space-y-2">
                                        {showDetail.status_log.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((log, i) => {
                                            const cfg = statusConfig[log.to_status] || statusConfig.requested;
                                            const LogIcon = cfg.icon;
                                            return (
                                                <div key={i} className="flex items-start gap-3">
                                                    <div className={`p-1.5 rounded-lg border ${cfg.bg}`}><LogIcon size={12} className={cfg.color} /></div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{cfg.label}</p>
                                                        <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString('pt-BR')}</p>
                                                        {log.notes && <p className="text-xs text-gray-500 italic mt-0.5">{log.notes}</p>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {/* Actions */}
                            {nextStatus[showDetail.status] && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { updateStatus(showDetail.id, nextStatus[showDetail.status]); }}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-lale-orange to-lale-pink text-white rounded-xl font-medium hover:opacity-90 flex items-center justify-center gap-2"
                                    >
                                        <ArrowRight size={16} /> {nextStatusLabel[showDetail.status]}
                                    </button>
                                    <button onClick={() => printOrder(showDetail)} className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                                        <Printer size={16} /> Imprimir
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
