'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import Image from 'next/image';

export default function NovixLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const handleLogout = async () => {
        if (!confirm('Deseja realmente sair?')) return;

        await fetch('/api/novix/auth/logout', { method: 'POST' });
        router.push('/novix-login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <Image
                                src="/noviapp-logo.png"
                                alt="Noviapp"
                                width={40}
                                height={40}
                                className="rounded-lg"
                            />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Novix Online</h1>
                                <p className="text-xs text-gray-500">SaaS Manager</p>
                            </div>
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-900">Platform Manager</p>
                                <p className="text-xs text-gray-500">Noviapp</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Sair"
                            >
                                <LogOut size={18} />
                                <span className="hidden sm:inline">Sair</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="mt-auto py-6 text-center">
                <img src="/noviapp-logo.png" alt="Noviapp" className="h-5 mx-auto mb-2 opacity-40" />
                <p className="text-sm text-gray-500">© 2026 Novix Online • Powered by Noviapp AI Systems ®</p>
            </footer>
        </div>
    );
}
