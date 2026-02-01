'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Loading, Modal } from '@/components/ui';
import { MapPin, ShoppingBag, Heart, Star, ChevronRight, User, ShoppingCart, Instagram } from 'lucide-react';
import Link from 'next/link';
import WhatsAppButton from '@/components/WhatsAppButton';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  is_featured: boolean;
  description?: string;
  images?: string[];
  sizes?: string[];
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
      <div className="text-center mb-6 px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Lalelilo Moda Infantil</h1>
        <p className="text-gray-600 mt-2">Roupa de Criança com Amor e Estilo</p>
        <div className="mt-4 flex justify-center">
          <a
            href="https://www.instagram.com/lalelilokids/?hl=pt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 group"
          >
            <Instagram size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="font-semibold text-sm tracking-wide">Siga-nos no Instagram</span>
          </a>
        </div>
      </div>

      {/* Action Icons Row - Below Title */}
      <div className="flex justify-center gap-12 mt-4 mb-8">
        <Link href="/register" title="Cadastre-se">
          <div className="group flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 border border-gray-100 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:text-lale-pink group-hover:border-lale-pink/30">
              <User size={28} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 group-hover:text-lale-pink transition-colors">Conta</span>
          </div>
        </Link>

        <Link href="/cart" title="Carrinho">
          <div className="group flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-lale-orange border border-gray-100 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:text-lale-orange group-hover:border-lale-orange/30">
              <ShoppingCart size={28} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 group-hover:text-lale-orange transition-colors">Carrinho</span>
          </div>
        </Link>
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {products.map((product) => (
              <Card
                key={product.id}
                padding="none"
                hover
                className="overflow-hidden cursor-pointer group"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm hover:bg-white transition-colors"
                    onClick={(e) => { e.stopPropagation(); /* Favorite logic */ }}
                  >
                    <Heart size={14} className="text-gray-600" />
                  </button>
                </div>
                <div className="p-2 md:p-3">
                  <h4 className="font-medium text-gray-900 text-xs md:text-sm truncate mb-1">{product.name}</h4>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-lale-orange text-sm md:text-base">
                      R$ {Number(product.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name}
        size="lg"
      >
        {selectedProduct && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {selectedProduct.images?.slice(0, 3).map((img: string, idx: number) => (
                  <div key={idx} className="aspect-square rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={img} alt={`${selectedProduct.name} ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <p className="text-2xl font-bold text-lale-orange mb-2">
                  R$ {Number(selectedProduct.price).toFixed(2)}
                </p>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Descrição</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedProduct.description || 'Nenhuma descrição disponível.'}
                  </p>
                </div>
                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Tamanhos Disponíveis</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.sizes.map((size: string) => (
                        <span key={size} className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-700">
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 space-y-3">
                <Link href="/cart" className="block" onClick={() => setSelectedProduct(null)}>
                  <Button variant="primary" className="w-full py-3 text-lg">
                    Adicionar ao Carrinho
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" onClick={() => setSelectedProduct(null)}>
                  Continuar Comprando
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

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



      {/* Floating WhatsApp Button */}
      <WhatsAppButton phoneNumber="5581999999999" />
    </div>
  );
}
