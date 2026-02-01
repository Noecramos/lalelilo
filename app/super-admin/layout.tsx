'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Store,
    BarChart3,
    FileText,
    Menu,
    X,
    Crown,
    MessageSquare,
    Phone
} from 'lucide-react';

export default function SuperAdminLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Visão Geral', href: '/super-admin', icon: LayoutDashboard },
        { name: 'Lojas', href: '/super-admin/shops', icon: Store },
        { name: 'Clientes', href: '/super-admin/users', icon: Crown },
        { name: 'Mensagens', href: '/super-admin/messages', icon: MessageSquare },
        { name: 'Analytics', href: '/super-admin/analytics', icon: BarChart3 },
        { name: 'Relatórios', href: '/super-admin/reports', icon: FileText },
        { name: 'Suporte', href: 'https://wa.me/558183920320', icon: Phone, external: true },
    ];

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
          fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-lale-pink to-lale-orange
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-white border-opacity-20">
                    <div className="flex items-center justify-center w-full">
                        <div className="bg-white rounded-md p-1.5 shadow-sm">
                            <img src="/lalelilo-logo.jpg" alt="Lalelilo" className="h-10 w-auto object-contain" />
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-white hover:bg-white hover:bg-opacity-20 rounded p-1"
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
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-green-400 hover:bg-white hover:bg-opacity-20 mt-4 border border-green-400 border-opacity-30 bg-white bg-opacity-5"
                                >
                                    <Icon size={20} className="text-green-400" />
                                    <span className="font-medium">{item.name}</span>
                                </a>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                  ${active
                                        ? 'bg-white text-lale-orange shadow-md'
                                        : 'text-white hover:bg-white hover:bg-opacity-20'
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
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white border-opacity-20 text-center">
                    <div className="bg-white/10 rounded-lg p-3 text-xs text-white/80">
                        <p>© 2026 Noviapp Sistemas IA.</p>
                        <p>Todos os direitos reservados.</p>
                        <a href="https://www.noviapp.com.br" target="_blank" rel="noopener noreferrer" className="block my-1 text-white hover:underline">
                            www.noviapp.com.br
                        </a>
                        <img src="/noviapp-logo.png" alt="Noviapp" className="h-4 mx-auto mt-2 opacity-70" style={{ filter: 'brightness(0) invert(1)' }} />
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
                            Painel Super Admin
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900">Admin Master</p>
                            <p className="text-xs text-gray-500">Lalelilo Brasil</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-lale-pink to-lale-orange flex items-center justify-center text-white font-bold">
                            L
                        </div>
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
