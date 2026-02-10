'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import {
    Wrench, Zap, Laptop, Building2, Armchair, Thermometer,
    Droplet, Shield, Paintbrush, Sparkles, Package, DoorOpen,
    AlertTriangle, Clock, CheckCircle2, User, Filter, ArrowUpCircle,
    ArrowDownCircle, MinusCircle, ChevronRight, Plus, MessageSquare
} from 'lucide-react';

const CLIENT_ID = 'acb4b354-728f-479d-915a-c857d27da9ad';

interface Ticket {
    id: string;
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    category: string;
    shop_id: string;
    assigned_to: string | null;
    created_at: string;
    updated_at: string;
    shops?: { name: string };
    assigned_user?: { name: string };
}

const categories = [
    { id: 'eletrica', label: 'Elétrica', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { id: 'tecnologia', label: 'Tecnologia', icon: Laptop, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'estrutura', label: 'Estrutura', icon: Building2, color: 'text-gray-600', bg: 'bg-gray-50' },
    { id: 'mobiliario', label: 'Mobiliário', icon: Armchair, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'climatizacao', label: 'Climatização', icon: Thermometer, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { id: 'hidraulica', label: 'Hidráulica', icon: Droplet, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'seguranca', label: 'Segurança', icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'pintura', label: 'Pintura', icon: Paintbrush, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'limpeza', label: 'Limpeza Especial', icon: Sparkles, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'equipamentos', label: 'Equipamentos', icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'portas_janelas', label: 'Portas/Janelas', icon: DoorOpen, color: 'text-teal-600', bg: 'bg-teal-50' },
    { id: 'outros', label: 'Outros', icon: Wrench, color: 'text-gray-500', bg: 'bg-gray-50' },
];

const priorityConfig = {
    critical: { label: 'Crítica', color: 'bg-red-100 text-red-700', icon: ArrowUpCircle, sla: '4h' },
    high: { label: 'Alta', color: 'bg-orange-100 text-orange-700', icon: ArrowUpCircle, sla: '24h' },
    medium: { label: 'Média', color: 'bg-yellow-100 text-yellow-700', icon: MinusCircle, sla: '3d' },
    low: { label: 'Baixa', color: 'bg-green-100 text-green-700', icon: ArrowDownCircle, sla: '7d' },
};

const statusConfig = {
    open: { label: 'Aberto', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
    in_progress: { label: 'Em Andamento', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
    resolved: { label: 'Resolvido', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
    closed: { label: 'Fechado', color: 'text-gray-500', bg: 'bg-gray-50', icon: CheckCircle2 },
};

export default function MaintenancePage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedPriority, setSelectedPriority] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('open');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tickets?action=list&client_id=${CLIENT_ID}`);
            const data = await res.json();
            setTickets(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
        try {
            await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_status', ticketId, ...updates }),
            });
            fetchTickets();
        } catch (e) {
            console.error(e);
        }
    };

    // Filter tickets
    let filtered = tickets;
    if (selectedCategory !== 'all') filtered = filtered.filter(t => t.category === selectedCategory);
    if (selectedPriority !== 'all') filtered = filtered.filter(t => t.priority === selectedPriority);
    if (selectedStatus !== 'all') filtered = filtered.filter(t => t.status === selectedStatus);

    // Sort by priority (critical first)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const countByCategory = (cat: string) => tickets.filter(t => t.category === cat && t.status !== 'closed').length;
    const countByPriority = (p: string) => tickets.filter(t => t.priority === p && t.status !== 'closed').length;
    const countByStatus = (s: string) => tickets.filter(t => t.status === s).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lale-orange" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Wrench className="text-lale-orange" size={32} />
                    Manutenção - Central de Intervenções
                </h1>
                <p className="text-gray-500 mt-1">Gerencie solicitações de manutenção por prioridade e categoria</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {Object.entries(statusConfig).map(([key, cfg]) => {
                    const StatusIcon = cfg.icon;
                    const count = countByStatus(key);
                    return (
                        <button
                            key={key}
                            onClick={() => setSelectedStatus(selectedStatus === key ? 'all' : key)}
                            className={`p-4 rounded-xl border-2 transition-all ${selectedStatus === key ? 'ring-2 ring-lale-orange ring-offset-2' : ''
                                } ${cfg.bg} border-gray-200 hover:shadow-md`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <StatusIcon size={16} className={cfg.color} />
                                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{count}</p>
                        </button>
                    );
                })}
            </div>

            {/* Category Tabs */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Filtrar por Categoria</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedCategory === 'all'
                                ? 'bg-lale-orange text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        Todas ({tickets.filter(t => t.status !== 'closed').length})
                    </button>
                    {categories.map(cat => {
                        const CatIcon = cat.icon;
                        const count = countByCategory(cat.id);
                        if (count === 0) return null;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${selectedCategory === cat.id
                                        ? 'bg-lale-orange text-white shadow-md'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                    }`}
                            >
                                <CatIcon size={14} />
                                {cat.label} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Priority Filter */}
            <div className="mb-6 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Prioridade:</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedPriority('all')}
                        className={`px-3 py-1 rounded-md text-xs font-medium ${selectedPriority === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        Todas
                    </button>
                    {Object.entries(priorityConfig).map(([key, cfg]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedPriority(selectedPriority === key ? 'all' : key)}
                            className={`px-3 py-1 rounded-md text-xs font-medium ${selectedPriority === key ? cfg.color : 'bg-gray-100 text-gray-600'
                                }`}
                        >
                            {cfg.label} ({countByPriority(key)})
                        </button>
                    ))}
                </div>
            </div>

            {/* Tickets List */}
            <Card padding="none">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                        {filtered.length} {filtered.length === 1 ? 'Ticket' : 'Tickets'}
                        {selectedCategory !== 'all' && ` - ${categories.find(c => c.id === selectedCategory)?.label}`}
                    </h3>
                </div>
                {filtered.length === 0 ? (
                    <div className="px-5 py-16 text-center">
                        <Wrench size={48} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Nenhum ticket encontrado</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filtered.map(ticket => {
                            const cat = categories.find(c => c.id === ticket.category);
                            const CatIcon = cat?.icon || Wrench;
                            const pCfg = priorityConfig[ticket.priority];
                            const PIcon = pCfg.icon;
                            const sCfg = statusConfig[ticket.status];

                            return (
                                <div key={ticket.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        {/* Category Icon */}
                                        <div className={`p-3 rounded-xl ${cat?.bg || 'bg-gray-50'}`}>
                                            <CatIcon size={20} className={cat?.color || 'text-gray-500'} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h4 className="font-semibold text-gray-900">{ticket.title}</h4>
                                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${pCfg.color}`}>
                                                    <PIcon size={12} /> {pCfg.label}
                                                </span>
                                                <span className="text-xs text-gray-400">SLA: {pCfg.sla}</span>
                                            </div>
                                            {ticket.description && (
                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Building2 size={12} /> {ticket.shops?.name || 'Loja não especificada'}
                                                </span>
                                                <span>{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
                                                {ticket.assigned_user && (
                                                    <span className="flex items-center gap-1 text-blue-600">
                                                        <User size={12} /> {ticket.assigned_user.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={ticket.status}
                                                onChange={e => updateTicket(ticket.id, { status: e.target.value as any })}
                                                className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white font-medium"
                                            >
                                                <option value="open">Aberto</option>
                                                <option value="in_progress">Em Andamento</option>
                                                <option value="resolved">Resolvido</option>
                                                <option value="closed">Fechar</option>
                                            </select>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                <MessageSquare size={16} className="text-gray-400" />
                                            </button>
                                            <ChevronRight size={16} className="text-gray-300" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}
