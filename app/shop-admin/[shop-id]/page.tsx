'use client';

import React, { useEffect, useState, use } from 'react';
import { Card, Badge, Loading, getOrderStatusBadge } from '@/components/ui';
import {
    TrendingUp,
    ShoppingBag,
    DollarSign,
    Package,
    AlertTriangle
} from 'lucide-react';

interface DashboardStats {
    todayRevenue: number;
    todayOrders: number;
    pendingOrders: number;
    lowStockItems: number;
}

export default function ShopAdminDashboard({
    params
}: {
    params: Promise<{ 'shop-id': string }>;
}) {
    const { 'shop-id': shopId } = use(params);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch real data from API
        // For now, using mock data
        setTimeout(() => {
            setStats({
                todayRevenue: 1250.50,
                todayOrders: 15,
                pendingOrders: 3,
                lowStockItems: 5
            });

            setRecentOrders([
                {
                    id: '1',
                    order_number: 'LAL-001',
                    customer_name: 'João Silva',
                    total_amount: 89.90,
                    status: 'pending',
                    created_at: new Date().toISOString()
                },
                {
                    id: '2',
                    order_number: 'LAL-002',
                    customer_name: 'Maria Santos',
                    total_amount: 125.00,
                    status: 'confirmed',
                    created_at: new Date().toISOString()
                }
            ]);

            setLoading(false);
        }, 1000);
    }, [shopId]);

    if (loading) {
        return <Loading size="lg" text="Carregando dashboard..." fullScreen />;
    }

    const statCards = [
        {
            title: 'Vendas Hoje',
            value: `R$ ${stats?.todayRevenue.toFixed(2)}`,
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            title: 'Pedidos Hoje',
            value: stats?.todayOrders.toString() || '0',
            icon: ShoppingBag,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            title: 'Pedidos Pendentes',
            value: stats?.pendingOrders.toString() || '0',
            icon: TrendingUp,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100'
        },
        {
            title: 'Estoque Baixo',
            value: stats?.lowStockItems.toString() || '0',
            icon: AlertTriangle,
            color: 'text-red-600',
            bgColor: 'bg-red-100'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-600 mt-1">
                    Visão geral da sua loja
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title} padding="md" hover>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                                    <Icon size={24} />
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Recent orders */}
            <Card title="Pedidos Recentes" padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Pedido
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Cliente
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Valor
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Data
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {recentOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {order.order_number}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {order.customer_name}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        R$ {order.total_amount.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <Badge variant={getOrderStatusBadge(order.status)}>
                                            {order.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="Ações Rápidas" padding="md">
                    <div className="space-y-2">
                        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                            Ver todos os pedidos
                        </button>
                        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                            Gerenciar estoque
                        </button>
                        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                            Configurações da loja
                        </button>
                    </div>
                </Card>

                <Card title="Produtos em Destaque" padding="md">
                    <p className="text-sm text-gray-600">
                        Seus produtos mais vendidos aparecerão aqui
                    </p>
                </Card>

                <Card title="Alertas" padding="md">
                    {stats && stats.lowStockItems > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                            <AlertTriangle size={16} className="text-red-500 mt-0.5" />
                            <p className="text-gray-600">
                                {stats.lowStockItems} produto(s) com estoque baixo
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
