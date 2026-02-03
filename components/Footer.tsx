'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/super-admin') || pathname?.startsWith('/shop-admin');

    if (isAdmin) return null;

    return (
        <footer className="bg-gray-50 border-t border-gray-200 py-4 mt-12">
            <div className="container mx-auto px-4">
                <div className="text-center text-xs text-gray-500">
                    <p>© 2026 Noviapp Sistemas IA. Todos os direitos reservados.</p>
                    <div className="mt-2 flex flex-col items-center gap-1">
                        <a
                            href="https://www.noviapp.com.br"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-lale-orange transition-colors"
                        >
                            www.noviapp.com.br
                        </a>
                        <img
                            src="/noviapp-logo.png"
                            alt="Noviapp Logo"
                            className="h-4 w-auto opacity-40 hover:opacity-70 transition-opacity"
                        />
                    </div>
                </div>
            </div>
        </footer>
    );
}
