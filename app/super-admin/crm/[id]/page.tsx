'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import {
    User, Phone, Mail, Instagram, Facebook, Calendar, ShoppingBag,
    MessageSquare, Tag, TrendingUp, Clock, MapPin, Edit, Save,
    X, Building2, Star, Gift, ArrowLeft, Package, DollarSign
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
    notes: string | null;
    shops?: { id: string; name: string };
}

interface Order {
    id: string;
    total: number;
    status: string;
    created_at: string;
    items: Array<{ product: { name: string }; quantity: number; price: number }>;
}

interface Message {
    id: string;
    body: string;
    direction: 'inbound' | 'outbound';
    created_at: string;
    channel: string;
}

interface Event {
    id: string;
    event_type: string;
    event_date: string;
    title: string;
    description: string | null;
}

export default function ContactDetailPage() {
    const params = useParams();
    const router = useRouter();
    const contactId = params.id as string;

    const [contact, setContact] = useState<Contact | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [shops, setShops] = useState<Array<{ id: string; name: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'messages' | 'events'>('overview');
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        notes: '',
        tags: [] as string[],
        status: '',
        assigned_shop_id: ''
    });

    useEffect(() => {
        fetchContactData();
        fetchShops();
    }, [contactId]);

    const fetchContactData = async () => {
        setLoading(true);
        try {
            // Fetch contact details
            const contactRes = await fetch(`/api/crm?action=contacts&client_id=${CLIENT_ID}`);
            const contactsData = await contactRes.json();
            const foundContact = contactsData.find((c: Contact) => c.id === contactId);

            if (foundContact) {
                setContact(foundContact);
                setEditForm({
                    name: foundContact.name || '',
                    email: foundContact.email || '',
                    notes: foundContact.notes || '',
                    tags: foundContact.tags || [],
                    status: foundContact.status,
                    assigned_shop_id: foundContact.assigned_shop_id || ''
                });
            }

            // Fetch orders (mock for now - you'll need to implement this endpoint)
            // const ordersRes = await fetch(`/api/ecommerce?action=orders&contact_id=${contactId}`);
            // setOrders(await ordersRes.json());

            // Fetch messages (mock for now)
            // const messagesRes = await fetch(`/api/messaging?action=history&contact_id=${contactId}`);
            // setMessages(await messagesRes.json());

            // Fetch events
            // const eventsRes = await fetch(`/api/crm?action=events&contact_id=${contactId}`);
            // setEvents(await eventsRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchShops = async () => {
        try {
            const res = await fetch(`/api/shops?client_id=${CLIENT_ID}`);
            const data = await res.json();
            setShops(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        }
    };

    const saveContact = async () => {
        try {
            await fetch('/api/crm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'upsert_contact',
                    clientId: CLIENT_ID,
                    phone: contact?.phone,
                    name: editForm.name,
                    email: editForm.email,
                    tags: editForm.tags,
                }),
            });

            if (editForm.status !== contact?.status) {
                await fetch('/api/crm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'update_status',
                        contactId: contactId,
                        status: editForm.status,
                    }),
                });
            }

            if (editForm.assigned_shop_id && editForm.assigned_shop_id !== contact?.assigned_shop_id) {
                await fetch('/api/crm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'assign_lead',
                        contactId: contactId,
                        shopId: editForm.assigned_shop_id,
                        assignedBy: 'super_admin',
                        method: 'manual',
                    }),
                });
            }

            setEditing(false);
            fetchContactData();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading || !contact) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lale-orange" />
            </div>
        );
    }

    const statusColors: Record<string, string> = {
        lead: 'bg-blue-100 text-blue-700',
        qualified_lead: 'bg-purple-100 text-purple-700',
        customer: 'bg-green-100 text-green-700',
        vip: 'bg-yellow-100 text-yellow-700',
        inactive: 'bg-gray-100 text-gray-700',
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            {contact.name || 'Sem nome'}
                            {contact.status === 'vip' && <Star size={24} className="text-yellow-500 fill-yellow-500" />}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[contact.status]}`}>
                                {contact.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="ml-2">• Cliente desde {new Date(contact.first_contact_date).toLocaleDateString('pt-BR')}</span>
                        </p>
                    </div>
                </div>
                {!editing ? (
                    <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-lale-orange text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        <Edit size={18} /> Editar
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setEditing(false)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                        >
                            <X size={18} /> Cancelar
                        </button>
                        <button
                            onClick={saveContact}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                            <Save size={18} /> Salvar
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <Card padding="md" className="text-center">
                    <ShoppingBag size={20} className="text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{contact.total_orders}</p>
                    <p className="text-xs text-gray-500">Pedidos</p>
                </Card>
                <Card padding="md" className="text-center">
                    <DollarSign size={20} className="text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">R$ {contact.lifetime_value.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Valor Total</p>
                </Card>
                <Card padding="md" className="text-center">
                    <MessageSquare size={20} className="text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
                    <p className="text-xs text-gray-500">Mensagens</p>
                </Card>
                <Card padding="md" className="text-center">
                    <Clock size={20} className="text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                        {Math.floor((Date.now() - new Date(contact.last_contact_date).getTime()) / (1000 * 60 * 60 * 24))}d
                    </p>
                    <p className="text-xs text-gray-500">Último Contato</p>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200">
                {['overview', 'orders', 'messages', 'events'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === tab
                                ? 'text-lale-orange border-b-2 border-lale-orange'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab === 'overview' && 'Visão Geral'}
                        {tab === 'orders' && `Pedidos (${contact.total_orders})`}
                        {tab === 'messages' && `Mensagens (${messages.length})`}
                        {tab === 'events' && `Eventos (${events.length})`}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Contact Info */}
                    <Card padding="md">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User size={18} /> Informações de Contato
                        </h3>
                        <div className="space-y-3">
                            {editing ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    {contact.phone && (
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Phone size={16} className="text-gray-400" />
                                            <span>{contact.phone}</span>
                                        </div>
                                    )}
                                    {contact.email && (
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Mail size={16} className="text-gray-400" />
                                            <span>{contact.email}</span>
                                        </div>
                                    )}
                                    {contact.instagram_id && (
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Instagram size={16} className="text-pink-500" />
                                            <span>Instagram conectado</span>
                                        </div>
                                    )}
                                    {contact.facebook_id && (
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Facebook size={16} className="text-blue-600" />
                                            <span>Facebook conectado</span>
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="flex items-center gap-2 text-gray-700">
                                <Calendar size={16} className="text-gray-400" />
                                <span>Origem: {contact.source}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Assignment & Status */}
                    <Card padding="md">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Building2 size={18} /> Atribuição & Status
                        </h3>
                        <div className="space-y-3">
                            {editing ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            value={editForm.status}
                                            onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="lead">Lead</option>
                                            <option value="qualified_lead">Qualificado</option>
                                            <option value="customer">Cliente</option>
                                            <option value="vip">VIP</option>
                                            <option value="inactive">Inativo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Loja Atribuída</label>
                                        <select
                                            value={editForm.assigned_shop_id}
                                            onChange={e => setEditForm({ ...editForm, assigned_shop_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">Não atribuído</option>
                                            {shops.map(shop => (
                                                <option key={shop.id} value={shop.id}>{shop.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Building2 size={16} className="text-gray-400" />
                                        <span>{contact.shops?.name || 'Não atribuído'}</span>
                                    </div>
                                    {contact.last_purchase_date && (
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <ShoppingBag size={16} className="text-gray-400" />
                                            <span>Última compra: {new Date(contact.last_purchase_date).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>

                    {/* Tags */}
                    <Card padding="md" className="lg:col-span-2">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Tag size={18} /> Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {contact.tags.length > 0 ? (
                                contact.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-lale-pink bg-opacity-20 text-lale-pink rounded-full text-sm font-medium">
                                        #{tag}
                                    </span>
                                ))
                            ) : (
                                <p className="text-gray-400 text-sm">Nenhuma tag</p>
                            )}
                        </div>
                    </Card>

                    {/* Notes */}
                    <Card padding="md" className="lg:col-span-2">
                        <h3 className="font-semibold text-gray-900 mb-4">Notas</h3>
                        {editing ? (
                            <textarea
                                value={editForm.notes}
                                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="Adicione notas sobre este contato..."
                            />
                        ) : (
                            <p className="text-gray-600">{contact.notes || 'Nenhuma nota'}</p>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === 'orders' && (
                <Card padding="md">
                    <h3 className="font-semibold text-gray-900 mb-4">Histórico de Pedidos</h3>
                    {orders.length === 0 ? (
                        <div className="text-center py-12">
                            <Package size={48} className="text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-500">Nenhum pedido ainda</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orders.map(order => (
                                <div key={order.id} className="p-4 border border-gray-200 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-medium text-gray-900">Pedido #{order.id.slice(0, 8)}</p>
                                            <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <p className="text-lg font-bold text-green-600">R$ {order.total.toFixed(2)}</p>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {order.items?.map((item, i) => (
                                            <div key={i}>{item.quantity}x {item.product.name}</div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {activeTab === 'messages' && (
                <Card padding="md">
                    <h3 className="font-semibold text-gray-900 mb-4">Histórico de Mensagens</h3>
                    <div className="text-center py-12">
                        <MessageSquare size={48} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500">Histórico de mensagens será exibido aqui</p>
                    </div>
                </Card>
            )}

            {activeTab === 'events' && (
                <Card padding="md">
                    <h3 className="font-semibold text-gray-900 mb-4">Eventos & Datas Importantes</h3>
                    <div className="text-center py-12">
                        <Gift size={48} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500">Nenhum evento cadastrado</p>
                    </div>
                </Card>
            )}
        </div>
    );
}
