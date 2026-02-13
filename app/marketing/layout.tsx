'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Megaphone, BarChart3, Settings,
    Menu, X, LogOut, LayoutDashboard
} from 'lucide-react';

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Campanhas', href: '/marketing', icon: Megaphone },
        { name: 'Relatórios', href: '/marketing/reports', icon: BarChart3 },
        { name: 'Configurações', href: '/marketing/settings', icon: Settings },
    ];

    const isActive = (href: string) => pathname === href;

    const handleLogout = async () => {
        if (!confirm('Deseja realmente sair?')) return;
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

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
                    fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-purple-700 via-purple-800 to-pink-700
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

                {/* Section label */}
                <div className="px-4 pt-4 pb-2">
                    <p className="text-xs font-semibold text-white text-opacity-50 uppercase tracking-wider">Marketing Hub</p>
                </div>

                {/* Navigation */}
                <nav className="px-4 pb-8 space-y-1 overflow-y-auto" style={{
                    maxHeight: 'calc(100vh - 16rem)',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}>
                    <style jsx>{`
                        nav::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                                    ${active
                                        ? 'bg-white text-gray-800 shadow-md font-semibold'
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

                    {/* Super Admin link */}
                    <a
                        href="/super-admin"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-white text-opacity-60 hover:bg-white hover:bg-opacity-20 mt-4 border border-white border-opacity-20"
                    >
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Super Admin</span>
                    </a>
                </nav>

                {/* Noviapp Branding — Standard footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white border-opacity-20 text-center bg-pink-800 pointer-events-none">
                    <div className="bg-white/20 rounded-lg p-3 text-xs text-white pointer-events-auto">
                        <img src="/noviapp-logo.png" alt="Noviapp" className="h-5 mx-auto mb-2 opacity-90" style={{ filter: 'brightness(0) invert(1)' }} />
                        <p>© 2026 Novix Online • Powered by Noviapp AI Systems ®</p>
                        <a href="https://www.noviapp.com.br" target="_blank" rel="noopener noreferrer" className="block mt-1 text-white hover:underline">
                            www.noviapp.com.br
                        </a>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between gap-3 px-4 lg:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-500 hover:text-gray-700 flex-shrink-0"
                        >
                            <Menu size={24} />
                        </button>

                        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <Megaphone size={22} className="text-lale-pink" />
                            Marketing Hub
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900">Marketing</p>
                            <p className="text-xs text-gray-500">Lalelilo Brasil</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-lale-pink to-lale-orange flex items-center justify-center text-white font-bold">
                            M
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
