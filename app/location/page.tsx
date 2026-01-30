'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Loading } from '@/components/ui';
import { MapPin, Search, Navigation, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WhatsAppButton from '@/components/WhatsAppButton';

interface Shop {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    phone: string;
    distance?: number;
    is_open: boolean;
}

export default function LocationPage() {
    const router = useRouter();
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedShop, setSelectedShop] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API call
            setTimeout(() => {
                setShops([
                    { id: '1', name: 'Lalelilo Centro', address: 'Rua do Comércio, 123', city: 'Recife', state: 'PE', phone: '(81) 3333-4444', distance: 1.2, is_open: true },
                    { id: '2', name: 'Lalelilo Boa Viagem', address: 'Av. Boa Viagem, 456', city: 'Recife', state: 'PE', phone: '(81) 3333-5555', distance: 3.5, is_open: true },
                    { id: '3', name: 'Lalelilo Shopping', address: 'Shopping Recife, Loja 78', city: 'Recife', state: 'PE', phone: '(81) 3333-6666', distance: 5.8, is_open: true },
                    { id: '4', name: 'Lalelilo Olinda', address: 'Rua do Sol, 789', city: 'Olinda', state: 'PE', phone: '(81) 3333-7777', distance: 8.2, is_open: false },
                    { id: '5', name: 'Lalelilo Jaboatão', address: 'Av. Barreto de Menezes, 321', city: 'Jaboatão', state: 'PE', phone: '(81) 3333-8888', distance: 12.5, is_open: true },
                ]);
                setLoading(false);
            }, 800);
        } catch (error) {
            console.error('Error fetching shops:', error);
            setLoading(false);
        }
    };

    const requestLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    alert('Localização obtida! Ordenando lojas por proximidade...');
                },
                (error) => {
                    alert('Não foi possível obter sua localização');
                }
            );
        }
    };

    const selectShop = (shopId: string) => {
        setSelectedShop(shopId);
        // TODO: Save to localStorage or context
        localStorage.setItem('selectedShop', shopId);
    };

    const confirmSelection = () => {
        if (selectedShop) {
            router.push('/');
        }
    };

    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-lale-bg-pink">
            {/* Header */}
            <header className="bg-gradient-to-r from-lale-pink to-lale-orange text-white">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="outline" size="sm" className="bg-white text-lale-orange border-white/50">
                                <ArrowLeft size={16} className="mr-2" />
                                Voltar
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="bg-white rounded-lg p-1.5 shadow-sm">
                                <img src="/logo.png" alt="Lalelilo" className="h-8 md:h-10 w-auto object-contain" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Lojas</h1>
                                <p className="text-sm opacity-90">Selecione a loja mais próxima para entrega</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {/* Location request */}
                <Card padding="md" className="mb-6 bg-gradient-to-r from-lale-bg-blue to-purple-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                                <Navigation size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Use sua localização</h3>
                                <p className="text-sm text-gray-600">Encontre a loja mais próxima de você</p>
                            </div>
                        </div>
                        <Button variant="primary" onClick={requestLocation}>
                            <Navigation size={16} className="mr-2" />
                            Usar Localização
                        </Button>
                    </div>
                </Card>

                {/* Search */}
                <Card padding="md" className="mb-6">
                    <Input
                        placeholder="Buscar por cidade ou nome da loja..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search size={18} />}
                    />
                </Card>

                {/* Shops list */}
                {loading ? (
                    <Loading size="lg" text="Carregando lojas..." />
                ) : filteredShops.length === 0 ? (
                    <Card padding="lg">
                        <div className="text-center py-12">
                            <MapPin size={48} className="mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-500">Nenhuma loja encontrada</p>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredShops.map((shop) => (
                            <Card
                                key={shop.id}
                                padding="md"
                                hover
                                className={`cursor-pointer transition-all ${selectedShop === shop.id ? 'ring-2 ring-lale-orange bg-lale-orange/10' : ''
                                    }`}
                                onClick={() => selectShop(shop.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold text-gray-900 text-lg">{shop.name}</h3>
                                            {shop.is_open ? (
                                                <Badge variant="success">Aberto</Badge>
                                            ) : (
                                                <Badge variant="danger">Fechado</Badge>
                                            )}
                                            {shop.distance && (
                                                <Badge variant="info">{shop.distance} km</Badge>
                                            )}
                                        </div>
                                        <div className="space-y-1 text-sm text-gray-600">
                                            <p className="flex items-center gap-2">
                                                <MapPin size={14} />
                                                {shop.address}, {shop.city} - {shop.state}
                                            </p>
                                            <p>📞 {shop.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {selectedShop === shop.id && (
                                            <div className="bg-lale-orange text-white rounded-full p-2 mb-2">
                                                <Check size={20} />
                                            </div>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const address = encodeURIComponent(`${shop.address}, ${shop.city} - ${shop.state}`);
                                                window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                                            }}
                                            className="whitespace-nowrap z-10 relative"
                                        >
                                            <Navigation size={14} className="mr-1" />
                                            Como chegar
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Confirm button */}
                {selectedShop && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                        <div className="container mx-auto">
                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full"
                                onClick={confirmSelection}
                            >
                                <Check size={18} className="mr-2" />
                                Confirmar Loja Selecionada
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating WhatsApp Button */}
            <WhatsAppButton phoneNumber="5581999999999" />
        </div >
    );
}
