'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Badge, Button, Loading } from '@/components/ui';
import {
    ArrowLeft, User, Mail, Phone, MapPin, Calendar,
    ShoppingBag, Star, Edit, Save, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editedUser, setEditedUser] = useState<any>(null);

    useEffect(() => {
        if (userId) {
            fetchUser();
        }
    }, [userId]);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setUser(data);
            setEditedUser(data);
        } catch (error) {
            console.error('Error fetching user:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveUser = async () => {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: editedUser.full_name,
                    email: editedUser.email,
                    whatsapp: editedUser.whatsapp,
                    city: editedUser.city,
                    address: editedUser.address,
                })
                .eq('id', userId);

            if (error) throw error;

            setUser(editedUser);
            setEditing(false);
            alert('Usuário atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Erro ao atualizar usuário');
        }
    };

    if (loading) return <Loading fullScreen text="Carregando usuário..." />;
    if (!user) return (
        <div className="text-center py-16">
            <p className="text-gray-500">Usuário não encontrado</p>
            <Button onClick={() => router.push('/super-admin/users')} className="mt-4">
                Voltar
            </Button>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/super-admin/users')}
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Perfil do Cliente</h1>
                        <p className="text-gray-500">Visualize e edite informações do cliente</p>
                    </div>
                </div>
                {!editing ? (
                    <Button variant="primary" onClick={() => setEditing(true)}>
                        <Edit size={18} className="mr-2" />
                        Editar
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {
                            setEditing(false);
                            setEditedUser(user);
                        }}>
                            <X size={18} className="mr-2" />
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={saveUser}>
                            <Save size={18} className="mr-2" />
                            Salvar
                        </Button>
                    </div>
                )}
            </div>

            {/* User Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-lale-orange to-lale-pink rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {user.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editedUser.full_name}
                                        onChange={(e) => setEditedUser({ ...editedUser, full_name: e.target.value })}
                                        className="text-2xl font-bold text-gray-900 border-b-2 border-lale-orange focus:outline-none"
                                    />
                                ) : (
                                    <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
                                )}
                                <p className="text-sm text-gray-500">ID: {user.id.substring(0, 8)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Email */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <Mail size={16} className="text-gray-400" />
                                    Email
                                </label>
                                {editing ? (
                                    <input
                                        type="email"
                                        value={editedUser.email}
                                        onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-gray-900">{user.email}</p>
                                )}
                            </div>

                            {/* WhatsApp */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <Phone size={16} className="text-gray-400" />
                                    WhatsApp
                                </label>
                                {editing ? (
                                    <input
                                        type="tel"
                                        value={editedUser.whatsapp}
                                        onChange={(e) => setEditedUser({ ...editedUser, whatsapp: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-gray-900">{user.whatsapp}</p>
                                )}
                            </div>

                            {/* City */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <MapPin size={16} className="text-gray-400" />
                                    Cidade
                                </label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editedUser.city}
                                        onChange={(e) => setEditedUser({ ...editedUser, city: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-gray-900">{user.city}</p>
                                )}
                            </div>

                            {/* Created At */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <Calendar size={16} className="text-gray-400" />
                                    Cadastro
                                </label>
                                <p className="text-gray-900">
                                    {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                            </div>
                        </div>

                        {/* Address */}
                        {(editing || user.address) && (
                            <div className="mt-4">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <MapPin size={16} className="text-gray-400" />
                                    Endereço
                                </label>
                                {editing ? (
                                    <textarea
                                        value={editedUser.address || ''}
                                        onChange={(e) => setEditedUser({ ...editedUser, address: e.target.value })}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-gray-900">{user.address}</p>
                                )}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Stats Sidebar */}
                <div className="space-y-4">
                    <Card>
                        <div className="text-center">
                            <ShoppingBag size={32} className="text-lale-orange mx-auto mb-2" />
                            <p className="text-3xl font-bold text-gray-900">0</p>
                            <p className="text-sm text-gray-500">Pedidos</p>
                        </div>
                    </Card>

                    <Card>
                        <div className="text-center">
                            <Star size={32} className="text-yellow-500 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-gray-900">R$ 0,00</p>
                            <p className="text-sm text-gray-500">Valor Total</p>
                        </div>
                    </Card>

                    <Card>
                        <div className="text-center">
                            <User size={32} className="text-blue-500 mx-auto mb-2" />
                            <Badge variant="default">Cliente</Badge>
                            <p className="text-xs text-gray-500 mt-2">Status</p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Activity Section */}
            <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Atividade Recente</h3>
                <div className="text-center py-8 text-gray-500">
                    <ShoppingBag size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma atividade registrada</p>
                </div>
            </Card>
        </div>
    );
}
