'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Loading } from '@/components/ui';
import { MapPin, ShoppingBag, Heart, Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import WhatsAppButton from '@/components/WhatsAppButton';

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
      const [productsRes, shopsRes] = await Promise.all([
        fetch('/api/products?limit=10'),
        fetch('/api/shops?limit=5')
      ]);

      const productsData = await productsRes.json();
      const shopsData = await shopsRes.json();

      if (productsData.success) {
        setProducts(productsData.products || []);
      }

      if (shopsData.success) {
        setNearbyShops(shopsData.shops || []);
      }

      setLoading(false);
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
      {/* Hero Header with Banner & Logo */}
      <div className="relative mb-16">
        {/* Banner GIF - Optimized for mobile autoplay */}
        <div className="w-full relative shadow-inner overflow-hidden">
          <img
            src="/teaser.gif"
            alt="Lalelilo Teaser"
            className="w-full h-auto object-contain"
          />
          {/* Cart Button (Floating) */}
          <div className="absolute top-4 right-4 z-10">
            <Link href="/cart">
              <Button variant="outline" className="bg-white/90 backdrop-blur-sm text-lale-orange hover:bg-white border-white/50 shadow-sm">
                <ShoppingBag size={18} className="mr-2" />
                Carrinho
              </Button>
            </Link>
          </div>
        </div>

        {/* Overlapping Logo */}
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-white rounded-full p-2 shadow-lg w-32 h-32 md:w-40 md:h-40 flex items-center justify-center border-4 border-white">
            <img
              src="/lalelilo-logo.jpg"
              alt="Lalelilo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Brand Name & Info */}
      <div className="text-center mb-8 px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Lalelilo Moda Infantil</h1>
        <p className="text-gray-600 mt-2">Roupa de Criança com Amor e Estilo</p>
      </div>

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

      {/* Floating WhatsApp Button */}
      <WhatsAppButton phoneNumber="5581999999999" />
    </div>
  );
}
