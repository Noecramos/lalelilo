'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function ShopTicketsPage() {
    const params = useParams();
    const router = useRouter();
    const shopId = params.shopId as string;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button
                    onClick={() => router.push(`/shop-admin/${shopId}`)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft size={20} />
                    Voltar ao Dashboard
                </button>

                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Tickets & Ocorrências</h1>
                    <p className="text-gray-600">
                        Esta página exibirá os tickets e ocorrências da sua loja.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Em desenvolvimento...
                    </p>
                </div>
            </div>
        </div>
    );
}
