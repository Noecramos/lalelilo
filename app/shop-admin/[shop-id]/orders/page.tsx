'use client';

import React, { useEffect, useState } from 'react';
import { Card, Badge, Button, Select, Modal, Loading, getOrderStatusBadge } from '@/components/ui';
import { Eye, Filter, Download } from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';

export default function OrdersPage({
    params
}: {
    params: { 'shop-id': string };
}) {
    const shopId = params['shop-id'];
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchOrders();
    }, [shopId, statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API call
            // const response = await fetch(`/api/orders?shop_id=${shopId}&status=${statusFilter !== 'all' ? statusFilter : ''}`);
            // const data = await response.json();

            // Mock data for now
            setTimeout(() => {
                setOrders([
                    {
                        id: '1',
                        order_number: 'LAL-20260129-ABC12',
                        shop_id: shopId,
                        client_id: 'lalelilo-id',
                        customer_name: 'João Silva',
                        customer_email: 'joao@email.com',
                        customer_phone: '81999887766',
                        customer_address: 'Rua das Flores, 123',
                        customer_city: 'Recife',
                        customer_state: 'PE',
                        order_type: 'delivery',
                        status: 'pending',
                        subtotal: 150.00,
                        delivery_fee: 10.00,
                        discount: 0,
                        total_amount: 160.00,
                        payment_method: 'pix',
                        payment_status: 'pending',
                        items: [
                            {
                                product_id: '1',
                                product_name: 'Vestido Infantil Rosa',
                                quantity: 2,
                                price: 75.00,
                                size: 'M',
                                subtotal: 150.00
                            }
                        ],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    },
                    {
                        id: '2',
                        order_number: 'LAL-20260129-DEF34',
                        shop_id: shopId,
                        client_id: 'lalelilo-id',
                        customer_name: 'Maria Santos',
                        customer_email: 'maria@email.com',
                        customer_phone: '81988776655',
                        customer_address: 'Av. Principal, 456',
                        customer_city: 'Recife',
                        customer_state: 'PE',
                        order_type: 'pickup',
                        status: 'confirmed',
                        subtotal: 89.90,
                        delivery_fee: 0,
                        discount: 10.00,
                        total_amount: 79.90,
                        payment_method: 'credit_card',
                        payment_status: 'paid',
                        items: [
                            {
                                product_id: '2',
                                product_name: 'Conjunto Infantil Azul',
                                quantity: 1,
                                price: 89.90,
                                size: 'G',
                                subtotal: 89.90
                            }
                        ],
                        created_at: new Date(Date.now() - 3600000).toISOString(),
                        updated_at: new Date(Date.now() - 3600000).toISOString()
                    }
                ]);
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
        try {
            // TODO: Replace with actual API call
            // await fetch(`/api/orders/${orderId}`, {
            //   method: 'PUT',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ status: newStatus })
            // });

            // Update local state
            setOrders(orders.map(order =>
                order.id === orderId
                    ? { ...order, status: newStatus }
                    : order
            ));

            alert(`Pedido atualizado para: ${newStatus}`);
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Erro ao atualizar pedido');
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Pendente',
            confirmed: 'Confirmado',
            preparing: 'Preparando',
            ready: 'Pronto',
            out_for_delivery: 'Saiu para entrega',
            delivered: 'Entregue',
            cancelled: 'Cancelado'
        };
        return labels[status] || status;
    };

    const filteredOrders = statusFilter === 'all'
        ? orders
        : orders.filter(order => order.status === statusFilter);

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Pedidos</h2>
                    <p className="text-gray-600 mt-1">
                        Gerencie todos os pedidos da sua loja
                    </p>
                </div>
                <Button variant="outline">
                    <Download size={16} className="mr-2" />
                    Exportar
                </Button>
            </div>

            {/* Filters */}
            <Card padding="md">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Select
                            label="Filtrar por status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { value: 'all', label: 'Todos os status' },
                                { value: 'pending', label: 'Pendente' },
                                { value: 'confirmed', label: 'Confirmado' },
                                { value: 'preparing', label: 'Preparando' },
                                { value: 'ready', label: 'Pronto' },
                                { value: 'out_for_delivery', label: 'Saiu para entrega' },
                                { value: 'delivered', label: 'Entregue' },
                                { value: 'cancelled', label: 'Cancelado' }
                            ]}
                        />
                    </div>
                    <div className="flex items-end">
                        <Button variant="primary">
                            <Filter size={16} className="mr-2" />
                            Aplicar Filtros
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Orders table */}
            <Card padding="none">
                {loading ? (
                    <div className="p-12">
                        <Loading size="lg" text="Carregando pedidos..." />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Nenhum pedido encontrado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Pedido
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Cliente
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Tipo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Valor
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Pagamento
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Data
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {order.order_number}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div>
                                                <p className="font-medium text-gray-900">{order.customer_name}</p>
                                                <p className="text-gray-500 text-xs">{order.customer_phone}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <Badge variant={order.order_type === 'delivery' ? 'info' : 'default'}>
                                                {order.order_type === 'delivery' ? 'Entrega' : 'Retirada'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            R$ {order.total_amount.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <Badge variant={getOrderStatusBadge(order.status)}>
                                                {getStatusLabel(order.status)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
                                                {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                            <br />
                                            <span className="text-xs text-gray-400">
                                                {new Date(order.created_at).toLocaleTimeString('pt-BR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                <Eye size={14} className="mr-1" />
                                                Ver
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Order details modal */}
            {selectedOrder && (
                <Modal
                    isOpen={!!selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    title={`Pedido ${selectedOrder.order_number}`}
                    size="lg"
                >
                    <div className="space-y-4">
                        {/* Customer info */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Informações do Cliente</h4>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                                <p><span className="font-medium">Nome:</span> {selectedOrder.customer_name}</p>
                                <p><span className="font-medium">Telefone:</span> {selectedOrder.customer_phone}</p>
                                <p><span className="font-medium">Email:</span> {selectedOrder.customer_email || 'Não informado'}</p>
                                {selectedOrder.order_type === 'delivery' && (
                                    <p><span className="font-medium">Endereço:</span> {selectedOrder.customer_address}, {selectedOrder.customer_city} - {selectedOrder.customer_state}</p>
                                )}
                            </div>
                        </div>

                        {/* Items */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Itens do Pedido</h4>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Produto</th>
                                            <th className="px-3 py-2 text-center">Qtd</th>
                                            <th className="px-3 py-2 text-right">Preço</th>
                                            <th className="px-3 py-2 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {selectedOrder.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-3 py-2">
                                                    {item.product_name}
                                                    {item.size && <span className="text-gray-500 text-xs ml-1">(Tam: {item.size})</span>}
                                                </td>
                                                <td className="px-3 py-2 text-center">{item.quantity}</td>
                                                <td className="px-3 py-2 text-right">R$ {item.price.toFixed(2)}</td>
                                                <td className="px-3 py-2 text-right font-medium">R$ {item.subtotal.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                            </div>
                            {selectedOrder.delivery_fee > 0 && (
                                <div className="flex justify-between">
                                    <span>Taxa de entrega:</span>
                                    <span>R$ {selectedOrder.delivery_fee.toFixed(2)}</span>
                                </div>
                            )}
                            {selectedOrder.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Desconto:</span>
                                    <span>- R$ {selectedOrder.discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-base pt-2 border-t">
                                <span>Total:</span>
                                <span>R$ {selectedOrder.total_amount.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Status update */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Atualizar Status</h4>
                            <div className="flex gap-2 flex-wrap">
                                {['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].map((status) => (
                                    <Button
                                        key={status}
                                        size="sm"
                                        variant={selectedOrder.status === status ? 'primary' : 'outline'}
                                        onClick={() => updateOrderStatus(selectedOrder.id, status as OrderStatus)}
                                    >
                                        {getStatusLabel(status)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
