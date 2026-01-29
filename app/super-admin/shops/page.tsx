'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Modal, Loading } from '@/components/ui';
import { Search, Plus, Edit, MapPin, Phone, Eye } from 'lucide-react';
import Link from 'next/link';

interface Shop {
    id: string;
    name: string;
    slug: string;
    city: string;
    state: string;
    phone: string;
    is_active: boolean;
    revenue_30d: number;
    orders_30d: number;
}

export default function ShopsManagementPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API call
            setTimeout(() => {
                setShops([
                    { id: '1', name: 'Lalelilo Centro', slug: 'centro', city: 'Recife', state: 'PE', phone: '(81) 3333-4444', is_active: true, revenue_30d: 15200.00, orders_30d: 145 },
                    { id: '2', name: 'Lalelilo Boa Viagem', slug: 'boa-viagem', city: 'Recife', state: 'PE', phone: '(81) 3333-5555', is_active: true, revenue_30d: 14800.00, orders_30d: 138 },
                    { id: '3', name: 'Lalelilo Shopping', slug: 'shopping', city: 'Recife', state: 'PE', phone: '(81) 3333-6666', is_active: true, revenue_30d: 13500.00, orders_30d: 125 },
                    { id: '4', name: 'Lalelilo Olinda', slug: 'olinda', city: 'Olinda', state: 'PE', phone: '(81) 3333-7777', is_active: true, revenue_30d: 12300.00, orders_30d: 118 },
                    { id: '5', name: 'Lalelilo Jaboatão', slug: 'jaboatao', city: 'Jaboatão', state: 'PE', phone: '(81) 3333-8888', is_active: false, revenue_30d: 0, orders_30d: 0 }
                ]);
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error fetching shops:', error);
            setLoading(false);
        }
    };

    const filteredShops = shops.filter(shop => {
        const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shop.city.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterActive === 'all' ||
            (filterActive === 'active' && shop.is_active) ||
            (filterActive === 'inactive' && !shop.is_active);
        return matchesSearch && matchesFilter;
    });

    const activeCount = shops.filter(s => s.is_active).length;
    const inactiveCount = shops.filter(s => !s.is_active).length;

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Lojas</h2>
                    <p className="text-gray-600 mt-1">
                        Gerencie todas as {shops.length} lojas Lalelilo
                    </p>
                </div>
                <Button variant="primary">
                    <Plus size={16} className="mr-2" />
                    Nova Loja
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card padding="md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total de Lojas</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{shops.length}</p>
                        </div>
                        <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                            <MapPin size={24} />
                        </div>
                    </div>
                </Card>

                <Card padding="md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Lojas Ativas</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{activeCount}</p>
                        </div>
                        <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                            <MapPin size={24} />
                        </div>
                    </div>
                </Card>

                <Card padding="md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Lojas Inativas</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{inactiveCount}</p>
                        </div>
                        <div className="bg-gray-100 text-gray-600 p-3 rounded-lg">
                            <MapPin size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card padding="md">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar por nome ou cidade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search size={18} />}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={filterActive === 'all' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilterActive('all')}
                        >
                            Todas
                        </Button>
                        <Button
                            variant={filterActive === 'active' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilterActive('active')}
                        >
                            Ativas
                        </Button>
                        <Button
                            variant={filterActive === 'inactive' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilterActive('inactive')}
                        >
                            Inativas
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Shops table */}
            <Card padding="none">
                {loading ? (
                    <div className="p-12">
                        <Loading size="lg" text="Carregando lojas..." />
                    </div>
                ) : filteredShops.length === 0 ? (
                    <div className="text-center py-12">
                        <MapPin size={48} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-500">Nenhuma loja encontrada</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Loja
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Localização
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Contato
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Receita (30d)
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Pedidos (30d)
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredShops.map((shop) => (
                                    <tr key={shop.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm">
                                            <p className="font-medium text-gray-900">{shop.name}</p>
                                            <p className="text-xs text-gray-500">/{shop.slug}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={14} />
                                                {shop.city}, {shop.state}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Phone size={14} />
                                                {shop.phone}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                            R$ {shop.revenue_30d.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-900">
                                            {shop.orders_30d}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            <Badge variant={shop.is_active ? 'success' : 'default'}>
                                                {shop.is_active ? 'Ativa' : 'Inativa'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link href={`/shop-admin/${shop.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        <Eye size={14} className="mr-1" />
                                                        Ver
                                                    </Button>
                                                </Link>
                                                <Button size="sm" variant="outline">
                                                    <Edit size={14} className="mr-1" />
                                                    Editar
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
