'use client';

import React, { useEffect, useState } from 'react';
import { Card, Loading } from '@/components/ui';
import {
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Store,
    Users,
    AlertTriangle,
    Package,
    ArrowUpRight,
    MessageSquare,
    Building2
} from 'lucide-react';
import Link from 'next/link';

interface ShopStats {
    id: string;
    name: string;
    slug: string;
    city: string;
    state: string;
    revenue: number;
    orders: number;
}

export default function GestaoLojasDashboard() {
    const [loading, setLoading] = useState(true);
    const [shops, setShops] = useState<any[]>([]);
    const [shopStats, setShopStats] = useState<ShopStats[]>([]);
    const [totals, setTotals] = useState({ revenue: 0, orders: 0, shops: 0 });
    const [managerId, setManagerId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get the first manager
                const mgrRes = await fetch('/api/managers');
                const mgrData = await mgrRes.json();
                const managers = mgrData.managers || [];

                if (managers.length === 0) {
                    setLoading(false);
                    return;
                }

                const mgr = managers[0];
                setManagerId(mgr.id);
                const shopIds: string[] = mgr.managed_shop_ids || [];

                if (shopIds.length === 0) {
                    setLoading(false);
                    return;
                }

                // Get managed shops
                const shopsRes = await fetch(`/api/managers/shops?managerId=${mgr.id}`);
                const shopsData = await shopsRes.json();
                const managedShops = shopsData.shops || [];
                setShops(managedShops);

                // Get analytics for each managed shop
                const stats: ShopStats[] = [];
                let totalRev = 0, totalOrd = 0;

                for (const shop of managedShops) {
                    try {
                        const analyticsRes = await fetch(`/api/analytics/dashboard?shop_slug=${shop.slug}&period=30`);
                        const analyticsData = await analyticsRes.json();
                        const rev = analyticsData.success ? analyticsData.metrics?.totalRevenue || 0 : 0;
                        const ord = analyticsData.success ? analyticsData.metrics?.totalOrders || 0 : 0;
                        stats.push({ id: shop.id, name: shop.name, slug: shop.slug, city: shop.city, state: shop.state, revenue: rev, orders: ord });
                        totalRev += rev;
                        totalOrd += ord;
                    } catch {
                        stats.push({ id: shop.id, name: shop.name, slug: shop.slug, city: shop.city || '', state: shop.state || '', revenue: 0, orders: 0 });
                    }
                }

                setShopStats(stats);
                setTotals({ revenue: totalRev, orders: totalOrd, shops: managedShops.length });
            } catch (err) {
                console.error('Error fetching gestao data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <Loading size="lg" text="Carregando gestão de lojas..." fullScreen />;
    }

    if (shops.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="text-teal-600" size={28} />
                        Gestão de Lojas
                    </h2>
                    <p className="text-gray-600 mt-1">Painel do Gerente Regional</p>
                </div>
                <div className="text-center py-20">
                    <Store size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma loja atribuída</h3>
                    <p className="text-gray-500 mb-6">Vá em &quot;Minhas Lojas&quot; para adicionar lojas ao painel.</p>
                    <Link
                        href="/super-admin/gestao-lojas/lojas"
                        className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                    >
                        <Store size={18} />
                        Configurar Lojas
                    </Link>
                </div>
            </div>
        );
    }

    const kpiCards = [
        { title: 'Receita Total (30d)', value: `R$ ${totals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Total de Pedidos', value: totals.orders.toString(), icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Lojas Gerenciadas', value: totals.shops.toString(), icon: Store, color: 'text-teal-600', bg: 'bg-teal-100' },
        { title: 'Ticket Médio', value: totals.orders > 0 ? `R$ ${(totals.revenue / totals.orders).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="text-teal-600" size={28} />
                    Gestão de Lojas
                </h2>
                <p className="text-gray-600 mt-1">Visão geral das {shops.length} lojas gerenciadas</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map(kpi => {
                    const Icon = kpi.icon;
                    return (
                        <Card key={kpi.title} padding="md" hover>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{kpi.title}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                                </div>
                                <div className={`${kpi.bg} ${kpi.color} p-3 rounded-lg`}>
                                    <Icon size={24} />
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Shops Performance Table */}
            <Card title="Desempenho por Loja" subtitle="Últimos 30 dias" padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loja</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Receita</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ticket Médio</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {shopStats.map((stat, idx) => (
                                <tr key={stat.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-white font-bold text-xs ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-teal-500'}`}>
                                            {idx + 1}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{stat.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{stat.city}, {stat.state}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                        R$ {stat.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{stat.orders}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                        {stat.orders > 0 ? `R$ ${(stat.revenue / stat.orders).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Link
                                            href={`/shop-admin/${stat.slug}`}
                                            className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-800 text-sm font-medium"
                                        >
                                            Ver <ArrowUpRight size={14} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="Ações Rápidas" padding="md">
                    <div className="space-y-2">
                        <Link href="/super-admin/gestao-lojas/lojas" className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm text-gray-700">
                            <Store size={16} className="text-teal-500" /> Gerenciar lojas
                        </Link>
                        <Link href="/super-admin/gestao-lojas/chat" className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm text-gray-700">
                            <MessageSquare size={16} className="text-blue-500" /> Chat com lojas
                        </Link>
                        <Link href="/super-admin/gestao-lojas/colaboradores" className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm text-gray-700">
                            <Users size={16} className="text-purple-500" /> Ver colaboradores
                        </Link>
                    </div>
                </Card>

                <Card title="Alertas" padding="md">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                        <Package size={16} />
                        <span>Nenhum alerta no momento</span>
                    </div>
                </Card>

                <Card title="Resumo" padding="md">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Lojas ativas</span>
                            <span className="font-semibold text-gray-900">{shops.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Receita média/loja</span>
                            <span className="font-semibold text-gray-900">
                                R$ {shops.length > 0 ? (totals.revenue / shops.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
