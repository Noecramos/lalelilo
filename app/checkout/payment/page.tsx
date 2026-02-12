'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentForm from '@/components/PaymentForm';
import { ShoppingBag, ArrowLeft, CheckCircle, XCircle, Shield, Lock } from 'lucide-react';
import Link from 'next/link';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function CheckoutPaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            setErrorMessage('Nenhum pedido especificado');
            return;
        }

        // Fetch order details
        fetchOrder();
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const response = await fetch(`/api/orders/${orderId}`);
            if (response.ok) {
                const data = await response.json();
                // API returns { success: true, order: {...} }
                setOrder(data.order || data);
            } else {
                setErrorMessage('Pedido não encontrado');
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            setErrorMessage('Erro ao carregar pedido');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = (paymentId: string) => {
        setPaymentStatus('success');
        // Redirect to success page after 2 seconds
        setTimeout(() => {
            router.push(`/checkout/success?orderId=${orderId}&paymentId=${paymentId}`);
        }, 2000);
    };

    const handlePaymentError = (error: string) => {
        setPaymentStatus('error');
        setErrorMessage(error);
        // Reset after 5 seconds
        setTimeout(() => {
            setPaymentStatus('idle');
            setErrorMessage('');
        }, 5000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-lale-bg-pink flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lale-orange mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando seu pedido...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-lale-bg-pink flex items-center justify-center px-4">
                <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                    <div className="bg-white rounded-lg p-2 inline-block mb-6 shadow-sm border border-gray-100">
                        <img src="/lalelilo-logo.jpg" alt="Lalelilo" className="h-10 w-auto object-contain" />
                    </div>
                    <XCircle size={48} className="text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido não encontrado</h1>
                    <p className="text-gray-600 mb-6">{errorMessage}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-gradient-to-r from-lale-pink to-lale-orange text-white rounded-lg hover:opacity-90 transition-opacity font-semibold shadow-md"
                    >
                        Voltar ao Início
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-lale-bg-pink">
            {/* Floating Back Button */}
            <button
                onClick={() => router.back()}
                className="fixed bottom-4 left-4 z-50 bg-white text-lale-orange rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110"
            >
                <ArrowLeft size={24} />
            </button>

            {/* Header */}
            <header className="bg-gradient-to-r from-lale-pink to-lale-orange text-white">
                <div className="container mx-auto px-4 py-4 md:py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white rounded-lg p-1.5 shadow-sm">
                                <img src="/lalelilo-logo.jpg" alt="Lalelilo" className="h-8 md:h-10 w-auto object-contain" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold">Pagamento Seguro</h1>
                                <p className="text-xs md:text-sm opacity-90 flex items-center gap-1">
                                    <Lock size={12} />
                                    Seus dados estão protegidos
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 md:py-8">
                <div className="max-w-5xl mx-auto">
                    <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
                        {/* Payment Form Column */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Card header */}
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Shield size={20} className="text-lale-orange" />
                                        Dados do Cartão
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Insira os dados do seu cartão de crédito</p>
                                </div>

                                <div className="p-6">
                                    {paymentStatus === 'success' && (
                                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-pulse">
                                            <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-green-900">Pagamento Aprovado! 🎉</p>
                                                <p className="text-sm text-green-700 mt-1">
                                                    Redirecionando para confirmação...
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {paymentStatus === 'error' && (
                                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                            <XCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-red-900">Erro no Pagamento</p>
                                                <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                                                <p className="text-xs text-red-500 mt-2">Tente novamente em instantes...</p>
                                            </div>
                                        </div>
                                    )}

                                    {paymentStatus === 'idle' && (
                                        <PaymentForm
                                            amount={order.total_amount || 0}
                                            orderId={order.id}
                                            customerName={order.customer_name || 'Cliente'}
                                            customerEmail={order.customer_email || 'cliente@example.com'}
                                            customerDocument={order.customer_document}
                                            onSuccess={handlePaymentSuccess}
                                            onError={handlePaymentError}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Security Badges */}
                            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Lock size={12} /> SSL Seguro
                                </span>
                                <span className="flex items-center gap-1">
                                    <Shield size={12} /> Dados Criptografados
                                </span>
                            </div>
                        </div>

                        {/* Order Summary Column */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                                {/* Summary header */}
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <ShoppingBag size={20} className="text-lale-pink" />
                                        Resumo do Pedido
                                    </h2>
                                </div>

                                <div className="p-6">
                                    {/* Order items */}
                                    <div className="space-y-3 mb-4">
                                        {order.items?.map((item: any, index: number) => (
                                            <div key={index} className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    {item.quantity}x {item.name}
                                                </span>
                                                <span className="font-medium text-gray-900">R$ {item.price?.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Totals */}
                                    <div className="border-t border-gray-100 pt-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span>R$ {order.subtotal?.toFixed(2)}</span>
                                        </div>
                                        {order.delivery_fee > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Taxa de Entrega</span>
                                                <span>R$ {order.delivery_fee?.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-100">
                                            <span>Total</span>
                                            <span className="text-lale-orange">R$ {order.total_amount?.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Shop Info */}
                                    {order.shop && (
                                        <div className="mt-6 pt-4 border-t border-gray-100">
                                            <p className="text-xs text-gray-400 mb-1">Loja</p>
                                            <p className="font-semibold text-gray-900">{order.shop.name}</p>
                                        </div>
                                    )}

                                    {/* Order number */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-400 mb-1">Nº do Pedido</p>
                                        <p className="font-mono text-sm font-semibold text-gray-600">
                                            #{orderId?.slice(0, 8).toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Lalelilo Trust Message */}
                            <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
                                <img src="/lalelilo-logo.jpg" alt="Lalelilo" className="h-8 mx-auto mb-2 object-contain" />
                                <p className="text-xs text-gray-400">
                                    Lalelilo Moda Infantil • Compra 100% segura
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-8 py-6 text-center border-t border-gray-100 bg-white">
                <div className="container mx-auto px-4">
                    <img src="/noviapp-logo.png" alt="Noviapp" className="h-5 mx-auto mb-2 object-contain opacity-40" />
                    <p className="text-xs text-gray-400">
                        © 2026 Novix Online • Powered by Noviapp AI Systems ®
                    </p>
                </div>
            </footer>

            {/* Floating WhatsApp Button */}
            <WhatsAppButton phoneNumber="5581999999999" />
        </div>
    );
}
