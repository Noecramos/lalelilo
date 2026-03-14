'use client';

import React, { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Store,
    MessageSquare,
    Users,
    Menu,
    X,
    LogOut,
    Phone,
    Building2
} from 'lucide-react';

export default function GestaoLojasLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ 'manager-id': string }>;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { 'manager-id': managerId } = use(params);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [managerName, setManagerName] = useState('');

    useEffect(() => {
        const fetchManager = async () => {
            try {
                const res = await fetch(`/api/managers?id=${managerId}`);
                const data = await res.json();
                if (data.manager) {
                    setManagerName(data.manager.name || data.manager.username || 'Gerente Regional');
                }
            } catch (e) { console.error(e); }
        };
        fetchManager();
    }, [managerId]);

    const navigation = [
        { name: 'Dashboard', href: `/gestao-lojas/${managerId}`, icon: LayoutDashboard },
        { name: 'Minhas Lojas', href: `/gestao-lojas/${managerId}/lojas`, icon: Store },
        { name: 'Colaboradores', href: `/gestao-lojas/${managerId}/colaboradores`, icon: Users },
        { name: 'Chat Interno', href: `/gestao-lojas/${managerId}/chat`, icon: MessageSquare },
        { name: 'Suporte Novix', href: 'https://wa.me/558183920320', icon: Phone, external: true },
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
                    fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-teal-600 via-teal-700 to-emerald-700
                    transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0
                `}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-white border-opacity-20">
                    <div className="flex items-center gap-3">
                        <div className="bg-white rounded-md p-1.5 shadow-sm">
                            <img src="/lalelilo-logo.jpg" alt="Lalelilo" className="h-9 w-auto object-contain" />
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-white hover:bg-white hover:bg-opacity-20 rounded p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Manager Info */}
                <div className="px-4 py-3 border-b border-white border-opacity-20">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white font-bold">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm truncate">{managerName}</p>
                            <p className="text-white text-opacity-70 text-xs">Gestão de Lojas</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 pb-24 space-y-1 overflow-y-auto" style={{
                    maxHeight: 'calc(100vh - 9rem)',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}>
                    {navigation.map((item) => {
                        const Icon = item.icon;

                        if (item.external) {
                            return (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all mt-4 bg-white text-green-600 font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] text-sm"
                                >
                                    <Icon size={18} />
                                    <span>{item.name}</span>
                                </a>
                            );
                        }

                        const active = isActive(item.href);
                        const linkClass = active
                            ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all bg-white text-gray-800 shadow-md font-semibold'
                            : 'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-white hover:bg-white hover:bg-opacity-20';

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={linkClass}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Noviapp Branding */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white border-opacity-20 text-center bg-emerald-800 pointer-events-none">
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
                        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                            Gestão de Lojas
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900">{managerName}</p>
                            <p className="text-xs text-gray-500">Gerente Regional</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                            {managerName?.charAt(0)?.toUpperCase() || 'G'}
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
