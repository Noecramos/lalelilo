'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import {
    Users, UserPlus, TrendingUp, Phone, Mail, Instagram,
    Facebook, MessageSquare, ShoppingBag, Tag, Calendar,
    Filter, Search, ChevronRight, Star, Clock, Building2
} from 'lucide-react';

const CLIENT_ID = 'acb4b354-728f-479d-915a-c857d27da9ad';

interface Contact {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    instagram_id: string | null;
    facebook_id: string | null;
    status: string;
    source: string;
    tags: string[];
    total_orders: number;
    lifetime_value: number;
    first_contact_date: string;
    last_contact_date: string;
    last_purchase_date: string | null;
    assigned_shop_id: string | null;
    shops?: { name: string };
}

interface Metrics {
    total_leads: number;
    qualified_leads: number;
    customers: number;
    vips: number;
    inactive: number;
    by_source: {
        whatsapp: number;
        instagram: number;
        facebook: number;
    };
    unassigned_leads: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    lead: { label: 'Lead', color: 'text-blue-600', bg: 'bg-blue-50' },
    qualified_lead: { label: 'Qualificado', color: 'text-purple-600', bg: 'bg-purple-50' },
    customer: { label: 'Cliente', color: 'text-green-600', bg: 'bg-green-50' },
    vip: { label: 'VIP', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    inactive: { label: 'Inativo', color: 'text-gray-500', bg: 'bg-gray-50' },
};

const sourceIcons = {
    whatsapp: Phone,
    instagram: Instagram,
    facebook: Facebook,
    manual: UserPlus,
    ecommerce: ShoppingBag,
};

export default function CRMPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'leads' | 'customers' | 'all'>('leads');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [contactsRes, metricsRes] = await Promise.all([
                fetch(`/api/crm?action=contacts&client_id=${CLIENT_ID}`),
                fetch(`/api/crm?action=lead_metrics&client_id=${CLIENT_ID}`),
            ]);
            const contactsData = await contactsRes.json();
            const metricsData = await metricsRes.json();
            setContacts(Array.isArray(contactsData) ? contactsData : []);
            setMetrics(metricsData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const updateContactStatus = async (contactId: string, status: string) => {
        try {
            await fetch('/api/crm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_status', contactId, status }),
            });
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    // Filter contacts
    let filtered = contacts;
    if (view === 'leads') {
        filtered = filtered.filter(c => c.status === 'lead' || c.status === 'qualified_lead');
    } else if (view === 'customers') {
        filtered = filtered.filter(c => c.status === 'customer' || c.status === 'vip');
    }
    if (search) {
        filtered = filtered.filter(c =>
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.includes(search) ||
            c.email?.toLowerCase().includes(search.toLowerCase())
        );
    }

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
                    <Users className="text-lale-orange" size={32} />
                    CRM - Gestão de Contatos
                </h1>
                <p className="text-gray-500 mt-1">Gerencie leads, clientes e relacionamento omnichannel</p>
            </div>

            {/* Metrics Cards */}
            {metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    <Card padding="md" className="text-center">
                        <UserPlus size={20} className="text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{metrics.total_leads}</p>
                        <p className="text-xs text-gray-500">Leads Ativos</p>
                    </Card>
                    <Card padding="md" className="text-center">
                        <Star size={20} className="text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{metrics.qualified_leads}</p>
                        <p className="text-xs text-gray-500">Qualificados</p>
                    </Card>
                    <Card padding="md" className="text-center">
                        <ShoppingBag size={20} className="text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{metrics.customers}</p>
                        <p className="text-xs text-gray-500">Clientes</p>
                    </Card>
                    <Card padding="md" className="text-center">
                        <TrendingUp size={20} className="text-yellow-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{metrics.vips}</p>
                        <p className="text-xs text-gray-500">VIPs</p>
                    </Card>
                    <Card padding="md" className="text-center">
                        <Phone size={20} className="text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{metrics.by_source.whatsapp}</p>
                        <p className="text-xs text-gray-500">WhatsApp</p>
                    </Card>
                    <Card padding="md" className="text-center">
                        <Instagram size={20} className="text-pink-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{metrics.by_source.instagram}</p>
                        <p className="text-xs text-gray-500">Instagram</p>
                    </Card>
                </div>
            )}

            {/* Unassigned Leads Alert */}
            {metrics && metrics.unassigned_leads > 0 && (
                <Card padding="md" className="mb-6 border-2 border-orange-200 bg-orange-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-200">
                                <Building2 size={20} className="text-orange-700" />
                            </div>
                            <div>
                                <p className="font-semibold text-orange-900">
                                    {metrics.unassigned_leads} lead{metrics.unassigned_leads > 1 ? 's' : ''} não atribuído{metrics.unassigned_leads > 1 ? 's' : ''}
                                </p>
                                <p className="text-sm text-orange-700">Atribua leads às lojas para melhor atendimento</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.location.href = '/super-admin/crm/assign'}
                            className="px-4 py-2 bg-lale-orange text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            Atribuir Agora
                        </button>
                    </div>
                </Card>
            )}

            {/* View Tabs */}
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={() => setView('leads')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${view === 'leads'
                        ? 'bg-lale-orange text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    Leads ({metrics?.total_leads || 0})
                </button>
                <button
                    onClick={() => setView('customers')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${view === 'customers'
                        ? 'bg-lale-orange text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    Clientes ({(metrics?.customers || 0) + (metrics?.vips || 0)})
                </button>
                <button
                    onClick={() => setView('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${view === 'all'
                        ? 'bg-lale-orange text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    Todos ({contacts.length})
                </button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nome, telefone ou email..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                    />
                </div>
            </div>

            {/* Contacts List */}
            <Card padding="none">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Filter size={16} className="text-gray-400" />
                        {filtered.length} {filtered.length === 1 ? 'Contato' : 'Contatos'}
                    </h3>
                </div>
                {filtered.length === 0 ? (
                    <div className="px-5 py-16 text-center">
                        <Users size={48} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Nenhum contato encontrado</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filtered.map(contact => {
                            const SourceIcon = sourceIcons[contact.source as keyof typeof sourceIcons] || UserPlus;
                            const statusCfg = statusConfig[contact.status] || statusConfig.lead;
                            return (
                                <div key={contact.id} className="px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => window.location.href = `/super-admin/crm/${contact.id}`}>
                                    <div className="flex items-start gap-4">
                                        {/* Avatar/Icon */}
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-lale-pink to-lale-orange text-white">
                                            <SourceIcon size={20} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h4 className="font-semibold text-gray-900">
                                                    {contact.name || 'Sem nome'}
                                                </h4>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color} ${statusCfg.bg}`}>
                                                    {statusCfg.label}
                                                </span>
                                                {contact.status === 'vip' && (
                                                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                                {contact.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={12} /> {contact.phone}
                                                    </span>
                                                )}
                                                {contact.email && (
                                                    <span className="flex items-center gap-1">
                                                        <Mail size={12} /> {contact.email}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    Primeiro contato: {new Date(contact.first_contact_date).toLocaleDateString('pt-BR')}
                                                </span>
                                                {contact.total_orders > 0 && (
                                                    <>
                                                        <span className="flex items-center gap-1">
                                                            <ShoppingBag size={12} /> {contact.total_orders} pedidos
                                                        </span>
                                                        <span className="font-medium text-green-600">
                                                            R$ {contact.lifetime_value.toFixed(2)}
                                                        </span>
                                                    </>
                                                )}
                                                {contact.shops && (
                                                    <span className="flex items-center gap-1">
                                                        <Building2 size={12} /> {contact.shops.name}
                                                    </span>
                                                )}
                                            </div>
                                            {contact.tags.length > 0 && (
                                                <div className="flex items-center gap-1 mt-2">
                                                    {contact.tags.map(tag => (
                                                        <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <select
                                                value={contact.status}
                                                onChange={e => updateContactStatus(contact.id, e.target.value)}
                                                className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white font-medium"
                                            >
                                                <option value="lead">Lead</option>
                                                <option value="qualified_lead">Qualificado</option>
                                                <option value="customer">Cliente</option>
                                                <option value="vip">VIP</option>
                                                <option value="inactive">Inativo</option>
                                            </select>
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
