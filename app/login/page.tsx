'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

export default function LoginPage() {
    const [identifier, setIdentifier] = useState(''); // shop slug or super-admin
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!identifier || !password) {
            alert('Por favor, preencha todos os campos');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Redirect based on role
                if (data.role === 'super_admin') {
                    router.push('/super-admin');
                } else if (data.role === 'shop') {
                    router.push(`/shop-admin/${data.slug}`);
                }
            } else {
                alert(data.error || 'Credenciais inválidas');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Erro ao fazer login. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!identifier) {
            alert('Por favor, preencha o identificador da loja para recuperar sua senha.');
            return;
        }

        if (!confirm('Deseja receber uma nova senha no email cadastrado?')) {
            return;
        }

        setForgotPasswordLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                alert(`Nova senha enviada para ${data.email}. Verifique sua caixa de entrada.`);
            } else {
                alert(data.error || 'Erro ao processar solicitação');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            alert('Erro de conexão. Tente novamente.');
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col items-center justify-center py-8 px-4">
            {/* Logo */}
            <div className="mb-8">
                <img
                    src="/lalelilo-logo.jpg"
                    alt="Lalelilo"
                    className="h-20 w-auto object-contain rounded-lg shadow-md"
                />
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-fade-in-up">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Bem-vindo(a)</h1>
                    <p className="text-gray-600 mt-2">Faça login para continuar</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {/* Identifier Input */}
                    <div>
                        <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
                            Identificador da Loja
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User size={20} className="text-gray-400" />
                            </div>
                            <input
                                id="identifier"
                                name="identifier"
                                type="text"
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-2 border-gray-200 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                                placeholder="Ex: lalelilo-shopping-barra"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value.toLowerCase().trim())}
                                required
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                            Senha
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock size={20} className="text-gray-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                className="w-full pl-12 pr-12 py-4 bg-gray-50 rounded-xl border-2 border-gray-200 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <div className="flex justify-end mt-2">
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                disabled={forgotPasswordLoading}
                                className="text-xs text-purple-600 font-semibold hover:text-purple-700 hover:underline disabled:opacity-50"
                            >
                                {forgotPasswordLoading ? 'Enviando...' : 'Esqueceu sua senha?'}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <img src="/noviapp-logo.png" alt="Noviapp" className="h-5 mx-auto mb-2 opacity-40" />
                    <p className="text-xs text-gray-500">
                        © 2026 Novix Online • Powered by Noviapp AI Systems ®
                    </p>
                </div>
            </div>
        </div>
    );
}
