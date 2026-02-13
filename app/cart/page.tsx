'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { ShoppingBag, ArrowLeft, ArrowRight, Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import WhatsAppButton from '@/components/WhatsAppButton';
import { useCart } from '@/lib/cart-context';

export default function CartPage() {
    const router = useRouter();
    const { items, removeItem, updateQuantity, subtotal, itemCount } = useCart();

    return (
        <div className="min-h-screen bg-lale-bg-pink">
            {/* Floating Back Button */}
            <Link href="/">
                <button className="fixed bottom-4 left-4 z-50 bg-white text-lale-orange rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110">
                    <ArrowLeft size={24} />
                </button>
            </Link>

            {/* Header */}
            <header className="bg-gradient-to-r from-lale-pink to-lale-orange text-white">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white rounded-lg p-1.5 shadow-sm">
                                <img src="/lalelilo-logo.jpg" alt="Lalelilo" className="h-8 md:h-10 w-auto object-contain" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold">Carrinho</h1>
                                <p className="text-sm opacity-90">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {items.length === 0 ? (
                    <Card padding="lg">
                        <div className="text-center py-12">
                            <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Seu carrinho está vazio
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Adicione produtos ao carrinho para continuar
                            </p>
                            <Link href="/">
                                <Button variant="primary" size="lg">
                                    <ShoppingBag size={18} className="mr-2" />
                                    Ver Produtos
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cart Items */}
                        <div className="lg:col-span-2">
                            <Card padding="md">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Itens do Pedido</h2>
                                <div className="space-y-4">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pb-4 border-b border-gray-200 last:border-0">
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-20 h-20 object-cover rounded-lg"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                                {item.size && <p className="text-xs text-gray-500">Tam: {item.size}</p>}
                                                <p className="text-sm text-gray-600">R$ {Number(item.price).toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                        className="p-2 rounded hover:bg-gray-100 disabled:opacity-30"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-2 rounded hover:bg-gray-100"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                                <p className="font-bold text-gray-900">
                                                    R$ {(Number(item.price) * item.quantity).toFixed(2)}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-red-500 hover:text-red-700 p-2"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <Card padding="md" className="lg:sticky lg:top-4">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Resumo</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
                                        <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Frete</span>
                                        <span className="text-green-600 font-medium">A calcular</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-lg">Total</span>
                                            <span className="font-bold text-2xl text-lale-orange">
                                                R$ {subtotal.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="w-full mt-4"
                                        onClick={() => router.push('/checkout')}
                                    >
                                        Finalizar Compra
                                        <ArrowRight size={18} className="ml-2" />
                                    </Button>
                                    <Link href="/" className="block">
                                        <Button variant="outline" className="w-full">
                                            Continuar Comprando
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating WhatsApp Button */}
            <WhatsAppButton phoneNumber="5581999999999" />
        </div>
    );
}
