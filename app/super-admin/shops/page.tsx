'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Modal, Loading } from '@/components/ui';
import { Search, Plus, Edit, MapPin, Phone, Eye, Key, Mail, Copy, Check } from 'lucide-react';
import Link from 'next/link';

interface Shop {
    id: string;
    name: string;
    slug: string;
    city: string;
    state: string;
    phone: string;
    whatsapp?: string;
    email?: string;
    address?: string;
    cnpj?: string;
    password_hash?: string;
    last_login?: string;
    is_active: boolean;
    revenue_30d: number;
    orders_30d: number;
}

export default function ShopsManagementPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [passwordModal, setPasswordModal] = useState<{ show: boolean; password: string; shopName: string }>({ show: false, password: '', shopName: '' });
    const [copied, setCopied] = useState(false);
    const [newShop, setNewShop] = useState<Partial<Shop>>({
        name: '',
        slug: '',
        city: '',
        state: '',
        phone: '',
        whatsapp: '',
        email: '',
        address: '',
        cnpj: '',
        is_active: true
    });

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/shops');
            if (response.ok) {
                const data = await response.json();
                setShops(data.shops || []);
            }
        } catch (error) {
            console.error('Error fetching shops:', error);
        } finally {
            setLoading(false);
        }
    };

    const createShop = async () => {
        try {
            const response = await fetch('/api/shops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newShop),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create shop');
            }

            await fetchShops();
            setIsCreating(false);
            setNewShop({ name: '', slug: '', city: '', state: '', phone: '', whatsapp: '', email: '', address: '', cnpj: '', is_active: true });
            alert('Loja criada com sucesso!');
        } catch (error) {
            console.error('Error creating shop:', error);
            alert(error instanceof Error ? error.message : 'Erro ao criar loja');
        }
    };

    const saveShop = async (shop: Shop) => {
        try {
            const response = await fetch(`/api/shops/${shop.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: shop.name,
                    slug: shop.slug,
                    city: shop.city,
                    state: shop.state,
                    phone: shop.phone,
                    is_active: shop.is_active,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update shop');
            }

            await fetchShops();
            setEditingShop(null);
            alert('Loja atualizada com sucesso!');
        } catch (error) {
            console.error('Error saving shop:', error);
            alert(error instanceof Error ? error.message : 'Erro ao salvar alterações');
        }
    };

    const generatePassword = async (shop: Shop) => {
        if (!confirm(`Gerar senha para ${shop.name}?`)) return;

        try {
            const response = await fetch('/api/shops/generate-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shopId: shop.id }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate password');
            }

            setPasswordModal({
                show: true,
                password: data.password,
                shopName: shop.name
            });

            await fetchShops();
        } catch (error) {
            console.error('Error generating password:', error);
            alert(error instanceof Error ? error.message : 'Erro ao gerar senha');
        }
    };

    const resetPassword = async (shop: Shop) => {
        if (!confirm(`Resetar senha para ${shop.name}? Uma nova senha será gerada e enviada para ${shop.email || 'o email cadastrado'}.`)) return;

        try {
            const response = await fetch('/api/shops/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shopId: shop.id }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            setPasswordModal({
                show: true,
                password: data.password,
                shopName: shop.name
            });

            alert(`Senha resetada! ${shop.email ? `Email enviado para ${shop.email}` : 'Copie a senha abaixo'}`);
            await fetchShops();
        } catch (error) {
            console.error('Error resetting password:', error);
            alert(error instanceof Error ? error.message : 'Erro ao resetar senha');
        }
    };

    const copyPassword = () => {
        navigator.clipboard.writeText(passwordModal.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Lojas</h2>
                    <p className="text-gray-600 mt-1">
                        Gerencie todas as {shops.length} lojas Lalelilo
                    </p>
                </div>
                <Button variant="primary" onClick={() => setIsCreating(true)} className="w-full sm:w-auto">
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
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Senha
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Último Login
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
                                        <td className="px-4 py-3 text-sm text-center">
                                            {shop.password_hash ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <Badge variant="success">✓ Configurada</Badge>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => resetPassword(shop)}
                                                        className="text-xs"
                                                    >
                                                        <Key size={12} className="mr-1" />
                                                        Resetar
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    onClick={() => generatePassword(shop)}
                                                >
                                                    <Key size={14} className="mr-1" />
                                                    Gerar Senha
                                                </Button>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                                            {shop.last_login ? (
                                                <div className="text-xs">
                                                    <div>{new Date(shop.last_login).toLocaleDateString('pt-BR')}</div>
                                                    <div className="text-gray-400">{new Date(shop.last_login).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Nunca</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                            R$ {(shop.revenue_30d || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-900">
                                            {shop.orders_30d || 0}
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
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setEditingShop(shop)}
                                                >
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

            {/* Edit Shop Modal */}
            {editingShop && (
                <Modal
                    isOpen={!!editingShop}
                    onClose={() => setEditingShop(null)}
                    title={`Editar Loja: ${editingShop.name}`}
                    size="lg"
                    footer={
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setEditingShop(null)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => editingShop && saveShop(editingShop)}
                            >
                                Salvar Alterações
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <Input
                            label="Nome da Loja"
                            value={editingShop.name}
                            onChange={(e) => setEditingShop({ ...editingShop, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Slug (URL)"
                            value={editingShop.slug}
                            onChange={(e) => setEditingShop({ ...editingShop, slug: e.target.value })}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Cidade"
                                value={editingShop.city}
                                onChange={(e) => setEditingShop({ ...editingShop, city: e.target.value })}
                                required
                            />
                            <Input
                                label="Estado"
                                value={editingShop.state}
                                onChange={(e) => setEditingShop({ ...editingShop, state: e.target.value })}
                                maxLength={2}
                                required
                            />
                        </div>
                        <Input
                            label="Telefone"
                            value={editingShop.phone}
                            onChange={(e) => setEditingShop({ ...editingShop, phone: e.target.value })}
                            required
                        />
                        <Input
                            label="WhatsApp"
                            value={editingShop.whatsapp || ''}
                            onChange={(e) => setEditingShop({ ...editingShop, whatsapp: e.target.value })}
                            placeholder="(00) 00000-0000"
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={editingShop.email || ''}
                            onChange={(e) => setEditingShop({ ...editingShop, email: e.target.value })}
                            placeholder="loja@exemplo.com"
                        />
                        <Input
                            label="Endereço Completo"
                            value={editingShop.address || ''}
                            onChange={(e) => setEditingShop({ ...editingShop, address: e.target.value })}
                            placeholder="Rua, número, bairro, CEP"
                        />
                        <Input
                            label="CNPJ"
                            value={editingShop.cnpj || ''}
                            onChange={(e) => setEditingShop({ ...editingShop, cnpj: e.target.value })}
                            placeholder="00.000.000/0000-00"
                            maxLength={18}
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={editingShop.is_active}
                                onChange={(e) => setEditingShop({ ...editingShop, is_active: e.target.checked })}
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="is_active" className="text-sm text-gray-700">
                                Loja Ativa
                            </label>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Create Shop Modal */}
            {isCreating && (
                <Modal
                    isOpen={isCreating}
                    onClose={() => setIsCreating(false)}
                    title="Nova Loja"
                    size="lg"
                    footer={
                        <>
                            <Button variant="outline" onClick={() => setIsCreating(false)}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={createShop}>
                                Criar Loja
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <Input
                            label="Nome da Loja"
                            value={newShop.name || ''}
                            onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Slug (URL)"
                            value={newShop.slug || ''}
                            onChange={(e) => setNewShop({ ...newShop, slug: e.target.value })}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Cidade"
                                value={newShop.city || ''}
                                onChange={(e) => setNewShop({ ...newShop, city: e.target.value })}
                                required
                            />
                            <Input
                                label="Estado"
                                value={newShop.state || ''}
                                onChange={(e) => setNewShop({ ...newShop, state: e.target.value })}
                                maxLength={2}
                                required
                            />
                        </div>
                        <Input
                            label="Telefone"
                            value={newShop.phone || ''}
                            onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
                            required
                        />
                        <Input
                            label="WhatsApp"
                            value={newShop.whatsapp || ''}
                            onChange={(e) => setNewShop({ ...newShop, whatsapp: e.target.value })}
                            placeholder="(00) 00000-0000"
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={newShop.email || ''}
                            onChange={(e) => setNewShop({ ...newShop, email: e.target.value })}
                            placeholder="loja@exemplo.com"
                        />
                        <Input
                            label="Endereço Completo"
                            value={newShop.address || ''}
                            onChange={(e) => setNewShop({ ...newShop, address: e.target.value })}
                            placeholder="Rua, número, bairro, CEP"
                        />
                        <Input
                            label="CNPJ"
                            value={newShop.cnpj || ''}
                            onChange={(e) => setNewShop({ ...newShop, cnpj: e.target.value })}
                            placeholder="00.000.000/0000-00"
                            maxLength={18}
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="new_is_active"
                                checked={newShop.is_active}
                                onChange={(e) => setNewShop({ ...newShop, is_active: e.target.checked })}
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="new_is_active" className="text-sm text-gray-700">
                                Loja Ativa
                            </label>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Password Modal */}
            {passwordModal.show && (
                <Modal
                    title="🔑 Senha Gerada"
                    isOpen={passwordModal.show}
                    onClose={() => setPasswordModal({ show: false, password: '', shopName: '' })}
                    size="md"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Senha gerada para <strong>{passwordModal.shopName}</strong>:
                        </p>

                        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">Senha:</p>
                                    <p className="text-2xl font-mono font-bold text-purple-600 tracking-wider">
                                        {passwordModal.password}
                                    </p>
                                </div>
                                <Button
                                    variant={copied ? 'success' : 'primary'}
                                    onClick={copyPassword}
                                    className="flex-shrink-0"
                                >
                                    {copied ? (
                                        <>
                                            <Check size={16} className="mr-2" />
                                            Copiado!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} className="mr-2" />
                                            Copiar
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                                <strong>⚠️ Importante:</strong> Copie esta senha agora! Ela não será exibida novamente.
                            </p>
                        </div>

                        <div className="text-xs text-gray-500 space-y-1">
                            <p>• A senha foi salva no sistema</p>
                            <p>• O usuário pode fazer login com o slug da loja e esta senha</p>
                            <p>• Se configurado, um email foi enviado automaticamente</p>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
