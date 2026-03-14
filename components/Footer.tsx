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
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex justify-center flex-wrap gap-4 text-sm text-gray-500">
                        <Link href="/privacy" className="hover:text-lale-pink transition-colors">Privacidade</Link>
                        <span>•</span>
                        <Link href="/terms" className="hover:text-lale-pink transition-colors">Termos de Uso</Link>
                        <span>•</span>
                        <Link href="http://localhost:3001/candidatos" target="_blank" rel="noopener noreferrer" className="hover:text-lale-pink transition-colors font-medium">Trabalhe Conosco</Link>
                    </div>
                    <img src="/noviapp-logo.png" alt="Noviapp" className="h-8 object-contain mt-2" />
                    <p className="text-xs text-gray-500">© 2026 Noviapp AI Systems ®</p>
                </div>
            </div>
        </footer>
    );
}
