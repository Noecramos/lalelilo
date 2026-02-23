'use client';

import React, { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, ArrowUpDown, Tag, Box } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    barcode: string | null;
    price: number;
    cost_price: number | null;
    description: string | null;
    image_url: string | null;
    is_active: boolean;
    category_id: string | null;
    sizes: string[] | null;
    colors: string[] | null;
    product_type: string | null;
    gender: string | null;
    created_at: string;
    updated_at: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'sku' | 'created_at'>('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [filterSource, setFilterSource] = useState<'all' | 'microvix' | 'manual'>('all');

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        try {
            const res = await fetch('/api/products?limit=500');
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || data || []);
            }
        } catch (e) {
            console.error('Failed to fetch products', e);
        }
        setLoading(false);
    }

    const filtered = products
        .filter(p => {
            const matchSearch = !search ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
                (p.barcode || '').toLowerCase().includes(search.toLowerCase());

            const matchSource = filterSource === 'all' ||
                (filterSource === 'microvix' && p.sku?.startsWith('MV-')) ||
                (filterSource === 'manual' && !p.sku?.startsWith('MV-'));

            return matchSearch && matchSource;
        })
        .sort((a, b) => {
            let cmp = 0;
            if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
            else if (sortBy === 'price') cmp = a.price - b.price;
            else if (sortBy === 'sku') cmp = (a.sku || '').localeCompare(b.sku || '');
            else if (sortBy === 'created_at') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            return sortDir === 'asc' ? cmp : -cmp;
        });

    const microvixCount = products.filter(p => p.sku?.startsWith('MV-')).length;
    const manualCount = products.filter(p => !p.sku?.startsWith('MV-')).length;
    const avgPrice = products.length > 0 ? products.reduce((s, p) => s + p.price, 0) / products.length : 0;

    const toggleSort = (col: typeof sortBy) => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('asc'); }
    };

    const formatPrice = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="text-purple-600" />
                        Catálogo de Produtos
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Produtos sincronizados do ERP Microvix
                    </p>
                </div>
                <button
                    onClick={fetchProducts}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                    <RefreshCw size={16} />
                    Atualizar
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Package size={14} />
                        Total Produtos
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Box size={14} />
                        Do Microvix
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{microvixCount}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Tag size={14} />
                        Manuais
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{manualCount}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Tag size={14} />
                        Preço Médio
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatPrice(avgPrice)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, SKU ou código de barras..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterSource('all')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterSource === 'all' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Todos ({products.length})
                        </button>
                        <button
                            onClick={() => setFilterSource('microvix')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterSource === 'microvix' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Microvix ({microvixCount})
                        </button>
                        <button
                            onClick={() => setFilterSource('manual')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterSource === 'manual' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Manuais ({manualCount})
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <RefreshCw className="animate-spin mx-auto mb-3 text-purple-500" size={32} />
                        <p className="text-gray-500">Carregando produtos...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package className="mx-auto mb-3 text-gray-300" size={48} />
                        <p className="text-gray-500">Nenhum produto encontrado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => toggleSort('sku')}>
                                        <div className="flex items-center gap-1">
                                            SKU <ArrowUpDown size={12} />
                                        </div>
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => toggleSort('name')}>
                                        <div className="flex items-center gap-1">
                                            Produto <ArrowUpDown size={12} />
                                        </div>
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Referência
                                    </th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => toggleSort('price')}>
                                        <div className="flex items-center gap-1 justify-end">
                                            Preço <ArrowUpDown size={12} />
                                        </div>
                                    </th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Origem
                                    </th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                {product.sku || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                                                {product.description && (
                                                    <p className="text-xs text-gray-400 mt-0.5">{product.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-500">{product.barcode || '—'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="font-semibold text-gray-900 text-sm">
                                                {formatPrice(product.price)}
                                            </span>
                                            {product.cost_price != null && product.cost_price > 0 && (
                                                <p className="text-xs text-gray-400">
                                                    Custo: {formatPrice(product.cost_price)}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {product.sku?.startsWith('MV-') ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                    <Box size={10} /> ERP
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                    <Tag size={10} /> Manual
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                                                title={product.is_active ? 'Ativo' : 'Inativo'} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer */}
                {filtered.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
                        Mostrando {filtered.length} de {products.length} produtos
                    </div>
                )}
            </div>
        </div>
    );
}
