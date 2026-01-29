'use client';

import React, { useState, useEffect } from 'react';
import { Card, Select, Loading } from '@/components/ui';
import { TrendingUp, DollarSign, ShoppingBag, Package } from 'lucide-react';

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API call
            setTimeout(() => {
                // Mock revenue trend data
                setRevenueData([
                    { date: '01/01', revenue: 3200 },
                    { date: '02/01', revenue: 3800 },
                    { date: '03/01', revenue: 3500 },
                    { date: '04/01', revenue: 4200 },
                    { date: '05/01', revenue: 4800 },
                    { date: '06/01', revenue: 4500 },
                    { date: '07/01', revenue: 5200 }
                ]);

                // Mock category data
                setCategoryData([
                    { category: 'Vestidos', sales: 450, revenue: 33750 },
                    { category: 'Conjuntos', sales: 380, revenue: 28500 },
                    { category: 'Calças', sales: 320, revenue: 20800 },
                    { category: 'Camisetas', sales: 280, revenue: 9800 },
                    { category: 'Acessórios', sales: 150, revenue: 4500 }
                ]);

                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading size="lg" text="Carregando analytics..." fullScreen />;
    }

    const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
    const maxSales = Math.max(...categoryData.map(d => d.sales));

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
                    <p className="text-gray-600 mt-1">
                        Análise detalhada de desempenho
                    </p>
                </div>
                <Select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    options={[
                        { value: '7', label: 'Últimos 7 dias' },
                        { value: '30', label: 'Últimos 30 dias' },
                        { value: '90', label: 'Últimos 90 dias' },
                        { value: '365', label: 'Último ano' }
                    ]}
                />
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card padding="md">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Receita Total</p>
                            <p className="text-xl font-bold text-gray-900">R$ 125,450</p>
                        </div>
                    </div>
                </Card>

                <Card padding="md">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Pedidos</p>
                            <p className="text-xl font-bold text-gray-900">1,247</p>
                        </div>
                    </div>
                </Card>

                <Card padding="md">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Produtos Vendidos</p>
                            <p className="text-xl font-bold text-gray-900">1,580</p>
                        </div>
                    </div>
                </Card>

                <Card padding="md">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Ticket Médio</p>
                            <p className="text-xl font-bold text-gray-900">R$ 100.52</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Revenue trend chart */}
            <Card title="Evolução de Receita" subtitle="Últimos 7 dias" padding="md">
                <div className="space-y-4">
                    {revenueData.map((item, index) => {
                        const percentage = (item.revenue / maxRevenue) * 100;

                        return (
                            <div key={index} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 font-medium">{item.date}</span>
                                    <span className="text-gray-900 font-bold">
                                        R$ {item.revenue.toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-[#ffa944] to-[#ff8f9b] h-full rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Category performance */}
            <Card title="Desempenho por Categoria" subtitle="Top 5 categorias" padding="md">
                <div className="space-y-4">
                    {categoryData.map((item, index) => {
                        const percentage = (item.sales / maxSales) * 100;

                        return (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-gray-50 text-gray-600'}
                    `}>
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-gray-900">{item.category}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">
                                            R$ {item.revenue.toLocaleString('pt-BR')}
                                        </p>
                                        <p className="text-xs text-gray-500">{item.sales} vendas</p>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-[#ffa944] h-full rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Shop comparison */}
            <Card title="Comparação de Lojas" subtitle="Top 5 por receita" padding="none">
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
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Receita
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Pedidos
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Ticket Médio
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Crescimento
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {[
                                { pos: 1, name: 'Lalelilo Centro', revenue: 15200, orders: 145, avg: 104.83, growth: 15.2 },
                                { pos: 2, name: 'Lalelilo Boa Viagem', revenue: 14800, orders: 138, avg: 107.25, growth: 12.8 },
                                { pos: 3, name: 'Lalelilo Shopping', revenue: 13500, orders: 125, avg: 108.00, growth: 10.5 },
                                { pos: 4, name: 'Lalelilo Olinda', revenue: 12300, orders: 118, avg: 104.24, growth: 9.2 },
                                { pos: 5, name: 'Lalelilo Jaboatão', revenue: 11900, orders: 112, avg: 106.25, growth: 8.7 }
                            ].map((shop) => (
                                <tr key={shop.pos} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${shop.pos === 1 ? 'bg-yellow-100 text-yellow-700' :
                                                shop.pos === 2 ? 'bg-gray-100 text-gray-700' :
                                                    shop.pos === 3 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-gray-50 text-gray-600'}
                    `}>
                                            {shop.pos}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {shop.name}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                        R$ {shop.revenue.toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                                        {shop.orders}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                                        R$ {shop.avg.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right">
                                        <span className="text-green-600 font-medium">
                                            +{shop.growth}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
