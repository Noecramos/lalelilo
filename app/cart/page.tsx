'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function CartPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-lale-bg-pink">
            {/* Header */}
            <header className="bg-gradient-to-r from-lale-pink to-lale-orange text-white">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="outline" size="sm" className="bg-white text-lale-orange border-white/50">
                                <ArrowLeft size={16} className="mr-2" />
                                Voltar
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="bg-white rounded-lg p-1.5 shadow-sm">
                                <img src="/lalelilo-logo.jpg" alt="Lalelilo" className="h-8 md:h-10 w-auto object-contain" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold">Carrinho</h1>
                                <p className="text-sm opacity-90">Seus produtos selecionados</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <Card padding="lg">
                    <div className="text-center py-12">
                        <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Seu carrinho está vazio
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Adicione produtos ao carrinho para continuar
                        </p>
                        <Link href="/products">
                            <Button variant="primary" size="lg">
                                <ShoppingBag size={18} className="mr-2" />
                                Ver Produtos
                            </Button>
                        </Link>
                    </div>
                </Card>

                {/* Quick link to checkout for demo */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 mb-3">
                        Ou veja um exemplo de checkout:
                    </p>
                    <Link href="/checkout">
                        <Button variant="outline">
                            Ver Exemplo de Checkout
                            <ArrowRight size={16} className="ml-2" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Floating WhatsApp Button */}
            <WhatsAppButton phoneNumber="5581999999999" />
        </div>
    );
}
