'use client';

import React, { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, ArrowUpDown, Tag, Box, Plus, X, Save, AlertCircle } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    barcode: string | null;
    price: number;
    cost_price: number | null;
    compare_at_price: number | null;
    description: string | null;
    image_url: string | null;
    is_active: boolean;
    category_id: string | null;
    sizes: string[] | null;
    colors: string[] | null;
    product_type: string | null;
    product_tier: string | null;
    gender: string | null;
    created_at: string;
    updated_at: string;
}

const CLIENT_ID = 'acb4b354-728f-479d-915a-c857d27da9ad';

const SIZES_OPTIONS = ['RN', 'P', 'M', 'G', 'GG', '1', '2', '3', '4', '6', '8', '10', '12', '14', '16', '18', '20'];
const COLORS_OPTIONS = ['Branco', 'Preto', 'Azul', 'Rosa', 'Vermelho', 'Amarelo', 'Verde', 'Lilás', 'Laranja', 'Cinza', 'Marrom', 'Bege', 'Marinho', 'Coral', 'Estampado'];
const PRODUCT_TYPES = ['Roupa', 'Calçado', 'Acessório', 'Brinquedo', 'Kit', 'Enxoval', 'Outro'];
const PRODUCT_TIERS = ['Básico', 'Premium', 'Luxo'];
const GENDERS = [
    { value: 'unisex', label: 'Unissex' },
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Feminino' },
];

const emptyForm = {
    name: '',
    description: '',
    price: '',
    cost_price: '',
    compare_at_price: '',
    sku: '',
    barcode: '',
    image_url: '',
    sizes: [] as string[],
    colors: [] as string[],
    product_type: '',
    product_tier: '',
    gender: 'unisex',
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'sku' | 'created_at'>('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [filterSource, setFilterSource] = useState<'all' | 'microvix' | 'manual'>('all');

    // New Product Modal
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

    function slugify(text: string) {
        return text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 80);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!form.name.trim()) { setError('Nome é obrigatório'); return; }
        if (!form.price || parseFloat(form.price) <= 0) { setError('Preço é obrigatório e deve ser maior que zero'); return; }

        setSaving(true);
        try {
            const slug = slugify(form.name);
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: CLIENT_ID,
                    name: form.name.trim(),
                    slug,
                    description: form.description.trim() || null,
                    price: parseFloat(form.price),
                    cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
                    compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
                    sku: form.sku.trim() || null,
                    barcode: form.barcode.trim() || null,
                    image_url: form.image_url.trim() || null,
                    sizes: form.sizes.length > 0 ? form.sizes : [],
                    colors: form.colors.length > 0 ? form.colors : [],
                    product_type: form.product_type || null,
                    product_tier: form.product_tier || null,
                    gender: form.gender || 'unisex',
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Erro ao cadastrar produto');
            } else {
                setSuccess('Produto cadastrado com sucesso!');
                setForm({ ...emptyForm });
                fetchProducts();
                setTimeout(() => {
                    setShowModal(false);
                    setSuccess('');
                }, 1500);
            }
        } catch (err) {
            setError('Erro de conexão. Tente novamente.');
        }
        setSaving(false);
    }

    function toggleSize(size: string) {
        setForm(f => ({
            ...f,
            sizes: f.sizes.includes(size)
                ? f.sizes.filter(s => s !== size)
                : [...f.sizes, size]
        }));
    }

    function toggleColor(color: string) {
        setForm(f => ({
            ...f,
            colors: f.colors.includes(color)
                ? f.colors.filter(c => c !== color)
                : [...f.colors, color]
        }));
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
                        Produtos sincronizados do ERP Microvix e cadastros manuais
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setShowModal(true); setError(''); setSuccess(''); }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-medium shadow-md hover:shadow-lg"
                    >
                        <Plus size={16} />
                        Novo Produto
                    </button>
                    <button
                        onClick={fetchProducts}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        <RefreshCw size={16} />
                        Atualizar
                    </button>
                </div>
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
                                        Tamanhos
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
                                            {product.compare_at_price != null && product.compare_at_price > product.price && (
                                                <p className="text-xs text-gray-400 line-through">
                                                    {formatPrice(product.compare_at_price)}
                                                </p>
                                            )}
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
                                            {product.sizes && product.sizes.length > 0 ? (
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {product.sizes.slice(0, 4).map(s => (
                                                        <span key={s} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{s}</span>
                                                    ))}
                                                    {product.sizes.length > 4 && (
                                                        <span className="text-xs text-gray-400">+{product.sizes.length - 4}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-300">—</span>
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

            {/* ══════ NEW PRODUCT MODAL ══════ */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 pt-8">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative animate-in fade-in slide-in-from-bottom-4"
                        style={{ animation: 'slideUp 0.3s ease-out' }}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Plus className="text-purple-600" size={22} />
                                    Cadastrar Novo Produto
                                </h2>
                                <p className="text-sm text-gray-500 mt-0.5">Campos com * são obrigatórios</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Alerts */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                                    <Save size={16} />
                                    {success}
                                </div>
                            )}

                            {/* Section: Info Básica */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
                                    Informações Básicas
                                </h3>

                                {/* Nome */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nome do Produto <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="Ex: Conjunto Verão Infantil"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                {/* Descrição */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descrição
                                    </label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        placeholder="Descrição do produto..."
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                    />
                                </div>
                            </div>

                            {/* Section: Preços */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
                                    Preços
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Preço de Venda <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={form.price}
                                                onChange={e => setForm({ ...form, price: e.target.value })}
                                                placeholder="0,00"
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Preço de Custo
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={form.cost_price}
                                                onChange={e => setForm({ ...form, cost_price: e.target.value })}
                                                placeholder="0,00"
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Preço Comparativo
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={form.compare_at_price}
                                                onChange={e => setForm({ ...form, compare_at_price: e.target.value })}
                                                placeholder="De: 0,00"
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Códigos */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
                                    Identificação
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                                        <input
                                            type="text"
                                            value={form.sku}
                                            onChange={e => setForm({ ...form, sku: e.target.value })}
                                            placeholder="Ex: LAL-001"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                                        <input
                                            type="text"
                                            value={form.barcode}
                                            onChange={e => setForm({ ...form, barcode: e.target.value })}
                                            placeholder="EAN-13"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Classificação */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
                                    Classificação
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                        <select
                                            value={form.product_type}
                                            onChange={e => setForm({ ...form, product_type: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                        >
                                            <option value="">Selecionar...</option>
                                            {PRODUCT_TYPES.map(t => (
                                                <option key={t} value={t.toLowerCase()}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Linha</label>
                                        <select
                                            value={form.product_tier}
                                            onChange={e => setForm({ ...form, product_tier: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                        >
                                            <option value="">Selecionar...</option>
                                            {PRODUCT_TIERS.map(t => (
                                                <option key={t} value={t.toLowerCase()}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
                                        <select
                                            value={form.gender}
                                            onChange={e => setForm({ ...form, gender: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                        >
                                            {GENDERS.map(g => (
                                                <option key={g.value} value={g.value}>{g.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Tamanhos */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
                                    Tamanhos Disponíveis
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {SIZES_OPTIONS.map(size => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => toggleSize(size)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${form.sizes.includes(size)
                                                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section: Cores */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
                                    Cores Disponíveis
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS_OPTIONS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => toggleColor(color)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${form.colors.includes(color)
                                                    ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300 hover:bg-pink-50'
                                                }`}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section: Imagem */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
                                    Imagem
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
                                    <input
                                        type="url"
                                        value={form.image_url}
                                        onChange={e => setForm({ ...form, image_url: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </form>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Cadastrar Produto
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Animation keyframes */}
            <style jsx>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
