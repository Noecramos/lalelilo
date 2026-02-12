'use client';

import React, { useState } from 'react';
import { CreditCard, Lock, Calendar, Shield } from 'lucide-react';

interface PaymentFormProps {
    amount: number;
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerDocument?: string;
    onSuccess: (paymentId: string) => void;
    onError: (error: string) => void;
}

export default function PaymentForm({
    amount,
    orderId,
    customerName,
    customerEmail,
    customerDocument = '',
    onSuccess,
    onError,
}: PaymentFormProps) {
    const [loading, setLoading] = useState(false);
    const [cardData, setCardData] = useState({
        number: '',
        holderName: '',
        expirationMonth: '',
        expirationYear: '',
        securityCode: '',
    });
    const [expirationInput, setExpirationInput] = useState(''); // Raw input value
    const [installments, setInstallments] = useState(1);

    // Format card number with spaces
    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\s/g, '');
        const chunks = cleaned.match(/.{1,4}/g);
        return chunks ? chunks.join(' ') : cleaned;
    };

    // Handle card number input
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\s/g, '');
        if (value.length <= 16 && /^\d*$/.test(value)) {
            setCardData({ ...cardData, number: value });
        }
    };

    // Handle expiration input
    const handleExpirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

        // Limit to 4 digits
        if (value.length > 4) {
            value = value.slice(0, 4);
        }

        // Format as MM/YY
        let formatted = value;
        if (value.length >= 2) {
            formatted = value.slice(0, 2) + '/' + value.slice(2);
        }

        setExpirationInput(formatted);

        // Update card data
        const month = value.slice(0, 2);
        const year = value.slice(2, 4);
        setCardData({
            ...cardData,
            expirationMonth: month,
            expirationYear: year ? '20' + year : '',
        });
    };

    // Handle CVV input
    const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 4) {
            setCardData({ ...cardData, securityCode: value });
        }
    };

    // Validate form
    const isFormValid = () => {
        return (
            cardData.number.length === 16 &&
            cardData.holderName.length >= 3 &&
            cardData.expirationMonth.length === 2 &&
            cardData.expirationYear.length === 4 &&
            cardData.securityCode.length >= 3 &&
            parseInt(cardData.expirationMonth) >= 1 &&
            parseInt(cardData.expirationMonth) <= 12
        );
    };

    // Submit payment
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isFormValid()) {
            onError('Por favor, preencha todos os campos corretamente');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    amount,
                    customerId: customerEmail,
                    customerName,
                    customerEmail,
                    customerDocument: customerDocument || '00000000000',
                    card: cardData,
                    installments,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                onSuccess(data.payment.id);
            } else {
                onError(data.error || data.payment?.message || 'Erro ao processar pagamento');
            }
        } catch (error) {
            console.error('Payment error:', error);
            onError('Erro ao conectar com o servidor. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Calculate installment options (up to 12x for amounts > R$ 30)
    const maxInstallments = amount >= 30 ? Math.min(12, Math.floor(amount / 5)) : 1;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card Number */}
            <div>
                <label htmlFor="card-number" className="block text-sm font-semibold text-gray-700 mb-2">
                    Número do Cartão
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <CreditCard size={20} className="text-gray-400" />
                    </div>
                    <input
                        id="card-number"
                        name="cardNumber"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        value={formatCardNumber(cardData.number)}
                        onChange={handleCardNumberChange}
                        placeholder="1234 5678 9012 3456"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg tracking-wider"
                        required
                    />
                </div>
            </div>

            {/* Cardholder Name */}
            <div>
                <label htmlFor="card-holder" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome no Cartão
                </label>
                <input
                    id="card-holder"
                    name="cardHolder"
                    type="text"
                    autoComplete="cc-name"
                    value={cardData.holderName}
                    onChange={(e) => setCardData({ ...cardData, holderName: e.target.value.toUpperCase() })}
                    placeholder="NOME COMO NO CARTÃO"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                    required
                />
            </div>

            {/* Expiration and CVV */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="card-expiry" className="block text-sm font-semibold text-gray-700 mb-2">
                        Validade
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Calendar size={18} className="text-gray-400" />
                        </div>
                        <input
                            id="card-expiry"
                            name="cardExpiry"
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            value={expirationInput}
                            onChange={handleExpirationChange}
                            placeholder="MM/AA"
                            maxLength={5}
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="card-cvv" className="block text-sm font-semibold text-gray-700 mb-2">
                        CVV
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock size={18} className="text-gray-400" />
                        </div>
                        <input
                            id="card-cvv"
                            name="cardCvv"
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            value={cardData.securityCode}
                            onChange={handleCVVChange}
                            placeholder="123"
                            maxLength={4}
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Installments */}
            {maxInstallments > 1 && (
                <div>
                    <label htmlFor="installments" className="block text-sm font-semibold text-gray-700 mb-2">
                        Parcelas
                    </label>
                    <select
                        id="installments"
                        name="installments"
                        value={installments}
                        onChange={(e) => setInstallments(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        {Array.from({ length: maxInstallments }, (_, i) => i + 1).map((num) => (
                            <option key={num} value={num}>
                                {num}x de R$ {(amount / num).toFixed(2)}
                                {num === 1 ? ' à vista' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Shield size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                    <p className="font-semibold">Pagamento 100% Seguro</p>
                    <p className="text-xs mt-1">
                        Seus dados são criptografados e protegidos. Não armazenamos informações do cartão.
                    </p>
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={!isFormValid() || loading}
                className={`w-full py-4 rounded-lg font-bold text-white transition-all ${!isFormValid() || loading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                    }`}
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Processando...
                    </span>
                ) : (
                    `Pagar R$ ${amount.toFixed(2)}`
                )}
            </button>

            {/* Test Cards Info (only in development) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <p className="font-semibold">🧪 Cartões de Teste:</p>
                    <p>Aprovado: 4012 0010 3714 1112</p>
                    <p>Recusado: 4012 0010 3844 3335</p>
                    <p>CVV: 123 | Validade: 12/28</p>
                </div>
            )}
        </form>
    );
}
