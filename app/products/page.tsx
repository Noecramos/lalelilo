'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Select, Loading, Modal } from '@/components/ui';
import { Search, Heart, Star, ShoppingBag, ArrowLeft, ShoppingCart, Check } from 'lucide-react';
import Link from 'next/link';
import WhatsAppButton from '@/components/WhatsAppButton';
import ImageGallery from '@/components/ImageGallery';
import ShareButton from '@/components/ShareButton';
import { useCart } from '@/lib/cart-context';

interface Product {
    id: string;
    name: string;
    price: number;
    image_url: string;
    images?: string[];
    sizes?: string[];
    description?: string;
    product_type?: string;
    product_tier?: string;
    gender?: string;
    category_id?: string;
    categories?: { name: string } | null;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('featured');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [addedToCart, setAddedToCart] = useState(false);
    const { addItem, itemCount } = useCart();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/products');
            const data = await response.json();

            if (data.success) {
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { value: 'all', label: 'Todas as Categorias' },
        { value: 'vestido', label: 'Vestidos' },
        { value: 'conjunto', label: 'Conjuntos' },
    ];

    // Build categories dynamically from products
    const dynamicCategories = Array.from(new Set(products.map(p => p.product_type).filter(Boolean)));
    const allCategoryOptions = [
        { value: 'all', label: 'Todas as Categorias' },
        ...dynamicCategories.map(cat => ({
            value: cat!,
            label: cat!.charAt(0).toUpperCase() + cat!.slice(1) + 's'
        }))
    ];

    const filteredProducts = products
        .filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || product.product_type === selectedCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'price_asc': return a.price - b.price;
                case 'price_desc': return b.price - a.price;
                case 'name': return a.name.localeCompare(b.name);
                default: return 0;
            }
        });

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
                <div className="container mx-auto px-4 py-4 md:py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto text-center sm:text-left">
                            <div className="flex items-center gap-3">
                                <div className="bg-white rounded-lg p-1.5 shadow-sm">
                                    <img src="/lalelilo-logo.jpg" alt="Lalelilo" className="h-8 md:h-10 w-auto object-contain" />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold">Catálogo</h1>
                                    <p className="text-xs md:text-sm opacity-90">{filteredProducts.length} produtos encontrados</p>
                                </div>
                            </div>
                        </div>
                        <Link href="/cart" className="w-full sm:w-auto">
                            <Button variant="outline" className="bg-white text-lale-orange w-full sm:w-auto border-white/50">
                                <ShoppingCart size={18} className="mr-2" />
                                Carrinho ({itemCount})
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {/* Filters */}
                <Card padding="md" className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            placeholder="Buscar produtos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search size={18} />}
                        />
                        <Select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            options={allCategoryOptions}
                        />
                        <Select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            options={[
                                { value: 'featured', label: 'Destaques' },
                                { value: 'price_asc', label: 'Menor Preço' },
                                { value: 'price_desc', label: 'Maior Preço' },
                                { value: 'name', label: 'Nome A-Z' }
                            ]}
                        />
                    </div>
                </Card>

                {/* Products grid */}
                {loading ? (
                    <div className="py-12">
                        <Loading size="lg" text="Carregando produtos..." />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <Card padding="lg">
                        <div className="text-center py-12">
                            <ShoppingBag size={48} className="mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-500">Nenhum produto encontrado</p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                        {filteredProducts.map((product) => (
                            <Card key={product.id} padding="none" hover className="overflow-hidden cursor-pointer group" onClick={() => setSelectedProduct(product)}>
                                <div className="relative aspect-[3/4] overflow-hidden">
                                    <img
                                        src={product.image_url || '/demo/Image 1.jpg'}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <button
                                        className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm hover:bg-white transition-colors"
                                        onClick={(e) => { e.stopPropagation(); }}
                                    >
                                        <Heart size={14} className="text-gray-600" />
                                    </button>
                                    {product.product_tier && (
                                        <Badge
                                            variant={product.product_tier === 'superpremium' ? 'success' : product.product_tier === 'premium' ? 'info' : 'default'}
                                            className="absolute top-2 left-2"
                                        >
                                            {product.product_tier.charAt(0).toUpperCase() + product.product_tier.slice(1)}
                                        </Badge>
                                    )}
                                </div>
                                <div className="p-2 md:p-3">
                                    <h4 className="font-medium text-gray-900 text-xs md:text-sm truncate mb-1">{product.name}</h4>
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-lale-orange text-sm md:text-base">
                                            R$ {Number(product.price).toFixed(2)}
                                        </p>
                                    </div>
                                    {product.sizes && product.sizes.length > 0 && (
                                        <p className="text-[10px] text-gray-400 mt-1 truncate">
                                            Tam: {product.sizes.join(', ')}
                                        </p>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Detail Modal */}
            <Modal
                isOpen={!!selectedProduct}
                onClose={() => { setSelectedProduct(null); setAddedToCart(false); }}
                title={selectedProduct?.name}
                size="lg"
            >
                {selectedProduct && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Image Gallery */}
                        <ImageGallery
                            images={selectedProduct.images && selectedProduct.images.length > 0
                                ? selectedProduct.images
                                : [selectedProduct.image_url || '/demo/Image 1.jpg']}
                            productName={selectedProduct.name}
                        />

                        {/* Product Details */}
                        <div className="flex flex-col h-full">
                            <div className="flex-1">
                                {/* Price and Share Button Row */}
                                <div className="flex items-start justify-between mb-4">
                                    <p className="text-2xl font-bold text-lale-orange">
                                        R$ {Number(selectedProduct.price).toFixed(2)}
                                    </p>
                                    <ShareButton
                                        type="product"
                                        title={selectedProduct.name}
                                        description={`R$ ${Number(selectedProduct.price).toFixed(2)}`}
                                        imageUrl={selectedProduct.image_url}
                                        variant="icon"
                                    />
                                </div>
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
                                                <span key={size} className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-700 hover:border-lale-orange hover:text-lale-orange transition-colors cursor-pointer">
                                                    {size}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedProduct.gender && selectedProduct.gender !== 'unisex' && (
                                    <div className="mb-4">
                                        <Badge variant={selectedProduct.gender === 'fem' ? 'info' : 'default'}>
                                            {selectedProduct.gender === 'fem' ? '👧 Feminino' : '👦 Masculino'}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 space-y-3">
                                <Button
                                    variant="primary"
                                    className={`w-full py-3 text-lg transition-all ${addedToCart ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                    onClick={() => {
                                        addItem({
                                            id: selectedProduct.id,
                                            name: selectedProduct.name,
                                            price: Number(selectedProduct.price),
                                            image_url: selectedProduct.image_url || '/demo/Image 1.jpg',
                                        });
                                        setAddedToCart(true);
                                        setTimeout(() => setAddedToCart(false), 2000);
                                    }}
                                >
                                    {addedToCart ? (
                                        <><Check size={18} className="mr-2" /> Adicionado!</>
                                    ) : (
                                        <><ShoppingCart size={18} className="mr-2" /> Adicionar ao Carrinho</>
                                    )}
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => { setSelectedProduct(null); setAddedToCart(false); }}>
                                    Continuar Comprando
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Floating WhatsApp Button */}
            <WhatsAppButton phoneNumber="5581999999999" />
        </div>
    );
}
