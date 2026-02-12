'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Package, Home, Receipt, Heart, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function CheckoutSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId');

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        // Trigger confetti animation with Lalelilo colors
        const laleliloPink = '#ff94a4';
        const laleiloOrange = '#ffb950';
        const laleiloGreen = '#a6ce39';

        confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: [laleliloPink, laleiloOrange, laleiloGreen, '#ffffff'],
        });

        // Second burst delayed
        setTimeout(() => {
            confetti({
                particleCount: 60,
                spread: 100,
                origin: { y: 0.5, x: 0.3 },
                colors: [laleliloPink, laleiloOrange],
            });
        }, 300);

        setTimeout(() => {
            confetti({
                particleCount: 60,
                spread: 100,
                origin: { y: 0.5, x: 0.7 },
                colors: [laleiloOrange, laleiloGreen],
            });
        }, 600);

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
            }
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-lale-bg-pink flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lale-orange mx-auto"></div>
                    <p className="mt-4 text-gray-500">Confirmando seu pedido...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-lale-bg-pink via-white to-lale-bg-blue">
            {/* Top Brand Bar */}
            <div className="bg-gradient-to-r from-lale-pink to-lale-orange py-3 px-4">
                <div className="container mx-auto flex items-center justify-center gap-3">
                    <div className="bg-white rounded-lg p-1 shadow-sm">
                        <img src="/lalelilo-logo.jpg" alt="Lalelilo" className="h-6 md:h-7 w-auto object-contain" />
                    </div>
                    <span className="text-white font-semibold text-sm md:text-base">Pedido Confirmado!</span>
                </div>
            </div>

            <div className="py-8 md:py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Success Card */}
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        {/* Decorative gradient bar */}
                        <div className="h-2 bg-gradient-to-r from-lale-pink via-lale-orange to-lale-green"></div>

                        <div className="p-6 md:p-10 text-center">
                            {/* Animated Success Icon */}
                            <div className="mb-6 relative">
                                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-50 rounded-full flex items-center justify-center shadow-inner">
                                    <CheckCircle size={52} className="text-green-500" />
                                </div>
                                {/* Decorative rings */}
                                <div className="absolute inset-0 mx-auto w-24 h-24 rounded-full border-4 border-green-200 animate-ping opacity-20"></div>
                            </div>

                            {/* Success Message */}
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                Pagamento Aprovado! 🎉
                            </h1>
                            <p className="text-gray-500 mb-2 max-w-md mx-auto">
                                Obrigada por comprar na <strong className="text-lale-pink">Lalelilo</strong>!
                            </p>
                            <p className="text-gray-400 text-sm mb-8">
                                Seu pedido foi confirmado e já está sendo preparado com muito carinho 💕
                            </p>

                            {/* Order Details */}
                            <div className="bg-gradient-to-br from-lale-bg-pink to-lale-bg-blue rounded-2xl p-5 md:p-6 mb-8 text-left">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Nº do Pedido</p>
                                        <p className="font-bold text-gray-900 font-mono">
                                            #{orderId?.slice(0, 8).toUpperCase()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Valor Total</p>
                                        <p className="font-bold text-lale-orange text-lg">
                                            R$ {order?.total_amount?.toFixed(2) || '0.00'}
                                        </p>
                                    </div>
                                    {order?.customer_name && (
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cliente</p>
                                            <p className="font-semibold text-gray-900">{order.customer_name}</p>
                                        </div>
                                    )}
                                    {order?.shop && (
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Loja</p>
                                            <p className="font-semibold text-gray-900">{order.shop.name}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Next Steps */}
                            <div className="bg-white rounded-2xl border-2 border-lale-orange/20 p-5 md:p-6 mb-8 text-left">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="p-1.5 bg-lale-orange/10 rounded-lg">
                                        <Package size={18} className="text-lale-orange" />
                                    </div>
                                    Próximos Passos
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-lale-pink/20 text-lale-pink flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Confirmação enviada</p>
                                            <p className="text-xs text-gray-400">Você receberá uma confirmação por WhatsApp</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-lale-orange/20 text-lale-orange flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Preparando com carinho</p>
                                            <p className="text-xs text-gray-400">Nossa equipe está separando seus produtos</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-lale-green/20 text-lale-green flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Entrega / Retirada</p>
                                            <p className="text-xs text-gray-400">Avisaremos quando estiver pronto para entrega ou retirada</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => router.push(`/orders/${orderId}`)}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-lale-pink to-lale-orange text-white rounded-xl hover:opacity-90 transition-opacity font-semibold shadow-md"
                                >
                                    <Receipt size={18} />
                                    Ver Detalhes do Pedido
                                </button>
                                <button
                                    onClick={() => router.push('/')}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                                >
                                    <Home size={18} />
                                    Continuar Comprando
                                </button>
                            </div>

                            {/* WhatsApp Support Link */}
                            <a
                                href="https://wa.me/558183920320?text=Olá! Acabei de fazer um pedido na Lalelilo 🎉"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                            >
                                <MessageCircle size={16} />
                                Falar conosco pelo WhatsApp
                            </a>
                        </div>
                    </div>

                    {/* Thank You Message */}
                    <div className="mt-6 text-center">
                        <div className="inline-flex items-center gap-2 bg-white rounded-full px-5 py-2.5 shadow-sm border border-gray-100">
                            <Heart size={16} className="text-lale-pink" />
                            <p className="text-sm text-gray-600">
                                Obrigada por escolher a <strong className="text-lale-pink">Lalelilo</strong>!
                            </p>
                            <Heart size={16} className="text-lale-pink" />
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="mt-8 text-center pb-8">
                        <img src="/noviapp-logo.png" alt="Noviapp" className="h-5 mx-auto mb-2 object-contain opacity-40" />
                        <p className="text-xs text-gray-400">
                            Pedido realizado em {new Date().toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                            © 2026 Novix Online • Powered by Noviapp AI Systems ®
                        </p>
                    </footer>
                </div>
            </div>

            {/* Floating WhatsApp Button */}
            <WhatsAppButton phoneNumber="5581999999999" />
        </div>
    );
}
