import React from 'react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-12 mt-20">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h4 className="font-bold mb-3">Lalelilo</h4>
                        <p className="text-sm text-gray-400">
                            Moda infantil com amor e qualidade. 30 lojas em todo Brasil.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-3">Links Rápidos</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/products" className="hover:text-white">Produtos</Link></li>
                            <li><Link href="/location" className="hover:text-white">Lojas</Link></li>
                            <li><Link href="/about" className="hover:text-white">Sobre</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-3">Contato</h4>
                        <p className="text-sm text-gray-400">
                            Email: contato@lalelilo.com.br<br />
                            WhatsApp: (81) 8392-0320
                        </p>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-400">
                    © 2026 Noviapp Sistemas IA. Todos os direitos reservados.
                    <div className="mt-2 text-center flex flex-col items-center gap-2">
                        <a
                            href="https://www.noviapp.com.br"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white transition-colors"
                        >
                            www.noviapp.com.br
                        </a>
                        <div className="mt-1">
                            <img src="/noviapp-logo.png" alt="Noviapp Logo" className="h-6 w-auto opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all mx-auto" style={{ filter: 'brightness(0) invert(1)' }} />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
