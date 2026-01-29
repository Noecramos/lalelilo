'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Select, Loading } from '@/components/ui';
import { Search, Filter, Heart, Star, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    price: number;
    image_url: string;
    category: string;
    stock: number;
    rating: number;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('featured');

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, sortBy]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API call
            setTimeout(() => {
                const allProducts = [
                    { id: '1', name: 'Vestido Infantil Rosa', price: 75.00, image_url: 'https://images.pexels.com/photos/3661349/pexels-photo-3661349.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Vestidos', stock: 15, rating: 4.8 },
                    { id: '2', name: 'Conjunto Infantil Azul', price: 89.90, image_url: 'https://images.pexels.com/photos/11003460/pexels-photo-11003460.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Conjuntos', stock: 12, rating: 4.9 },
                    { id: '3', name: 'Calça Jeans Infantil', price: 65.00, image_url: 'https://images.pexels.com/photos/1598104/pexels-photo-1598104.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Calças', stock: 20, rating: 4.7 },
                    { id: '4', name: 'Camiseta Básica Branca', price: 35.00, image_url: 'https://images.pexels.com/photos/2292919/pexels-photo-2292919.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Camisetas', stock: 30, rating: 4.6 },
                    { id: '5', name: 'Vestido Floral Verão', price: 82.00, image_url: 'https://images.pexels.com/photos/9383617/pexels-photo-9383617.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Vestidos', stock: 8, rating: 4.9 },
                    { id: '6', name: 'Shorts Jeans Kids', price: 45.00, image_url: 'https://images.pexels.com/photos/5560019/pexels-photo-5560019.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Shorts', stock: 18, rating: 4.5 },
                    { id: '7', name: 'Conjunto Moletom', price: 95.00, image_url: 'https://images.pexels.com/photos/6349547/pexels-photo-6349547.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Conjuntos', stock: 10, rating: 4.8 },
                    { id: '8', name: 'Vestido Princesa', price: 120.00, image_url: 'https://images.pexels.com/photos/1619655/pexels-photo-1619655.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Vestidos', stock: 5, rating: 5.0 },
                ];
                setProducts(allProducts);
                setLoading(false);
            }, 800);
        } catch (error) {
            console.error('Error fetching products:', error);
            setLoading(false);
        }
    };

    const categories = [
        { value: 'all', label: 'Todas as Categorias' },
        { value: 'Vestidos', label: 'Vestidos' },
        { value: 'Conjuntos', label: 'Conjuntos' },
        { value: 'Calças', label: 'Calças' },
        { value: 'Camisetas', label: 'Camisetas' },
        { value: 'Shorts', label: 'Shorts' }
    ];

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-lale-bg-pink">
            {/* Header */}
            <header className="bg-gradient-to-r from-lale-pink to-lale-orange text-white">
                <div className="container mx-auto px-4 py-4 md:py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto text-center sm:text-left">
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
                                    <h1 className="text-xl md:text-2xl font-bold">Catálogo</h1>
                                    <p className="text-xs md:text-sm opacity-90">{filteredProducts.length} produtos encontrados</p>
                                </div>
                            </div>
                        </div>
                        <Link href="/cart" className="w-full sm:w-auto">
                            <Button variant="outline" className="bg-white text-lale-orange w-full sm:w-auto border-white/50">
                                <ShoppingBag size={18} className="mr-2" />
                                Carrinho (0)
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
                            options={categories}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
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
                                    {product.stock < 10 && (
                                        <Badge variant="danger" className="absolute top-3 left-3">
                                            Últimas unidades!
                                        </Badge>
                                    )}
                                </div>
                                <div className="p-4">
                                    <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h4>
                                    <div className="flex items-center gap-1 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={14}
                                                className={i < Math.floor(product.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                                            />
                                        ))}
                                        <span className="text-xs text-gray-600 ml-1">({product.rating})</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xl font-bold text-lale-orange">
                                            R$ {product.price.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500">{product.stock} em estoque</p>
                                    </div>
                                    <Link href="/checkout">
                                        <Button variant="primary" className="w-full">
                                            <ShoppingBag size={16} className="mr-2" />
                                            Adicionar ao Carrinho
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
