'use client';

import React, { useEffect, useState } from 'react';
import {
    Settings, Bell, Shield, Palette, Globe, Info,
    Users, CheckCircle2, XCircle, Search, Plus,
    Loader2, UserPlus, Trash2, Store, Crown
} from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    is_active: boolean;
    shop_id: string | null;
    shops?: { name: string } | null;
}

const CLIENT_ID = 'acb4b354-728f-479d-915a-c857d27da9ad';

const roleConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    super_admin: { label: 'Super Admin', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200', icon: Crown },
    marketing: { label: 'Marketing', color: 'text-pink-700', bg: 'bg-pink-100 border-pink-200', icon: Users },
    shop_admin: { label: 'Admin Loja', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200', icon: Store },
    store_manager: { label: 'Gerente', color: 'text-green-700', bg: 'bg-green-100 border-green-200', icon: Users },
    sales_associate: { label: 'Vendedor', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200', icon: Users },
    auditor: { label: 'Auditor', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200', icon: Users },
    staff: { label: 'Staff', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200', icon: Users },
};

export default function MarketingSettingsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/users?client_id=${CLIENT_ID}`);
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    // Users who have marketing access
    const marketingUsers = users.filter(u => u.role === 'marketing' || u.role === 'super_admin');
    // Users who could be granted marketing access
    const availableUsers = users.filter(u =>
        u.role !== 'marketing' && u.role !== 'super_admin' &&
        (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    );

    const grantAccess = async (userId: string) => {
        setSaving(userId);
        try {
            const res = await fetch('/api/users/role', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, role: 'marketing' }),
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'marketing' } : u));
            } else {
                // Fallback: try direct update
                const res2 = await fetch('/api/users', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: userId, role: 'marketing' }),
                });
                if (res2.ok) {
                    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'marketing' } : u));
                } else {
                    alert('❌ Erro ao conceder acesso');
                }
            }
        } catch (e) {
            alert('❌ Erro ao conceder acesso');
        }
        setSaving(null);
    };

    const revokeAccess = async (userId: string) => {
        if (!confirm('Revogar acesso de marketing deste usuário? Ele voltará ao cargo de staff.')) return;
        setSaving(userId);
        try {
            const res = await fetch('/api/users/role', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, role: 'staff' }),
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'staff' } : u));
            } else {
                const res2 = await fetch('/api/users', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: userId, role: 'staff' }),
                });
                if (res2.ok) {
                    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'staff' } : u));
                } else {
                    alert('❌ Erro ao revogar acesso');
                }
            }
        } catch (e) {
            alert('❌ Erro ao revogar acesso');
        }
        setSaving(null);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="text-lale-pink" size={28} />
                    Configurações
                </h2>
                <p className="text-gray-500 mt-1">Gerencie permissões e configurações do painel de marketing</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ═══ ACCESS & PERMISSIONS ═══ */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
                                <Shield size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Acesso & Permissões</h3>
                                <p className="text-xs text-gray-500">Controle quem pode acessar o painel de marketing</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-lale-pink to-lale-orange text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-sm transition-all"
                        >
                            <UserPlus size={16} /> Adicionar Acesso
                        </button>
                    </div>

                    {/* Current marketing team */}
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 size={24} className="animate-spin text-lale-pink" />
                        </div>
                    ) : marketingUsers.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl">
                            <Users size={36} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-gray-500 font-medium">Nenhum usuário com acesso ao marketing</p>
                            <p className="text-gray-400 text-sm mt-1">Clique em "Adicionar Acesso" para conceder permissão</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">
                                {marketingUsers.length} usuário{marketingUsers.length > 1 ? 's' : ''} com acesso
                            </p>
                            {marketingUsers.map(user => {
                                const rc = roleConfig[user.role] || roleConfig.staff;
                                const RoleIcon = rc.icon;
                                return (
                                    <div key={user.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {(user.name || user.email || '?')[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{user.name || 'Sem nome'}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                        <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border ${rc.bg} ${rc.color}`}>
                                            <RoleIcon size={12} /> {rc.label}
                                        </span>
                                        {user.shops && (
                                            <span className="text-xs text-gray-400 flex items-center gap-1 hidden md:flex">
                                                <Store size={12} /> {(user.shops as any)?.name || '—'}
                                            </span>
                                        )}
                                        {user.role === 'super_admin' ? (
                                            <span className="text-xs text-gray-400 italic">Acesso total</span>
                                        ) : (
                                            <button
                                                onClick={() => revokeAccess(user.id)}
                                                disabled={saving === user.id}
                                                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                title="Revogar acesso"
                                            >
                                                {saving === user.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                            <Bell size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Notificações</h3>
                            <p className="text-xs text-gray-500">Configurar alertas de campanhas</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Notificar quando campanha expirar', desc: 'Receba alertas 3 dias antes do fim' },
                            { label: 'Notificar novas confirmações', desc: 'Quando uma loja confirmar recebimento' },
                            { label: 'Resumo semanal por email', desc: 'Relatório consolidado toda segunda-feira' },
                        ].map((opt, i) => (
                            <label key={i} className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" defaultChecked={i < 2} className="mt-1 rounded border-gray-300 text-lale-pink focus:ring-lale-pink" />
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                                    <p className="text-xs text-gray-500">{opt.desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Branding */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl">
                            <Palette size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Aparência</h3>
                            <p className="text-xs text-gray-500">Personalizar visuais das campanhas</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Tipos de campanha</label>
                            <div className="flex flex-wrap gap-2">
                                {['🌸 Sazonal', '🖤 Black Friday', '🚀 Lançamento', '🔥 Promoção', '📢 Geral'].map(t => (
                                    <span key={t} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">{t}</span>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Tipos personalizados estarão disponíveis em breve</p>
                        </div>
                    </div>
                </div>

                {/* General */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl">
                            <Globe size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Geral</h3>
                            <p className="text-xs text-gray-500">Configurações gerais do módulo</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Prazo padrão de confirmação (dias)</label>
                            <input type="number" defaultValue={7} min={1} max={30} className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-lale-pink/30" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Alerta de expiração (dias antes)</label>
                            <input type="number" defaultValue={3} min={1} max={14} className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-lale-pink/30" />
                        </div>
                    </div>
                </div>

                {/* Upload */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
                            <Info size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Armazenamento</h3>
                            <p className="text-xs text-gray-500">Configurações de upload</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Bucket</span>
                            <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">marketing-campaigns</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Tamanho máximo</span>
                            <span className="text-sm font-medium text-gray-900">20 MB</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Tipos permitidos</span>
                            <span className="text-xs text-gray-500">Imagens, PDF, Docs, Vídeos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
                <button className="px-6 py-2.5 bg-gradient-to-r from-lale-pink to-lale-orange text-white rounded-xl font-medium hover:opacity-90 shadow-md transition-all">
                    Salvar Configurações
                </button>
            </div>

            {/* ═══ ADD ACCESS MODAL ═══ */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserPlus className="text-lale-pink" size={20} />
                                <h3 className="text-lg font-bold text-gray-900">Adicionar Acesso ao Marketing</h3>
                            </div>
                            <button onClick={() => { setShowAddModal(false); setSearch(''); }} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="px-6 py-3 border-b border-gray-100">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar por nome ou email..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-lale-pink/30"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1">
                            {availableUsers.length === 0 ? (
                                <div className="text-center py-8">
                                    <Users size={32} className="mx-auto text-gray-200 mb-2" />
                                    <p className="text-gray-400 text-sm">
                                        {search ? 'Nenhum usuário encontrado' : 'Todos os usuários já têm acesso'}
                                    </p>
                                </div>
                            ) : (
                                availableUsers.map(user => {
                                    const rc = roleConfig[user.role] || roleConfig.staff;
                                    return (
                                        <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                                                {(user.name || user.email || '?')[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'Sem nome'}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="truncate">{user.email}</span>
                                                    <span className={`px-1.5 py-0.5 rounded border ${rc.bg} ${rc.color}`}>{rc.label}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => grantAccess(user.id)}
                                                disabled={saving === user.id}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-lale-pink to-lale-orange text-white rounded-lg text-xs font-medium hover:opacity-90 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                                            >
                                                {saving === user.id ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                                Conceder
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                            Usuários com cargo "Marketing" terão acesso completo ao painel de campanhas
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
