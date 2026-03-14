'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GestaoLojasRedirect() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const findManager = async () => {
            try {
                // Fetch all managers and redirect to the first one
                const res = await fetch('/api/managers');
                const data = await res.json();
                const managers = data.managers || [];

                if (managers.length > 0) {
                    router.replace(`/gestao-lojas/${managers[0].id}`);
                    return;
                }
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        findManager();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500 mx-auto mb-4" />
                    <p className="text-gray-600">Carregando Gestão de Lojas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <p className="text-gray-600">Nenhum gerente regional encontrado.</p>
            </div>
        </div>
    );
}
