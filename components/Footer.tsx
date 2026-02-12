'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/super-admin') || pathname?.startsWith('/shop-admin');

    if (isAdmin) return null;

    return (
        <footer className="py-6 mt-12">
            <div className="container mx-auto px-4">
                <div className="text-center text-xs text-gray-400">
                    <p>© 2026 Novix Online • Powered by Noviapp</p>
                </div>
            </div>
        </footer>
    );
}
