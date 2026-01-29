'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Loading } from '@/components/ui';
import { MapPin, ShoppingBag, Heart, Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  is_featured: boolean;
}

interface Shop {
  id: string;
  name: string;
  city: string;
  distance?: number;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      setTimeout(() => {
        setProducts([
          { id: '1', name: 'Vestido Infantil Rosa', price: 75.00, image_url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500&q=80', category: 'Vestidos', is_featured: true },
          { id: '2', name: 'Conjunto Infantil Azul', price: 89.90, image_url: 'https://images.unsplash.com/photo-1519238263496-6323a72b0c3f?w=500&q=80', category: 'Conjuntos', is_featured: true },
          { id: '3', name: 'Calça Jeans Infantil', price: 65.00, image_url: 'https://images.unsplash.com/photo-1519238806043-5131e1cadd52?w=500&q=80', category: 'Calças', is_featured: true },
          { id: '4', name: 'Camiseta Básica Branca', price: 35.00, image_url: 'https://images.unsplash.com/photo-1519457431-44cd6e6962f3?w=500&q=80', category: 'Camisetas', is_featured: true },
          { id: '5', name: 'Vestido Floral Verão', price: 82.00, image_url: 'https://images.unsplash.com/photo-1471286174826-bba928a3036a?w=500&q=80', category: 'Vestidos', is_featured: true },
          { id: '6', name: 'Shorts Jeans Kids', price: 45.00, image_url: 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=500&q=80', category: 'Shorts', is_featured: true }
        ]);

        setNearbyShops([
          { id: '1', name: 'Lalelilo Centro', city: 'Recife', distance: 1.2 },
          { id: '2', name: 'Lalelilo Boa Viagem', city: 'Recife', distance: 3.5 },
          { id: '3', name: 'Lalelilo Shopping', city: 'Recife', distance: 5.8 }
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading size="lg" text="Carregando produtos..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-lale-bg-pink">
      {/* Header */}
      <header className="bg-gradient-to-r from-lale-pink to-lale-orange text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg p-2 shadow-sm">
                <img src="/logo.png" alt="Lalelilo" className="h-10 md:h-12 w-auto object-contain" />
              </div>
            </div>
            <Link href="/cart">
              <Button variant="outline" className="bg-white text-lale-orange hover:bg-gray-50 border-white/50">
                <ShoppingBag size={18} className="mr-2" />
                Carrinho (0)
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Location selector */}
      <section className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-lale-teal" />
              <span className="text-sm text-gray-600">
                {selectedLocation ? `Entrega em: ${selectedLocation}` : 'Escolha sua localização'}
              </span>
            </div>
            <Link href="/location">
              <Button size="sm" variant="outline">
                Alterar
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Hero section */}
      <section className="bg-lale-bg-blue">
        <div className="w-full">
          <Link href="/products">
            <img
              src="/banner.png"
              alt="Liquida Férias - Até 70% OFF"
              className="w-full h-auto object-cover hover:opacity-95 transition-opacity cursor-pointer"
            />
          </Link>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-900">Produtos em Destaque</h3>
            <Link href="/products" className="text-lale-orange hover:text-[#ff9a30] font-medium">
              Ver todos →
            </Link>
          </div>

          {/* Category Pills */}
          <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
            {[
              { name: 'Vestidos', icon: '👗' },
              { name: 'Conjuntos', icon: '👕' },
              { name: 'Calças', icon: '👖' },
              { name: 'Camisetas', icon: '👚' },
              { name: 'Shorts', icon: '🩳' },
              { name: 'Acessórios', icon: '🎀' },
              { name: 'Sapatos', icon: '👟' }
            ].map((cat) => (
              <button
                key={cat.name}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-100 rounded-full shadow-sm hover:shadow-md hover:border-lale-pink transition-all whitespace-nowrap group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="font-medium text-gray-700 group-hover:text-lale-pink">{cat.name}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} padding="none" hover className="overflow-hidden">
                <div className="relative">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-64 object-cover"
                  />
                  <button className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors">
                    <Heart size={18} className="text-gray-600" />
                  </button>
                  {product.is_featured && (
                    <Badge
                      variant="warning"
                      className="absolute top-3 left-3"
                    >
                      Destaque
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                  <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-lale-orange">
                      R$ {product.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs text-gray-600">4.8</span>
                    </div>
                  </div>
                  <Link href="/checkout">
                    <Button variant="primary" className="w-full mt-3">
                      Adicionar ao Carrinho
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby shops */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Lojas Próximas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nearbyShops.map((shop) => (
              <Card key={shop.id} padding="md" hover>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{shop.name}</h4>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin size={14} />
                      {shop.city}
                    </p>
                  </div>
                  {shop.distance && (
                    <Badge variant="info">{shop.distance} km</Badge>
                  )}
                </div>
                <Link href={`/shop/${shop.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Ver Loja
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
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
                WhatsApp: (81) 99999-9999
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-400">
            © 2026 Lalelilo. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
