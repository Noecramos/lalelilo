'use client';

import React, { useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, CreditCard, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WhatsAppButton from '@/components/WhatsAppButton';
import { useCart } from '@/lib/cart-context';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, removeItem, updateQuantity, subtotal, itemCount, clearCart } = useCart();

    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        email: '',
        cpf: '',
        address: '',
        city: '',
        state: 'PE',
        cep: ''
    });

    const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [submitting, setSubmitting] = useState(false);

    // Shop data
    const shopData = {
        name: 'Lalelilo - Loja Centro',
        pix_key: '12.345.678/0001-90',
        pix_name: 'Lalelilo Moda Infantil LTDA'
    };

    const deliveryFee = orderType === 'delivery' ? 10.00 : 0;
    const total = subtotal + deliveryFee;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (items.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }

        if (!customerInfo.name || !customerInfo.phone) {
            alert('Preencha nome e telefone');
            return;
        }

        setSubmitting(true);

        try {
            // Create order via API
            const orderPayload = {
                customer_name: customerInfo.name,
                customer_phone: customerInfo.phone,
                customer_email: customerInfo.email,
                customer_cpf: customerInfo.cpf,
                order_type: orderType,
                payment_method: paymentMethod,
                delivery_address: orderType === 'delivery' ? {
                    address: customerInfo.address,
                    city: customerInfo.city,
                    state: customerInfo.state,
                    cep: customerInfo.cep,
                } : null,
                items: items.map(item => ({
                    product_id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image_url: item.image_url,
                    size: item.size,
                })),
                subtotal,
                delivery_fee: deliveryFee,
                total,
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload),
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMsg = data.details
                    ? `${data.error}: ${data.details}${data.hint ? ` (hint: ${data.hint})` : ''}`
                    : (data.error || 'Erro ao criar pedido');
                throw new Error(errorMsg);
            }

            const orderId = data.order?.id || data.id;

            // If credit/debit card, go to payment page
            if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
                router.push(`/checkout/payment?orderId=${orderId}&amount=${total}&name=${encodeURIComponent(customerInfo.name)}&email=${encodeURIComponent(customerInfo.email)}&cpf=${encodeURIComponent(customerInfo.cpf)}`);
            } else {
                // For PIX/cash, go directly to success
                clearCart();
                router.push(`/checkout/success?orderId=${orderId}`);
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Erro ao realizar pedido: ' + (error instanceof Error ? error.message : String(error)));
            setSubmitting(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-lale-bg-pink">
                <header className="bg-gradient-to-r from-lale-pink to-lale-orange text-white">
                    <div className="container mx-auto px-4 py-6">
                        <h1 className="text-xl md:text-2xl font-bold">Checkout</h1>
                    </div>
                </header>
                <div className="container mx-auto px-4 py-8">
                    <Card padding="lg">
                        <div className="text-center py-12">
                            <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Carrinho vazio</h2>
                            <p className="text-gray-600 mb-6">Adicione produtos antes de fazer checkout</p>
                            <Link href="/"><Button variant="primary" size="lg">Ver Produtos</Button></Link>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-lale-bg-pink">
            {/* Floating Back Button */}
            <Link href="/cart">
                <button className="fixed bottom-4 left-4 z-50 bg-white text-lale-orange rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110">
                    <ArrowLeft size={24} />
                </button>
            </Link>

            {/* Header */}
            <header className="bg-gradient-to-r from-lale-pink to-lale-orange text-white">
                <div className="container mx-auto px-4 py-4 md:py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white rounded-lg p-1.5 shadow-sm">
                                <img src="/lalelilo-logo.jpg" alt="Lalelilo" className="h-8 md:h-10 w-auto object-contain" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold">Checkout</h1>
                                <p className="text-xs md:text-sm opacity-90">{itemCount} itens no carrinho</p>
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
                                    <Input
                                        label="Email"
                                        type="email"
                                        value={customerInfo.email}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                    />
                                    <Input
                                        label="CPF"
                                        value={customerInfo.cpf}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, cpf: e.target.value })}
                                        placeholder="000.000.000-00"
                                    />
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
                                    {[
                                        { key: 'pix', label: 'PIX' },
                                        { key: 'debit_card', label: 'Débito' },
                                        { key: 'credit_card', label: 'Crédito' },
                                        { key: 'cash', label: 'Dinheiro' },
                                    ].map(pm => (
                                        <button
                                            key={pm.key}
                                            type="button"
                                            onClick={() => setPaymentMethod(pm.key)}
                                            className={`p-4 rounded-full border-2 transition-all text-center ${paymentMethod === pm.key
                                                ? 'border-lale-orange bg-orange-50 text-lale-orange font-semibold'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                                }`}
                                        >
                                            <p className="font-semibold">{pm.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </Card>

                            {/* PIX Information */}
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
                                        disabled={items.length === 0}
                                    >
                                        <CreditCard size={18} className="mr-2" />
                                        {paymentMethod === 'credit_card' || paymentMethod === 'debit_card'
                                            ? 'Continuar para Pagamento'
                                            : 'Finalizar Pedido'}
                                    </Button>
                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        Ao finalizar, você concorda com nossos termos de uso
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>

            {/* Floating WhatsApp Button */}
            <WhatsAppButton phoneNumber="5581999999999" />
        </div>
    );
}
