'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/super-admin') || pathname?.startsWith('/shop-admin');
    const isCheckout = pathname?.startsWith('/checkout');
    const isNovix = pathname?.startsWith('/novix');
    const isAuth = pathname === '/login' || pathname === '/register';

    if (isAdmin || isCheckout || isNovix || isAuth) return null;

    return (
        <footer className="py-6 mt-12">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center gap-2 text-center">
                    <img src="/noviapp-logo.png" alt="Noviapp" className="h-6 object-contain opacity-60" />
                    <p className="text-xs text-gray-400">© 2026 Novix Online • Powered by Noviapp AI Systems ®</p>
                </div>
            </div>
        </footer>
    );
}
