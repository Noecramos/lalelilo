'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import {
    Users, Mail, Phone, Shield, Store, Star,
    Crown, Eye, Briefcase
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
    shops?: { name: string };
    created_at: string;
}

const roleConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700', icon: Crown },
    store_manager: { label: 'Gerente', color: 'bg-blue-100 text-blue-700', icon: Briefcase },
    sales_associate: { label: 'Vendedor(a)', color: 'bg-green-100 text-green-700', icon: Star },
    auditor: { label: 'Auditor(a)', color: 'bg-yellow-100 text-yellow-700', icon: Eye },
    staff: { label: 'Equipe', color: 'bg-gray-100 text-gray-700', icon: Users },
};

export default function TeamPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch(`/api/users?client_id=${CLIENT_ID}`);
                if (res.ok) {
                    const data = await res.json();
                    setUsers(Array.isArray(data) ? data : data.users || []);
                } else {
                    // Fallback: fetch directly from Supabase
                    const headers = {
                        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
                    };
                    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?client_id=eq.${CLIENT_ID}&select=id,name,email,phone,role,is_active,shop_id,created_at`;
                    const r2 = await fetch(url, { headers });
                    const data = await r2.json();
                    setUsers(Array.isArray(data) ? data : []);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchUsers();
    }, []);

    const countByRole = (r: string) => users.filter(u => u.role === r).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-lale-orange" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="text-lale-orange" size={28} />
                    Equipe
                </h2>
                <p className="text-gray-500 mt-1">Gerenciamento de colaboradores</p>
            </div>

            {/* Role Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(roleConfig).map(([key, cfg]) => {
                    const RIcon = cfg.icon;
                    return (
                        <div key={key} className={`p-4 rounded-xl ${cfg.color} text-center`}>
                            <RIcon size={20} className="mx-auto mb-1" />
                            <p className="text-2xl font-bold">{countByRole(key)}</p>
                            <p className="text-xs font-medium">{cfg.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(user => {
                    const rCfg = roleConfig[user.role] || roleConfig.staff;
                    const RIcon = rCfg.icon;
                    return (
                        <Card key={user.id} padding="md" hover>
                            <div className="flex items-start gap-3">
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${user.role === 'super_admin' ? 'from-purple-400 to-purple-600' :
                                        user.role === 'store_manager' ? 'from-blue-400 to-blue-600' :
                                            user.role === 'sales_associate' ? 'from-green-400 to-green-600' :
                                                user.role === 'auditor' ? 'from-yellow-400 to-yellow-600' :
                                                    'from-gray-400 to-gray-600'
                                    }`}>
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
                                    <Mail size={14} className="text-gray-400" />
                                    <span className="truncate">{user.email}</span>
                                </div>
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

            {users.length === 0 && (
                <div className="text-center py-16">
                    <Users size={48} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Nenhum colaborador encontrado</p>
                </div>
            )}
        </div>
    );
}
