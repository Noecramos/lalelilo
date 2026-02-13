'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    Package, ArrowLeft, Clock, CheckCircle2, Truck, XCircle,
    MapPin, Phone, Mail, CreditCard, Receipt, Home, MessageCircle
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    pending: { label: 'Pendente', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock },
    confirmed: { label: 'Confirmado', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: CheckCircle2 },
    preparing: { label: 'Em preparo', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: Package },
    shipped: { label: 'Enviado', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', icon: Truck },
    delivered: { label: 'Entregue', color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: CheckCircle2 },
    cancelled: { label: 'Cancelado', color: 'text-red-500', bg: 'bg-red-50 border-red-200', icon: XCircle },
};

const paymentLabels: Record<string, string> = {
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    cash: 'Dinheiro',
    mercado_pago: 'Mercado Pago',
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`/api/orders/${id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Order not found');
            setOrder(data.order);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lale-orange mx-auto"></div>
                    <p className="mt-4 text-gray-500">Carregando pedido...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-white flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <XCircle size={48} className="mx-auto text-red-400 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Pedido não encontrado</h2>
                    <p className="text-gray-500 mb-6">{error || 'Não foi possível carregar o pedido.'}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-lale-orange text-white rounded-xl font-medium hover:bg-[#e8a63e] transition-colors"
                    >
                        Voltar ao início
                    </button>
                </div>
            </div>
        );
    }

    const sc = statusConfig[order.status] || statusConfig.pending;
    const StatusIcon = sc.icon;
    const items = order.items || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-gray-900">Detalhes do Pedido</h1>
                        <p className="text-sm text-gray-500">{order.order_number}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${sc.bg} ${sc.color}`}>
                        <StatusIcon size={14} />
                        {sc.label}
                    </span>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                {/* Status Card */}
                <div className={`rounded-2xl p-5 border-2 ${sc.bg}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-white/80 shadow-sm`}>
                            <StatusIcon size={24} className={sc.color} />
                        </div>
                        <div>
                            <p className={`text-lg font-bold ${sc.color}`}>{sc.label}</p>
                            <p className="text-sm text-gray-500">
                                Pedido realizado em {new Date(order.created_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Package size={18} className="text-lale-orange" />
                            Itens do Pedido ({items.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {items.map((item: any, idx: number) => (
                            <div key={idx} className="px-5 py-4 flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                                    ) : (
                                        <Package size={20} className="text-lale-orange" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                                    {item.size && <p className="text-xs text-gray-400">Tam: {item.size}</p>}
                                    <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                                </div>
                                <p className="font-semibold text-gray-900 whitespace-nowrap">
                                    R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Totals */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>R$ {(order.subtotal || 0).toFixed(2).replace('.', ',')}</span>
                    </div>
                    {order.delivery_fee > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Frete</span>
                            <span>R$ {order.delivery_fee.toFixed(2).replace('.', ',')}</span>
                        </div>
                    )}
                    {order.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>Desconto</span>
                            <span>-R$ {order.discount.toFixed(2).replace('.', ',')}</span>
                        </div>
                    )}
                    <div className="border-t border-gray-100 pt-3 flex justify-between">
                        <span className="text-base font-bold text-gray-900">Total</span>
                        <span className="text-base font-bold text-lale-orange">
                            R$ {(order.total_amount || 0).toFixed(2).replace('.', ',')}
                        </span>
                    </div>
                </div>

                {/* Payment & Delivery Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Payment */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                            <CreditCard size={18} className="text-lale-orange" />
                            Pagamento
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Método</span>
                                <span className="font-medium">{paymentLabels[order.payment_method] || order.payment_method}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status</span>
                                <span className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                                    {order.payment_status === 'paid' ? 'Pago' : order.payment_status === 'pending' ? 'Pendente' : order.payment_status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Delivery */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                            <Truck size={18} className="text-lale-orange" />
                            Entrega
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tipo</span>
                                <span className="font-medium">{order.order_type === 'delivery' ? 'Entrega' : 'Retirada'}</span>
                            </div>
                            {order.customer_address && (
                                <div className="flex items-start gap-2 mt-2 text-gray-600">
                                    <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                                    <p>{order.customer_address}{order.customer_city ? `, ${order.customer_city}` : ''}{order.customer_state ? ` - ${order.customer_state}` : ''}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                        <Receipt size={18} className="text-lale-orange" />
                        Dados do Cliente
                    </h3>
                    <div className="space-y-2 text-sm">
                        {order.customer_name && (
                            <div className="flex items-center gap-2 text-gray-700">
                                <span className="font-medium">{order.customer_name}</span>
                            </div>
                        )}
                        {order.customer_phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Phone size={14} className="text-gray-400" />
                                {order.customer_phone}
                            </div>
                        )}
                        {order.customer_email && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Mail size={14} className="text-gray-400" />
                                {order.customer_email}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                        onClick={() => router.push('/')}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-lale-orange text-white rounded-xl font-medium hover:bg-[#e8a63e] transition-colors shadow-sm"
                    >
                        <Home size={18} />
                        Continuar Comprando
                    </button>
                    <a
                        href="https://wa.me/5581999999999"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-sm"
                    >
                        <MessageCircle size={18} />
                        Falar no WhatsApp
                    </a>
                </div>
            </div>
        </div>
    );
}
