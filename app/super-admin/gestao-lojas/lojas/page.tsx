'use client';

import React, { useEffect, useState } from 'react';
import { Card, Badge, Loading } from '@/components/ui';
import {
    Store, Plus, Minus, Check, MapPin, Phone as PhoneIcon,
    Search, ArrowUpRight, Building2
} from 'lucide-react';
import Link from 'next/link';

interface Shop {
    id: string;
    name: string;
    slug: string;
    city: string;
    state: string;
    phone: string;
    is_active: boolean;
}

export default function MinhasLojasPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [allShops, setAllShops] = useState<Shop[]>([]);
    const [managedShopIds, setManagedShopIds] = useState<string[]>([]);
    const [managerId, setManagerId] = useState<string>('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const shopsRes = await fetch('/api/shops');
                const shopsData = await shopsRes.json();
                setAllShops(shopsData.shops || []);

                const mgrRes = await fetch('/api/managers');
                const mgrData = await mgrRes.json();
                const mgr = (mgrData.managers || [])[0];
                if (mgr) {
                    setManagerId(mgr.id);
                    setManagedShopIds(mgr.managed_shop_ids || []);
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const toggleShop = (shopId: string) => {
        setManagedShopIds(prev =>
            prev.includes(shopId) ? prev.filter(id => id !== shopId) : [...prev, shopId]
        );
    };

    const saveChanges = async () => {
        if (!managerId) return;
        setSaving(true);
        try {
            const res = await fetch('/api/managers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ managerId, managed_shop_ids: managedShopIds })
            });
            const data = await res.json();
            if (data.success) alert('Lojas atualizadas com sucesso!');
            else alert('Erro: ' + (data.error || 'Tente novamente'));
        } catch { alert('Erro de conexão'); }
        finally { setSaving(false); }
    };

    if (loading) return <Loading size="lg" text="Carregando lojas..." fullScreen />;

    const filtered = allShops.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) || s.city?.toLowerCase().includes(search.toLowerCase())
    );
    const managed = filtered.filter(s => managedShopIds.includes(s.id));
    const available = filtered.filter(s => !managedShopIds.includes(s.id));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="text-teal-600" size={28} />
                        Minhas Lojas
                    </h2>
                    <p className="text-gray-500 mt-1">Selecione lojas para o painel de Gestão</p>
                </div>
                <button onClick={saveChanges} disabled={saving}
                    className="bg-teal-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                    <Check size={18} />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-teal-700">{managedShopIds.length}</p>
                    <p className="text-sm text-teal-600 font-medium">Selecionadas</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-gray-700">{allShops.length}</p>
                    <p className="text-sm text-gray-600 font-medium">Total</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-emerald-700">{allShops.length - managedShopIds.length}</p>
                    <p className="text-sm text-emerald-600 font-medium">Disponíveis</p>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Buscar por nome ou cidade..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
            </div>

            {managed.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Check size={18} className="text-teal-600" />
                        Lojas Selecionadas ({managed.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {managed.map(shop => (
                            <div key={shop.id} className="bg-white border-2 border-teal-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600"><Store size={20} /></div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{shop.name}</h4>
                                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5"><MapPin size={12} />{shop.city}, {shop.state}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toggleShop(shop.id)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                        <Minus size={14} /> Remover
                                    </button>
                                    <Link href={`/shop-admin/${shop.slug}`}
                                        className="flex items-center justify-center gap-1 px-3 py-2 text-sm border border-teal-200 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors">
                                        <ArrowUpRight size={14} /> Abrir
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {available.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Plus size={18} className="text-gray-400" />
                        Lojas Disponíveis ({available.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {available.map(shop => (
                            <div key={shop.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow opacity-75 hover:opacity-100">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><Store size={20} /></div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{shop.name}</h4>
                                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5"><MapPin size={12} />{shop.city}, {shop.state}</div>
                                    </div>
                                </div>
                                <button onClick={() => toggleShop(shop.id)}
                                    className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm bg-teal-50 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors font-medium">
                                    <Plus size={14} /> Adicionar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
