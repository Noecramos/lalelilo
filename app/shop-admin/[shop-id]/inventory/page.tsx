'use client';

import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Modal, Loading, Badge } from '@/components/ui';
import { Package, AlertTriangle, Plus, Edit, Search } from 'lucide-react';

interface InventoryItem {
    id: string;
    shop_id: string;
    product_id: string;
    quantity: number;
    low_stock_threshold: number;
    product: {
        name: string;
        sku?: string;
        price: number;
        image_url?: string;
    };
}

export default function InventoryPage({
    params
}: {
    params: { 'shop-id': string };
}) {
    const shopId = params['shop-id'];
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [newQuantity, setNewQuantity] = useState('');

    useEffect(() => {
        fetchInventory();
    }, [shopId, showLowStockOnly]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API call
            // const url = `/api/inventory?shop_id=${shopId}${showLowStockOnly ? '&low_stock=true' : ''}`;
            // const response = await fetch(url);
            // const data = await response.json();

            // Mock data for now
            setTimeout(() => {
                setInventory([
                    {
                        id: '1',
                        shop_id: shopId,
                        product_id: 'prod-1',
                        quantity: 25,
                        low_stock_threshold: 10,
                        product: {
                            name: 'Vestido Infantil Rosa',
                            sku: 'VEST-001',
                            price: 75.00,
                            image_url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=200'
                        }
                    },
                    {
                        id: '2',
                        shop_id: shopId,
                        product_id: 'prod-2',
                        quantity: 5,
                        low_stock_threshold: 10,
                        product: {
                            name: 'Conjunto Infantil Azul',
                            sku: 'CONJ-002',
                            price: 89.90,
                            image_url: 'https://images.unsplash.com/photo-1621452773781-0f992ee03598?auto=format&fit=crop&q=80&w=200'
                        }
                    },
                    {
                        id: '3',
                        shop_id: shopId,
                        product_id: 'prod-3',
                        quantity: 2,
                        low_stock_threshold: 5,
                        product: {
                            name: 'Calça Jeans Infantil',
                            sku: 'CALC-003',
                            price: 65.00,
                            image_url: 'https://images.unsplash.com/photo-1519238806043-5131e1cadd52?auto=format&fit=crop&q=80&w=200'
                        }
                    },
                    {
                        id: '4',
                        shop_id: shopId,
                        product_id: 'prod-4',
                        quantity: 50,
                        low_stock_threshold: 15,
                        product: {
                            name: 'Camiseta Básica Branca',
                            sku: 'CAM-004',
                            price: 35.00,
                            image_url: 'https://images.unsplash.com/photo-1519457431-44cd6e6962f3?auto=format&fit=crop&q=80&w=200'
                        }
                    }
                ]);
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            setLoading(false);
        }
    };

    const updateInventory = async (itemId: string, quantity: number) => {
        try {
            // TODO: Replace with actual API call
            // await fetch(`/api/inventory`, {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({
            //     shop_id: shopId,
            //     product_id: editingItem?.product_id,
            //     quantity
            //   })
            // });

            // Update local state
            setInventory(inventory.map(item =>
                item.id === itemId
                    ? { ...item, quantity }
                    : item
            ));

            setEditingItem(null);
            setNewQuantity('');
            alert('Estoque atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating inventory:', error);
            alert('Erro ao atualizar estoque');
        }
    };

    const isLowStock = (item: InventoryItem) => {
        return item.quantity <= item.low_stock_threshold;
    };

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLowStock = !showLowStockOnly || isLowStock(item);
        return matchesSearch && matchesLowStock;
    });

    const lowStockCount = inventory.filter(isLowStock).length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Estoque</h2>
                <p className="text-gray-600 mt-1">
                    Gerencie o estoque da sua loja
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card padding="md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total de Produtos</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {inventory.length}
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
                            <p className="text-sm text-gray-600">Estoque Baixo</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {lowStockCount}
                            </p>
                        </div>
                        <div className="bg-red-100 text-red-600 p-3 rounded-lg">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                </Card>

                <Card padding="md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Valor Total</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                R$ {totalValue.toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                            <Package size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card padding="md">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar por nome ou SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search size={18} />}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showLowStockOnly}
                                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                                className="rounded border-gray-300 text-[#ffa944] focus:ring-[#ffa944]"
                            />
                            <span className="text-sm text-gray-700">Apenas estoque baixo</span>
                        </label>
                    </div>
                </div>
            </Card>

            {/* Inventory table */}
            <Card padding="none">
                {loading ? (
                    <div className="p-12">
                        <Loading size="lg" text="Carregando estoque..." />
                    </div>
                ) : filteredInventory.length === 0 ? (
                    <div className="text-center py-12">
                        <Package size={48} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-500">Nenhum produto encontrado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Produto
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        SKU
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Quantidade
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Mínimo
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Preço Unit.
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Valor Total
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
                                {filteredInventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex items-center gap-3">
                                                {item.product.image_url && (
                                                    <img
                                                        src={item.product.image_url}
                                                        alt={item.product.name}
                                                        className="w-10 h-10 rounded object-cover"
                                                    />
                                                )}
                                                <span className="font-medium text-gray-900">
                                                    {item.product.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {item.product.sku || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            <span className={`font-bold ${isLowStock(item) ? 'text-red-600' : 'text-gray-900'}`}>
                                                {item.quantity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                                            {item.low_stock_threshold}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                                            R$ {item.product.price.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                            R$ {(item.quantity * item.product.price).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            {isLowStock(item) ? (
                                                <Badge variant="danger">
                                                    <AlertTriangle size={12} className="mr-1" />
                                                    Baixo
                                                </Badge>
                                            ) : (
                                                <Badge variant="success">OK</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setEditingItem(item);
                                                    setNewQuantity(item.quantity.toString());
                                                }}
                                            >
                                                <Edit size={14} className="mr-1" />
                                                Editar
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Edit inventory modal */}
            {editingItem && (
                <Modal
                    isOpen={!!editingItem}
                    onClose={() => {
                        setEditingItem(null);
                        setNewQuantity('');
                    }}
                    title="Atualizar Estoque"
                    footer={
                        <>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setEditingItem(null);
                                    setNewQuantity('');
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => updateInventory(editingItem.id, parseInt(newQuantity))}
                                disabled={!newQuantity || parseInt(newQuantity) < 0}
                            >
                                Salvar
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="font-medium text-gray-900">{editingItem.product.name}</p>
                            <p className="text-sm text-gray-600">SKU: {editingItem.product.sku || 'N/A'}</p>
                            <p className="text-sm text-gray-600">Estoque atual: {editingItem.quantity} unidades</p>
                        </div>

                        <Input
                            label="Nova Quantidade"
                            type="number"
                            min="0"
                            value={newQuantity}
                            onChange={(e) => setNewQuantity(e.target.value)}
                            placeholder="Digite a nova quantidade"
                            required
                        />

                        {parseInt(newQuantity) <= editingItem.low_stock_threshold && newQuantity !== '' && (
                            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
                                <p className="text-sm text-yellow-800">
                                    Atenção: A quantidade está abaixo do mínimo recomendado ({editingItem.low_stock_threshold} unidades)
                                </p>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
