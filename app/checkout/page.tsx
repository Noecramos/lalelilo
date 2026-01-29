'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Select, Badge } from '@/components/ui';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, CreditCard, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
}

export default function CheckoutPage() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItem[]>([
        { id: '1', name: 'Vestido Infantil Rosa', price: 75.00, quantity: 2, image_url: 'https://via.placeholder.com/100x100/FFB6C1/FFFFFF?text=Vestido' },
        { id: '2', name: 'Conjunto Infantil Azul', price: 89.90, quantity: 1, image_url: 'https://via.placeholder.com/100x100/87CEEB/FFFFFF?text=Conjunto' }
    ]);

    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: 'PE',
        cep: ''
    });

    const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [submitting, setSubmitting] = useState(false);

    // Mock shop data - TODO: Fetch from API
    const shopData = {
        name: 'Lalelilo - Loja Centro',
        pix_key: '12.345.678/0001-90',
        pix_name: 'Lalelilo Moda Infantil LTDA'
    };

    const updateQuantity = (id: string, delta: number) => {
        setCartItems(items =>
            items.map(item =>
                item.id === id
                    ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                    : item
            )
        );
    };

    const removeItem = (id: string) => {
        setCartItems(items => items.filter(item => item.id !== id));
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = orderType === 'delivery' ? 10.00 : 0;
    const total = subtotal + deliveryFee;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // TODO: Replace with actual API call
            setTimeout(() => {
                alert('Pedido realizado com sucesso!');
                router.push('/order-success');
            }, 2000);
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Erro ao realizar pedido');
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-lale-bg-pink">
            {/* Header */}
            <header className="bg-gradient-to-r from-lale-pink to-lale-orange text-white">
                <div className="container mx-auto px-4 py-4 md:py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <Link href="/products">
                            <Button variant="outline" size="sm" className="bg-white text-lale-orange border-white/50">
                                <ArrowLeft size={16} className="mr-2" />
                                Voltar
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="bg-white rounded-lg p-1.5 shadow-sm">
                                <img src="/logo.png" alt="Lalelilo" className="h-8 md:h-10 w-auto object-contain" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold">Checkout</h1>
                                <p className="text-xs md:text-sm opacity-90">{cartItems.length} itens no carrinho</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left column - Forms */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Cart items */}
                            <Card title="Itens do Pedido" padding="md">
                                {cartItems.length === 0 ? (
                                    <div className="text-center py-8">
                                        <ShoppingBag size={48} className="mx-auto text-gray-400 mb-3" />
                                        <p className="text-gray-500">Seu carrinho está vazio</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {cartItems.map((item) => (
                                            <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pb-4 border-b border-gray-200 last:border-0">
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="w-20 h-20 object-cover rounded-lg"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                                    <p className="text-sm text-gray-600">R$ {item.price.toFixed(2)}</p>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            className="p-2 rounded hover:bg-gray-100"
                                                        >
                                                            <Minus size={16} />
                                                        </button>
                                                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="p-2 rounded hover:bg-gray-100"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>
                                                    <p className="font-bold text-gray-900">
                                                        R$ {(item.price * item.quantity).toFixed(2)}
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
                                )}
                            </Card>

                            {/* Order type */}
                            <Card title="Tipo de Pedido" padding="md">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setOrderType('delivery')}
                                        className={`p-4 rounded-lg border-2 transition-all ${orderType === 'delivery'
                                            ? 'border-lale-orange bg-orange-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <MapPin size={24} className="mx-auto mb-2 text-lale-orange" />
                                        <p className="font-semibold">Entrega</p>
                                        <p className="text-xs text-gray-600">R$ 10,00</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOrderType('pickup')}
                                        className={`p-4 rounded-lg border-2 transition-all ${orderType === 'pickup'
                                            ? 'border-lale-orange bg-orange-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <ShoppingBag size={24} className="mx-auto mb-2 text-lale-orange" />
                                        <p className="font-semibold">Retirada</p>
                                        <p className="text-xs text-gray-600">Grátis</p>
                                    </button>
                                </div>
                            </Card>

                            {/* Customer info */}
                            <Card title="Informações do Cliente" padding="md">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Nome Completo"
                                        value={customerInfo.name}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Telefone/WhatsApp"
                                        value={customerInfo.phone}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                        required
                                    />
                                    <div className="md:col-span-2">
                                        <Input
                                            label="Email"
                                            type="email"
                                            value={customerInfo.email}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                        />
                                    </div>
                                    {orderType === 'delivery' && (
                                        <>
                                            <div className="md:col-span-2">
                                                <Input
                                                    label="Endereço Completo"
                                                    value={customerInfo.address}
                                                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <Input
                                                label="Cidade"
                                                value={customerInfo.city}
                                                onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                                                required
                                            />
                                            <Input
                                                label="CEP"
                                                value={customerInfo.cep}
                                                onChange={(e) => setCustomerInfo({ ...customerInfo, cep: e.target.value })}
                                                required
                                            />
                                        </>
                                    )}
                                </div>
                            </Card>

                            {/* Payment method */}
                            <Card title="Forma de Pagamento" padding="md">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('pix')}
                                        className={`p-4 rounded-full border-2 transition-all text-center ${paymentMethod === 'pix'
                                            ? 'border-lale-orange bg-orange-50 text-lale-orange font-semibold'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            }`}
                                    >
                                        <p className="font-semibold">PIX</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('debit')}
                                        className={`p-4 rounded-full border-2 transition-all text-center ${paymentMethod === 'debit'
                                            ? 'border-[#ffa944] bg-orange-50 text-[#ffa944] font-semibold'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            }`}
                                    >
                                        <p className="font-semibold">Débito</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('credit')}
                                        className={`p-4 rounded-full border-2 transition-all text-center ${paymentMethod === 'credit'
                                            ? 'border-[#ffa944] bg-orange-50 text-[#ffa944] font-semibold'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            }`}
                                    >
                                        <p className="font-semibold">Crédito</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`p-4 rounded-full border-2 transition-all text-center ${paymentMethod === 'cash'
                                            ? 'border-[#ffa944] bg-orange-50 text-[#ffa944] font-semibold'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            }`}
                                    >
                                        <p className="font-semibold">Dinheiro</p>
                                    </button>
                                </div>
                            </Card>

                            {/* PIX Information - Show when PIX is selected */}
                            {paymentMethod === 'pix' && shopData.pix_key && (
                                <Card title="Informações para Pagamento PIX" padding="md">
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-green-500 text-white p-3 rounded-full">
                                                <CreditCard size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-green-900">Pague com PIX</h4>
                                                <p className="text-sm text-green-700">Pagamento instantâneo e seguro</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 bg-white p-4 rounded-lg">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Chave PIX</p>
                                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                    <p className="font-mono font-bold text-gray-900">{shopData.pix_key}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(shopData.pix_key);
                                                            alert('Chave PIX copiada!');
                                                        }}

                                                        className="text-lale-orange hover:text-[#ff9a30] font-semibold text-sm"
                                                    >
                                                        Copiar
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Favorecido</p>
                                                <p className="font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                    {shopData.pix_name}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Valor a Pagar</p>
                                                <p className="text-2xl font-bold text-green-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                    R$ {total.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-xs text-yellow-800">
                                                <strong>⚠️ Importante:</strong> Após realizar o pagamento, clique em "Finalizar Pedido" para confirmar.
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Right column - Summary */}
                        <div className="lg:col-span-1">
                            <Card title="Resumo do Pedido" padding="md" className="lg:sticky lg:top-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Taxa de entrega</span>
                                        <span className="font-medium">
                                            {deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2)}`}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-lg">Total</span>
                                            <span className="font-bold text-2xl text-lale-orange">
                                                R$ {total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        className="w-full mt-4"
                                        isLoading={submitting}
                                        disabled={cartItems.length === 0}
                                    >
                                        <CreditCard size={18} className="mr-2" />
                                        Finalizar Pedido
                                    </Button>
                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        Ao finalizar, você concorda com nossos termos de uso
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </form>
            </div >
        </div >
    );
}
