'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Loading } from '@/components/ui';
import { User, Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        whatsapp: '',
        address: '',
        city: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('users')
                .insert([formData]);

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 3000);
        } catch (error: any) {
            console.error('Error registering user:', error);
            alert('Erro ao cadastrar: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-lale-bg-pink flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="text-green-600" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro Realizado!</h2>
                    <p className="text-gray-600 mb-6">
                        Obrigado por se cadastrar na Lalelilo. Você será redirecionado para a página inicial em instantes.
                    </p>
                    <Link href="/">
                        <Button variant="primary" className="w-full">
                            Ir para o Início
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-lale-bg-pink py-12 px-4">
            {/* Floating Back Button */}
            <Link href="/">
                <button className="fixed top-4 left-4 z-50 bg-white text-lale-orange rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110">
                    <ArrowLeft size={24} />
                </button>
            </Link>

            <div className="max-w-md mx-auto">

                <Card className="p-8 shadow-xl border-t-4 border-lale-pink">
                    <div className="text-center mb-8">
                        <div className="bg-white rounded-full p-2 inline-block shadow-sm mb-4">
                            <img src="/lalelilo-logo.jpg" alt="Lalelilo" className="w-16 h-16 rounded-full object-cover" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Criar sua conta</h1>
                        <p className="text-gray-500 text-sm mt-1">Junte-se à família Lalelilo</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                            <Input
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Seu nome completo"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="exemplo@email.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                            <Input
                                name="whatsapp"
                                value={formData.whatsapp}
                                onChange={handleChange}
                                placeholder="(81) 99999-9999"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                            <Input
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Sua cidade"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço (Opcional)</label>
                            <Input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Rua, número, bairro..."
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full py-3 mt-6 text-lg font-semibold"
                            disabled={loading}
                        >
                            {loading ? <Loading size="sm" /> : 'Finalizar Cadastro'}
                        </Button>
                    </form>

                    <p className="text-center text-xs text-gray-400 mt-6 italic">
                        Ao se cadastrar, você concorda com nossos termos e condições.
                    </p>
                </Card>
            </div>
        </div>
    );
}
