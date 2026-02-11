'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Loading } from '@/components/ui';
import { Package, MessageSquare, AlertCircle, TrendingUp, LogOut } from 'lucide-react';

interface ShopData {
    id: string;
    name: string;
    slug: string;
    city: string;
    state: string;
    revenue_30d: number;
    orders_30d: number;
}

export default function ShopAdminDashboard() {
    const params = useParams();
    const router = useRouter();
    const shopId = params.shopId as string;

    const [shop, setShop] = useState<ShopData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchShopData();
    }, [shopId]);

    const fetchShopData = async () => {
        try {
            const res = await fetch(`/api/shops/${shopId}`);
            if (!res.ok) throw new Error('Failed to fetch shop');
            const data = await res.json();
            setShop(data);
        } catch (error) {
            console.error('Error fetching shop:', error);
            alert('Erro ao carregar dados da loja');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        if (!confirm('Deseja sair?')) return;

        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loading size="lg" text="Carregando..." />
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loja não encontrada</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{shop.name}</h1>
                            <p className="text-xs text-gray-500">{shop.city}, {shop.state}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <LogOut size={16} />
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    {/* Welcome Message */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                        <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Painel Lalelilo!</h2>
                        <p className="text-purple-100">Gerencie sua loja de forma simples e eficiente</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Receita (30d)</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        R$ {(shop.revenue_30d || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                        </Card>

                        <Card padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Pedidos (30d)</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {shop.orders_30d || 0}
                                    </p>
                                </div>
                                <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                                    <Package size={24} />
                                </div>
                            </div>
                        </Card>

                        <Card padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Mensagens</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                                </div>
                                <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                                    <MessageSquare size={24} />
                                </div>
                            </div>
                        </Card>

                        <Card padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Tickets Abertos</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                                </div>
                                <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
                                    <AlertCircle size={24} />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card padding="md">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acesso Rápido</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => router.push(`/shop-admin/${shopId}/messages`)}
                                className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
                            >
                                <MessageSquare className="text-purple-600" size={24} />
                                <div>
                                    <p className="font-semibold text-gray-900">Mensagens</p>
                                    <p className="text-xs text-gray-600">Ver conversas</p>
                                </div>
                            </button>

                            <button
                                onClick={() => router.push(`/shop-admin/${shopId}/tickets`)}
                                className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left"
                            >
                                <AlertCircle className="text-orange-600" size={24} />
                                <div>
                                    <p className="font-semibold text-gray-900">Tickets</p>
                                    <p className="text-xs text-gray-600">Suporte e ocorrências</p>
                                </div>
                            </button>

                            <button
                                onClick={() => router.push(`/shop-admin/${shopId}/settings`)}
                                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                            >
                                <Package className="text-gray-600" size={24} />
                                <div>
                                    <p className="font-semibold text-gray-900">Configurações</p>
                                    <p className="text-xs text-gray-600">Dados da loja</p>
                                </div>
                            </button>
                        </div>
                    </Card>

                    {/* Info Notice */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>💡 Dica:</strong> Use o menu acima para navegar entre as diferentes seções do painel.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
