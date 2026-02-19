'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Loading } from '@/components/ui';
import { MapPin, Search, Navigation, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WhatsAppButton from '@/components/WhatsAppButton';
import ShareButton from '@/components/ShareButton';

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
            const response = await fetch('/api/shops');
            const data = await response.json();

            if (data.success && data.shops) {
                const mappedShops = data.shops.map((shop: any) => ({
                    id: shop.id,
                    name: shop.name,
                    address: shop.address || 'Endereço não informado',
                    city: shop.city || '',
                    state: shop.state || '',
                    phone: shop.whatsapp || shop.phone || '',
                    distance: undefined,
                    is_open: shop.is_active,
                }));
                setShops(mappedShops);
            }
        } catch (error) {
            console.error('Error fetching shops:', error);
        } finally {
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
            {/* Floating Back Button */}
            <Link href="/">
                <button className="fixed bottom-4 left-4 z-50 bg-white text-lale-orange rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110">
                    <ArrowLeft size={24} />
                </button>
            </Link>

            {/* Header */}
            <header className="bg-gradient-to-r from-lale-pink to-lale-orange text-white">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white rounded-lg p-1.5 shadow-sm">
                                <img src="/lalelilo-logo.jpg" alt="Lalelilo" className="h-8 md:h-10 w-auto object-contain" />
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
                                {/* Top Row: Name + Badges */}
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900 text-lg">{shop.name}</h3>
                                    <div className="flex items-center gap-2">
                                        {shop.is_open ? (
                                            <Badge variant="success">Aberto</Badge>
                                        ) : (
                                            <Badge variant="danger">Fechado</Badge>
                                        )}
                                        {shop.distance && (
                                            <Badge variant="info">{shop.distance} km</Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Row: Address/Phone + Buttons */}
                                <div className="flex items-end justify-between gap-4">
                                    <div className="flex-1 space-y-1 text-sm text-gray-600">
                                        <p className="flex items-center gap-2">
                                            <MapPin size={14} />
                                            {shop.address}, {shop.city} - {shop.state}
                                        </p>
                                        <p>📞 {shop.phone}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="z-10 relative"
                                        >
                                            <ShareButton
                                                type="shop"
                                                title={shop.name}
                                                description={`${shop.address}, ${shop.city} - ${shop.state}\n📞 ${shop.phone}`}
                                                variant="icon"
                                            />
                                        </div>
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

                                {/* Selected Indicator */}
                                {selectedShop === shop.id && (
                                    <div className="absolute top-4 right-4 bg-lale-orange text-white rounded-full p-2">
                                        <Check size={16} />
                                    </div>
                                )}
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
