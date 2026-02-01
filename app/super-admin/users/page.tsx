'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Loading, Input } from '@/components/ui';
import { Users as UsersIcon, Search, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SuperAdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
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
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.whatsapp?.includes(searchTerm)
    );

    if (loading) return <Loading fullScreen text="Carregando clientes..." />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h1>
                    <p className="text-gray-500">Visualize todos os clientes cadastrados na plataforma</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Buscar cliente..."
                            className="pl-10 w-full md:w-64"
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
                                    <div className="w-10 h-10 bg-lale-pink/10 rounded-full flex items-center justify-center text-lale-pink">
                                        <UsersIcon size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{user.full_name}</p>
                                        <p className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}</p>
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: 'contact',
                            header: 'Contato',
                            render: (user) => (
                                <div className="space-y-1">
                                    <p className="text-sm flex items-center gap-2 text-gray-600">
                                        <Mail size={14} className="text-gray-400" />
                                        {user.email}
                                    </p>
                                    <p className="text-sm flex items-center gap-2 text-gray-600">
                                        <Phone size={14} className="text-gray-400" />
                                        {user.whatsapp}
                                    </p>
                                </div>
                            )
                        },
                        {
                            key: 'location',
                            header: 'Localização',
                            render: (user) => (
                                <div className="space-y-1">
                                    <p className="text-sm flex items-center gap-2 text-gray-600 font-medium">
                                        <MapPin size={14} className="text-gray-400" />
                                        {user.city}
                                    </p>
                                    {user.address && (
                                        <p className="text-xs text-gray-400 truncate max-w-[150px]">
                                            {user.address}
                                        </p>
                                    )}
                                </div>
                            )
                        },
                        {
                            key: 'created_at',
                            header: 'Cadastro',
                            render: (user) => (
                                <div className="text-sm text-gray-600 flex items-center gap-1">
                                    <Calendar size={14} className="text-gray-400" />
                                    {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                            )
                        },
                        {
                            key: 'actions',
                            header: 'Ações',
                            align: 'right',
                            render: () => (
                                <Button variant="outline" size="sm">Ver Perfil</Button>
                            )
                        }
                    ]}
                />
            </Card>
        </div>
    );
}
