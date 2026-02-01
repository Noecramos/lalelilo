'use client';

import React, { useState, useEffect, use } from 'react';
import { Card, Table, Badge, Button, Loading, Input } from '@/components/ui';
import { Users as UsersIcon, Search, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PageProps {
    params: Promise<{ 'shop-id': string }>;
}

export default function ShopAdminUsersPage({ params }: PageProps) {
    const { 'shop-id': shopId } = use(params);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // For now, shops can see all registered users to help with CRM/Marketing
            // Later this could be filtered to only users who have ordered from this shop
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.whatsapp?.includes(searchTerm)
    );

    if (loading) return <Loading fullScreen text="Carregando base de clientes..." />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Base de Clientes</h1>
                    <p className="text-gray-500">Consulte os dados dos clientes cadastrados para melhorar seu atendimento</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Buscar por nome ou WhatsApp..."
                            className="pl-10 w-full md:w-80"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Card>
                <Table
                    data={filteredUsers}
                    columns={[
                        {
                            key: 'full_name',
                            header: 'Cliente',
                            render: (user) => (
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-lale-orange/10 rounded-full flex items-center justify-center text-lale-orange">
                                        <UsersIcon size={18} />
                                    </div>
                                    <p className="font-semibold text-gray-900">{user.full_name}</p>
                                </div>
                            )
                        },
                        {
                            key: 'whatsapp',
                            header: 'WhatsApp',
                            render: (user) => (
                                <div className="text-sm flex items-center gap-2 text-gray-700">
                                    <Phone size={14} className="text-lale-orange" />
                                    {user.whatsapp}
                                </div>
                            )
                        },
                        {
                            key: 'city',
                            header: 'Cidade',
                        },
                        {
                            key: 'created_at',
                            header: 'Membro Desde',
                            render: (user) => (
                                <div className="text-sm text-gray-500">
                                    {format(new Date(user.created_at), "MMM yyyy", { locale: ptBR })}
                                </div>
                            )
                        },
                        {
                            key: 'actions',
                            header: 'Ações',
                            align: 'right',
                            render: (user) => (
                                <a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                                        Enviar WhatsApp
                                    </Button>
                                </a>
                            )
                        }
                    ]}
                />
            </Card>
        </div>
    );
}
