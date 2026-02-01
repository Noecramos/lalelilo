'use client';

import React, { useEffect, useState } from 'react';
import { Card, Badge, Loading } from '@/components/ui';
import {
    Store,
    TrendingUp,
    DollarSign,
    ShoppingBag,
    MapPin,
    AlertTriangle,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import Link from 'next/link';

interface OverviewStats {
    totalRevenue: number;
    totalOrders: number;
    activeShops: number;
    avgTicket: number;
    revenueGrowth: number;
    ordersGrowth: number;
}

interface ShopPerformance {
    id: string;
    name: string;
    city: string;
    revenue: number;
    orders: number;
    growth: number;
}

export default function SuperAdminOverview() {
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [topShops, setTopShops] = useState<ShopPerformance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await fetch('/api/analytics/dashboard');
                const data = await response.json();

                if (data.success) {
                    setStats(data.metrics);
                    setTopShops(data.topShops || []);
                }
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <Loading size="lg" text="Carregando visão geral..." fullScreen />;
    }

    const statCards = [
        {
            title: 'Receita Total',
            value: `R$ ${stats?.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            growth: stats?.revenueGrowth || 0,
            subtitle: 'Últimos 30 dias'
        },
        {
            title: 'Total de Pedidos',
            value: stats?.totalOrders.toString() || '0',
            icon: ShoppingBag,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            growth: stats?.ordersGrowth || 0,
            subtitle: 'Últimos 30 dias'
        },
        {
            title: 'Lojas Ativas',
            value: stats?.activeShops.toString() || '0',
            icon: Store,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            subtitle: 'De 30 lojas totais'
        },
        {
            title: 'Ticket Médio',
            value: `R$ ${stats?.avgTicket.toFixed(2)}`,
            icon: TrendingUp,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
            subtitle: 'Por pedido'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
                <p className="text-gray-600 mt-1">
                    Acompanhe o desempenho de todas as lojas Lalelilo
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    const hasGrowth = stat.growth !== undefined;
                    const isPositive = (stat.growth || 0) > 0;

                    return (
                        <Card key={stat.title} padding="md" hover>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {stat.value}
                                    </p>
                                    {hasGrowth && (
                                        <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                            {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                            <span className="font-medium">{Math.abs(stat.growth!)}%</span>
                                            <span className="text-gray-500 text-xs">vs mês anterior</span>
                                        </div>
                                    )}
                                    {stat.subtitle && !hasGrowth && (
                                        <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                                    )}
                                </div>
                                <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                                    <Icon size={24} />
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Top performing shops */}
            <Card title="Top 5 Lojas por Receita" subtitle="Últimos 30 dias" padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Posição
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Loja
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Cidade
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Receita
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    Pedidos
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    Crescimento
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {topShops.map((shop, index) => (
                                <tr key={shop.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">
                                        <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-gray-50 text-gray-600'}
                    `}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <p className="font-medium text-gray-900">{shop.name}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} />
                                            {shop.city}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                        R$ {shop.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-900">
                                        {shop.orders}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center">
                                        <Badge variant={shop.growth > 10 ? 'success' : shop.growth > 5 ? 'info' : 'warning'}>
                                            +{shop.growth}%
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center">
                                        <Link
                                            href={`/shop-admin/${shop.id}`}
                                            className="text-[#ffa944] hover:text-[#ff9a30] font-medium"
                                        >
                                            Ver Loja
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Quick insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="Alertas" padding="md">
                    <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm">
                            <AlertTriangle size={16} className="text-yellow-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">3 lojas com estoque baixo</p>
                                <p className="text-gray-600 text-xs">Requer atenção</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                            <AlertTriangle size={16} className="text-red-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">2 lojas com queda nas vendas</p>
                                <p className="text-gray-600 text-xs">-15% vs mês anterior</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Destaques do Mês" padding="md">
                    <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm">
                            <TrendingUp size={16} className="text-green-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">Lalelilo Centro</p>
                                <p className="text-gray-600 text-xs">Maior crescimento: +15.2%</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                            <ShoppingBag size={16} className="text-blue-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">Vestido Rosa</p>
                                <p className="text-gray-600 text-xs">Produto mais vendido</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Ações Rápidas" padding="md">
                    <div className="space-y-2">
                        <Link
                            href="/super-admin/shops"
                            className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                        >
                            Ver todas as lojas
                        </Link>
                        <Link
                            href="/super-admin/analytics"
                            className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                        >
                            Analytics detalhado
                        </Link>
                        <Link
                            href="/super-admin/reports"
                            className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                        >
                            Gerar relatório
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
