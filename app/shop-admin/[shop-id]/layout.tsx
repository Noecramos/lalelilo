'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Settings,
    Menu,
    X,
    Store,
    MessageSquare,
    Users,
    Phone,
    LogOut,
    Truck,
    Megaphone
} from 'lucide-react';

export default function ShopAdminLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ 'shop-id': string }>;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { 'shop-id': shopId } = use(params);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: `/shop-admin/${shopId}`, icon: LayoutDashboard },
        { name: 'Pedidos', href: `/shop-admin/${shopId}/orders`, icon: ShoppingBag },
        { name: 'Clientes', href: `/shop-admin/${shopId}/users`, icon: Users },
        { name: 'Estoque', href: `/shop-admin/${shopId}/inventory`, icon: Package },
        { name: 'Reabastecimento', href: `/shop-admin/${shopId}/replenishment`, icon: Truck },
        { name: 'Marketing', href: `/shop-admin/${shopId}/marketing`, icon: Megaphone },
        { name: 'Mensagens', href: `/shop-admin/${shopId}/messages`, icon: MessageSquare },
        { name: 'Configurações', href: `/shop-admin/${shopId}/settings`, icon: Settings },
        { name: 'Suporte Whats', href: 'https://wa.me/558183920320', icon: Phone, external: true },
    ];

    const handleLogout = async () => {
        if (!confirm('Deseja realmente sair?')) return;

        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const isActive = (href: string) => pathname === href;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                    <div className="flex items-center justify-center w-full">
                        <img src="/lalelilo-logo.jpg" alt="Lalelilo" className="h-10 w-auto object-contain" />
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        if (item.external) {
                            return (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-green-50 hover:text-green-600 mt-4 border border-gray-100"
                                >
                                    <Icon size={20} className="text-green-500" />
                                    <span className="font-medium">{item.name}</span>
                                </a>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                  ${active
                                        ? 'bg-lale-orange text-white shadow-md'
                                        : 'text-gray-700 hover:bg-lale-bg-pink hover:text-lale-orange'
                                    }
                `}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Noviapp Branding */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 text-center">
                    <div className="text-xs text-gray-500">
                        <img src="/noviapp-logo.png" alt="Noviapp" className="h-5 mx-auto mb-2 opacity-50 grayscale hover:grayscale-0 transition-all" />
                        <p>© 2026 Novix Online • Powered by Noviapp AI Systems ®</p>
                        <a href="https://www.noviapp.com.br" target="_blank" rel="noopener noreferrer" className="block mt-1 text-lale-orange hover:underline">
                            www.noviapp.com.br
                        </a>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden text-gray-500 hover:text-gray-700"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex-1 lg:flex-none">
                        <h1 className="text-xl font-semibold text-gray-900">
                            Painel da Loja
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-lale-orange flex items-center justify-center text-white font-medium shadow-sm">
                            A
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
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
