'use client';

import React, { useEffect, useState, use } from 'react';
import { Card, Loading } from '@/components/ui';
import {
    Users, Mail, Phone, Store, Star,
    Crown, Eye, Briefcase, Search
} from 'lucide-react';

const CLIENT_ID = 'acb4b354-728f-479d-915a-c857d27da9ad';

interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    is_active: boolean;
    shop_id: string | null;
    created_at: string;
}

interface Shop {
    id: string;
    name: string;
}

const roleConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700', icon: Crown },
    store_manager: { label: 'Gerente', color: 'bg-blue-100 text-blue-700', icon: Briefcase },
    sales_associate: { label: 'Vendedor(a)', color: 'bg-green-100 text-green-700', icon: Star },
    auditor: { label: 'Auditor(a)', color: 'bg-yellow-100 text-yellow-700', icon: Eye },
    staff: { label: 'Equipe', color: 'bg-gray-100 text-gray-700', icon: Users },
};

export default function ColaboradoresGestaoPage({
    params
}: {
    params: Promise<{ 'manager-id': string }>;
}) {
    const { 'manager-id': managerId } = use(params);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [managedShops, setManagedShops] = useState<Shop[]>([]);
    const [selectedShop, setSelectedShop] = useState<string>('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get managed shops
                const shopsRes = await fetch(`/api/managers/shops?managerId=${managerId}`);
                const shopsData = await shopsRes.json();
                const shops = shopsData.shops || [];
                setManagedShops(shops);

                if (shops.length === 0) {
                    setLoading(false);
                    return;
                }

                // Get users for managed shops
                const res = await fetch(`/api/users?client_id=${CLIENT_ID}`);
                if (res.ok) {
                    const data = await res.json();
                    const allUsers: User[] = Array.isArray(data) ? data : data.users || [];
                    // Filter to managed shop users only
                    const shopIds = new Set(shops.map((s: Shop) => s.id));
                    const filtered = allUsers.filter(u => u.shop_id && shopIds.has(u.shop_id));
                    setUsers(filtered);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [managerId]);

    if (loading) {
        return <Loading size="lg" text="Carregando colaboradores..." fullScreen />;
    }

    const displayUsers = users.filter(u => {
        const matchesShop = selectedShop === 'all' || u.shop_id === selectedShop;
        const matchesSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase());
        return matchesShop && matchesSearch;
    });

    const getShopName = (shopId: string | null) => {
        if (!shopId) return 'Sem loja';
        return managedShops.find(s => s.id === shopId)?.name || 'Loja';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="text-teal-600" size={28} />
                    Colaboradores
                </h2>
                <p className="text-gray-500 mt-1">Equipe das suas lojas gerenciadas</p>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    />
                </div>
                <select
                    value={selectedShop}
                    onChange={(e) => setSelectedShop(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-700"
                >
                    <option value="all">Todas as lojas</option>
                    {managedShops.map(shop => (
                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                    ))}
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-teal-700">{users.length}</p>
                    <p className="text-xs text-teal-600 font-medium">Total</p>
                </div>
                {Object.entries(roleConfig).filter(([key]) => users.some(u => u.role === key)).map(([key, cfg]) => {
                    const RIcon = cfg.icon;
                    const count = users.filter(u => u.role === key).length;
                    return (
                        <div key={key} className={`${cfg.color} rounded-xl p-4 text-center`}>
                            <RIcon size={18} className="mx-auto mb-1" />
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-xs font-medium">{cfg.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Users Grid */}
            {displayUsers.length === 0 ? (
                <div className="text-center py-16">
                    <Users size={48} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                        {managedShops.length === 0
                            ? 'Adicione lojas ao seu painel para ver colaboradores'
                            : 'Nenhum colaborador encontrado'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayUsers.map(user => {
                        const rCfg = roleConfig[user.role] || roleConfig.staff;
                        const RIcon = rCfg.icon;
                        return (
                            <Card key={user.id} padding="md" hover>
                                <div className="flex items-start gap-3">
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${user.role === 'store_manager' ? 'from-blue-400 to-blue-600' :
                                        user.role === 'sales_associate' ? 'from-green-400 to-green-600' :
                                            user.role === 'auditor' ? 'from-yellow-400 to-yellow-600' :
                                                'from-gray-400 to-gray-600'}`}>
                                        {user.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${rCfg.color}`}>
                                            <RIcon size={12} /> {rCfg.label}
                                        </span>
                                    </div>
                                    <span className={`inline-block w-2.5 h-2.5 rounded-full mt-2 ${user.is_active ? 'bg-green-400' : 'bg-gray-300'}`} />
                                </div>
                                <div className="mt-4 space-y-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Store size={14} className="text-gray-400" />
                                        <span className="truncate">{getShopName(user.shop_id)}</span>
                                    </div>
                                    {user.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail size={14} className="text-gray-400" />
                                            <span className="truncate">{user.email}</span>
                                        </div>
                                    )}
                                    {user.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={14} className="text-gray-400" />
                                            <span>{user.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
