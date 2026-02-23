'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Store,
    BarChart3,
    FileText,
    Menu,
    X,
    Crown,
    MessageSquare,
    Phone,
    Trophy,
    ClipboardCheck,
    TicketCheck,
    Users,
    Package,
    LogOut,
    Warehouse,
    Megaphone
} from 'lucide-react';

export default function SuperAdminLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [manualExpanded, setManualExpanded] = useState<Set<string>>(new Set());

    interface NavItem {
        name: string;
        href: string;
        icon: any;
        external?: boolean;
        children?: { name: string; href: string; icon: any }[];
    }

    const navigation: NavItem[] = [
        {
            name: 'Visão Geral', href: '/super-admin', icon: LayoutDashboard,
            children: [
                { name: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
                { name: 'Analytics', href: '/super-admin/analytics', icon: BarChart3 },
                { name: 'Relatórios', href: '/super-admin/reports', icon: FileText },
            ]
        },
        { name: 'Lojas', href: '/super-admin/shops', icon: Store },
        { name: 'Clientes', href: '/super-admin/users', icon: Crown },
        {
            name: 'CRM', href: '/super-admin/crm', icon: Users,
            children: [
                { name: 'Contatos', href: '/super-admin/crm', icon: Users },
                { name: 'Central Msgs', href: '/super-admin/omnichannel', icon: MessageSquare },
                { name: 'Chat Interno', href: '/super-admin/messages', icon: Phone },
                { name: 'Atribuição', href: '/super-admin/crm/assign', icon: Users },
            ]
        },
        { name: 'Marketing', href: '/super-admin/marketing', icon: Megaphone },
        { name: 'Gamificação', href: '/super-admin/gamification', icon: Trophy },
        {
            name: 'Manutenção', href: '/super-admin/checklists', icon: ClipboardCheck,
            children: [
                { name: 'Checklists', href: '/super-admin/checklists', icon: ClipboardCheck },
                { name: 'Tickets', href: '/super-admin/tickets', icon: TicketCheck },
            ]
        },
        {
            name: 'Centro Distrib.', href: '/super-admin/cd', icon: Warehouse,
            children: [
                { name: 'Estoque CD', href: '/super-admin/cd', icon: Warehouse },
                { name: 'Reabastecimento', href: '/super-admin/replenishment', icon: Package },
                { name: 'Produtos', href: '/super-admin/products', icon: Package },
            ]
        },
        { name: 'Suporte Novix', href: 'https://wa.me/558183920320', icon: Phone, external: true },
    ];

    const handleLogout = async () => {
        if (!confirm('Deseja realmente sair?')) return;

        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const isActive = (href: string) => pathname === href;
    const isGroupActive = (item: NavItem) => {
        if (item.children) {
            return item.children.some(c => {
                if (c.href === '/super-admin') return pathname === '/super-admin';
                return pathname === c.href || pathname.startsWith(c.href + '/');
            });
        }
        return pathname === item.href;
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

                {/* Navigation */}
                <nav className="p-4 pb-24 space-y-1 overflow-y-auto" style={{
                    maxHeight: 'calc(100vh - 4rem)',
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
                        const groupActive = isGroupActive(item);
                        const expanded = collapsedGroups.has(item.name) ? false : (groupActive || manualExpanded.has(item.name));

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

                        if (item.children) {
                            const baseBtn = 'w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-white';
                            const btnClass = groupActive
                                ? baseBtn + ' font-semibold'
                                : baseBtn + ' hover:bg-white/10';
                            const btnStyle = groupActive ? { backgroundColor: 'rgba(255,255,255,0.15)' } : undefined;
                            return (
                                <div key={item.name}>
                                    <button onClick={() => {
                                        if (expanded) {
                                            setCollapsedGroups(prev => new Set([...prev, item.name]));
                                            setManualExpanded(prev => { const n = new Set(prev); n.delete(item.name); return n; });
                                        } else {
                                            setCollapsedGroups(prev => { const n = new Set(prev); n.delete(item.name); return n; });
                                            setManualExpanded(prev => new Set([...prev, item.name]));
                                        }
                                    }} className={btnClass} style={btnStyle}>
                                        <div className="flex items-center gap-3">
                                            <Icon size={20} />
                                            <span className="font-medium">{item.name}</span>
                                        </div>
                                        <svg className={'w-4 h-4 transition-transform ' + (expanded ? 'rotate-180' : '')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {expanded && (
                                        <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-white border-opacity-20 pl-3">
                                            {item.children.map((child) => {
                                                const ChildIcon = child.icon;
                                                const childActive = isActive(child.href);
                                                const childClass = childActive
                                                    ? 'flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm bg-white text-gray-800 shadow-md font-semibold'
                                                    : 'flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm text-white/80 hover:bg-white/10';
                                                return (
                                                    <Link key={child.href} href={child.href} className={childClass} onClick={() => setSidebarOpen(false)}>
                                                        <ChildIcon size={16} />
                                                        <span>{child.name}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        const linkClass = isActive(item.href)
                            ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all bg-white text-gray-800 shadow-md font-semibold'
                            : 'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-white hover:bg-white hover:bg-opacity-20';

                        return (
                            <Link key={item.name} href={item.href} className={linkClass} onClick={() => setSidebarOpen(false)}>
                                <Icon size={20} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Noviapp Branding */}
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

                        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
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
