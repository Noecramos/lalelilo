'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import { Users, Building2, X, Check, AlertCircle, ArrowRight } from 'lucide-react';

const CLIENT_ID = 'acb4b354-728f-479d-915a-c857d27da9ad';

interface Contact {
    id: string;
    name: string | null;
    phone: string | null;
    status: string;
    source: string;
    first_contact_date: string;
    assigned_shop_id: string | null;
}

interface Shop {
    id: string;
    name: string;
    city: string;
}

export default function LeadAssignmentPage() {
    const [unassignedLeads, setUnassignedLeads] = useState<Contact[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [selectedShop, setSelectedShop] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [contactsRes, shopsRes] = await Promise.all([
                fetch(`/api/crm?action=contacts&client_id=${CLIENT_ID}`),
                fetch(`/api/shops?client_id=${CLIENT_ID}`),
            ]);
            const contactsData = await contactsRes.json();
            const shopsData = await shopsRes.json();

            // Filter unassigned leads
            const unassigned = (Array.isArray(contactsData) ? contactsData : []).filter(
                (c: Contact) => (c.status === 'lead' || c.status === 'qualified_lead') && !c.assigned_shop_id
            );

            setUnassignedLeads(unassigned);
            setShops(Array.isArray(shopsData) ? shopsData : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleLead = (leadId: string) => {
        const newSelected = new Set(selectedLeads);
        if (newSelected.has(leadId)) {
            newSelected.delete(leadId);
        } else {
            newSelected.add(leadId);
        }
        setSelectedLeads(newSelected);
    };

    const selectAll = () => {
        if (selectedLeads.size === unassignedLeads.length) {
            setSelectedLeads(new Set());
        } else {
            setSelectedLeads(new Set(unassignedLeads.map(l => l.id)));
        }
    };

    const assignLeads = async () => {
        if (!selectedShop || selectedLeads.size === 0) return;

        setAssigning(true);
        try {
            await Promise.all(
                Array.from(selectedLeads).map(leadId =>
                    fetch('/api/crm', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'assign_lead',
                            contactId: leadId,
                            shopId: selectedShop,
                            assignedBy: 'super_admin',
                            method: 'manual',
                        }),
                    })
                )
            );

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setSelectedLeads(new Set());
                setSelectedShop('');
                fetchData();
            }, 2000);
        } catch (e) {
            console.error(e);
        } finally {
            setAssigning(false);
        }
    };

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
                    <Building2 className="text-lale-orange" size={32} />
                    Atribuição de Leads
                </h1>
                <p className="text-gray-500 mt-1">
                    Atribua leads não atribuídos às lojas para atendimento personalizado
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card padding="md">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-blue-100">
                            <Users size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{unassignedLeads.length}</p>
                            <p className="text-sm text-gray-500">Leads Não Atribuídos</p>
                        </div>
                    </div>
                </Card>
                <Card padding="md">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-purple-100">
                            <Check size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{selectedLeads.size}</p>
                            <p className="text-sm text-gray-500">Selecionados</p>
                        </div>
                    </div>
                </Card>
                <Card padding="md">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-green-100">
                            <Building2 size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{shops.length}</p>
                            <p className="text-sm text-gray-500">Lojas Ativas</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Assignment Panel */}
            {selectedLeads.size > 0 && (
                <Card padding="md" className="mb-6 border-2 border-lale-orange">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-lale-orange bg-opacity-10">
                                <ArrowRight size={20} className="text-lale-orange" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">
                                    {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''} selecionado{selectedLeads.size > 1 ? 's' : ''}
                                </p>
                                <p className="text-sm text-gray-500">Escolha uma loja para atribuir</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={selectedShop}
                                onChange={e => setSelectedShop(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg font-medium"
                            >
                                <option value="">Selecione a loja...</option>
                                {shops.map(shop => (
                                    <option key={shop.id} value={shop.id}>
                                        {shop.name} - {shop.city}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={assignLeads}
                                disabled={!selectedShop || assigning}
                                className="px-6 py-2 bg-lale-orange text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
                            >
                                {assigning ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                                        Atribuindo...
                                    </>
                                ) : success ? (
                                    <>
                                        <Check size={18} />
                                        Atribuído!
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Atribuir
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Leads List */}
            <Card padding="none">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Leads Não Atribuídos</h3>
                    {unassignedLeads.length > 0 && (
                        <button
                            onClick={selectAll}
                            className="text-sm text-lale-orange font-medium hover:underline"
                        >
                            {selectedLeads.size === unassignedLeads.length ? 'Desmarcar todos' : 'Selecionar todos'}
                        </button>
                    )}
                </div>
                {unassignedLeads.length === 0 ? (
                    <div className="px-5 py-16 text-center">
                        <Check size={48} className="text-green-500 mx-auto mb-3" />
                        <p className="text-gray-900 font-medium mb-1">Todos os leads estão atribuídos!</p>
                        <p className="text-gray-500 text-sm">Não há leads pendentes de atribuição no momento.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {unassignedLeads.map(lead => {
                            const isSelected = selectedLeads.has(lead.id);
                            return (
                                <div
                                    key={lead.id}
                                    onClick={() => toggleLead(lead.id)}
                                    className={`px-5 py-4 cursor-pointer transition-all ${isSelected ? 'bg-lale-orange bg-opacity-5 border-l-4 border-lale-orange' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Checkbox */}
                                        <div
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                                                    ? 'bg-lale-orange border-lale-orange'
                                                    : 'border-gray-300 bg-white'
                                                }`}
                                        >
                                            {isSelected && <Check size={14} className="text-white" />}
                                        </div>

                                        {/* Lead Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-gray-900">
                                                    {lead.name || 'Sem nome'}
                                                </p>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                                    {lead.status === 'qualified_lead' ? 'Qualificado' : 'Lead'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span>{lead.phone || 'Sem telefone'}</span>
                                                <span>•</span>
                                                <span className="capitalize">{lead.source}</span>
                                                <span>•</span>
                                                <span>
                                                    Desde {new Date(lead.first_contact_date).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
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
