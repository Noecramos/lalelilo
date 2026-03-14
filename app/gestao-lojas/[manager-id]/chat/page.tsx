'use client';

import React, { useState, useEffect, use } from 'react';
import { Card, Button, Input, Badge, Modal } from '@/components/ui';
import { MessageSquare, Send, Users, Search, Plus, Check, CheckCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Shop {
    id: string;
    name: string;
}

interface Message {
    id: string;
    sender: 'super-admin' | 'shop' | 'regional-manager';
    sender_id: string;
    recipient_id: string | 'all';
    content: string;
    created_at: string;
    read_at?: string;
}

interface Conversation {
    shop_id: string;
    shop_name: string;
    last_message: string;
    last_message_time: string;
    unread_count: number;
}

export default function ChatInternoPage({
    params
}: {
    params: Promise<{ 'manager-id': string }>;
}) {
    const { 'manager-id': managerId } = use(params);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedShop, setSelectedShop] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewMessageModal, setShowNewMessageModal] = useState(false);
    const [managedShops, setManagedShops] = useState<Shop[]>([]);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch managed shops on mount
    useEffect(() => {
        const fetchManagedShops = async () => {
            try {
                const res = await fetch(`/api/managers/shops?managerId=${managerId}`);
                const data = await res.json();
                const shops = data.shops || [];
                setManagedShops(shops);

                // Initialize conversations from managed shops
                const convs: Conversation[] = shops.map((shop: Shop) => ({
                    shop_id: shop.id,
                    shop_name: shop.name,
                    last_message: 'Iniciar conversa',
                    last_message_time: new Date().toISOString(),
                    unread_count: 0
                }));
                setConversations(convs);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchManagedShops();
    }, [managerId]);

    // Fetch messages when a shop is selected
    useEffect(() => {
        if (selectedShop) {
            fetchMessages(selectedShop);

            const channel = supabase
                .channel(`mgr_convo_${selectedShop}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'internal_messages' },
                    () => fetchMessages(selectedShop)
                )
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [selectedShop]);

    // Refresh conversations with actual messages
    useEffect(() => {
        if (managedShops.length > 0) {
            refreshConversations();
            const interval = setInterval(refreshConversations, 10000);
            return () => clearInterval(interval);
        }
    }, [managedShops]);

    const refreshConversations = async () => {
        try {
            const response = await fetch('/api/messages?isAdmin=true');
            const data = await response.json();

            if (data.messages) {
                const msgs = data.messages;
                const managedIds = new Set(managedShops.map(s => s.id));
                const grouped = new Map<string, Conversation>();

                msgs.forEach((msg: any) => {
                    const otherPartyId = msg.sender === 'shop' ? msg.sender_id : msg.recipient_id;
                    if (otherPartyId === 'all' || otherPartyId === 'super-admin') return;
                    // Only show conversations with managed shops
                    if (!managedIds.has(otherPartyId)) return;

                    const shopName = managedShops.find(s => s.id === otherPartyId)?.name || 'Loja';

                    if (!grouped.has(otherPartyId)) {
                        grouped.set(otherPartyId, {
                            shop_id: otherPartyId,
                            shop_name: shopName,
                            last_message: msg.content,
                            last_message_time: msg.created_at,
                            unread_count: 0
                        });
                    }

                    const conv = grouped.get(otherPartyId)!;
                    if (new Date(msg.created_at) > new Date(conv.last_message_time)) {
                        conv.last_message = msg.content;
                        conv.last_message_time = msg.created_at;
                    }
                    if (msg.sender === 'shop' && !msg.read_at) {
                        conv.unread_count++;
                    }
                });

                // Keep shops with no messages too
                const activeConvs = Array.from(grouped.values());
                const existingIds = new Set(activeConvs.map(c => c.shop_id));
                managedShops.forEach(shop => {
                    if (!existingIds.has(shop.id)) {
                        activeConvs.push({
                            shop_id: shop.id,
                            shop_name: shop.name,
                            last_message: 'Nenhuma mensagem',
                            last_message_time: new Date(0).toISOString(),
                            unread_count: 0
                        });
                    }
                });

                activeConvs.sort((a, b) =>
                    new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
                );
                setConversations(activeConvs);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMessages = async (shopId: string) => {
        try {
            const response = await fetch(`/api/messages?isAdmin=true&shopId=${shopId}`);
            const data = await response.json();
            if (data.messages) setMessages(data.messages);
        } catch (err) {
            console.error(err);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedShop) return;

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_type: 'super-admin',
                    sender_id: managerId,
                    recipient_id: selectedShop,
                    content: newMessage
                })
            });

            const data = await response.json();
            if (data.success && data.message) {
                setMessages([...messages, data.message]);
                setNewMessage('');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao enviar mensagem');
        }
    };

    const sendBroadcast = async () => {
        if (!broadcastMessage.trim()) return;

        // Send to all managed shops
        for (const shop of managedShops) {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_type: 'super-admin',
                    sender_id: managerId,
                    recipient_id: shop.id,
                    content: broadcastMessage
                })
            });
        }

        alert(`Mensagem enviada para ${managedShops.length} lojas!`);
        setBroadcastMessage('');
        setShowNewMessageModal(false);
        refreshConversations();
    };

    const filteredConversations = conversations.filter(conv =>
        conv.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedShopName = conversations.find(c => c.shop_id === selectedShop)?.shop_name || '';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500" />
            </div>
        );
    }

    if (managedShops.length === 0) {
        return (
            <div className="text-center py-20">
                <MessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma loja atribuída</h3>
                <p className="text-gray-500">Adicione lojas ao seu painel para usar o chat interno.</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Chat Interno</h2>
                    <p className="text-gray-600 mt-1">Comunique-se com as suas lojas</p>
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowNewMessageModal(true)}
                    className="flex-none"
                >
                    <Plus size={16} className="mr-2" />
                    Anúncio para Lojas
                </Button>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
                {/* Conversations List */}
                <Card padding="none" className="flex flex-col h-full">
                    <div className="p-3 border-b border-gray-200">
                        <Input
                            placeholder="Buscar lojas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search size={18} />}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <MessageSquare size={48} className="mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-500">Nenhuma conversa</p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => (
                                <div
                                    key={conv.shop_id}
                                    onClick={() => setSelectedShop(conv.shop_id)}
                                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${selectedShop === conv.shop_id ? 'bg-teal-50 border-l-4 border-l-teal-600' : ''}`}
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <h4 className="font-semibold text-gray-900 text-sm">{conv.shop_name}</h4>
                                        {conv.unread_count > 0 && (
                                            <Badge variant="danger">{conv.unread_count}</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(conv.last_message_time).getFullYear() > 2000
                                            ? new Date(conv.last_message_time).toLocaleString('pt-BR')
                                            : ''}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Messages Area */}
                <Card padding="none" className="md:col-span-2 flex flex-col h-full">
                    {selectedShop ? (
                        <>
                            <div className="p-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="font-semibold text-gray-900">{selectedShopName}</h3>
                                <p className="text-sm text-gray-600">Loja</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender !== 'shop' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-lg p-3 ${msg.sender !== 'shop'
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-gray-200 text-gray-900'}`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                <p className={`text-xs ${msg.sender !== 'shop' ? 'text-teal-200' : 'text-gray-500'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {msg.sender !== 'shop' && (
                                                    msg.read_at ? <CheckCheck size={14} /> : <Check size={14} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-gray-200">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Digite sua mensagem..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        className="flex-1"
                                    />
                                    <Button variant="primary" onClick={sendMessage}>
                                        <Send size={18} />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <MessageSquare size={64} className="mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecione uma loja</h3>
                                <p className="text-gray-600">Escolha uma loja para conversar</p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Broadcast Modal */}
            {showNewMessageModal && (
                <Modal
                    isOpen={showNewMessageModal}
                    onClose={() => setShowNewMessageModal(false)}
                    title="Anúncio para Minhas Lojas"
                    size="lg"
                >
                    <div className="space-y-4">
                        <Card padding="md" className="bg-teal-50">
                            <div className="flex items-start gap-3">
                                <Users size={24} className="text-teal-600 mt-1" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-2">
                                        Enviar para {managedShops.length} lojas
                                    </h4>
                                    <textarea
                                        placeholder="Digite o anúncio..."
                                        value={broadcastMessage}
                                        onChange={(e) => setBroadcastMessage(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg resize-none text-gray-900"
                                        rows={3}
                                    />
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={sendBroadcast}
                                        className="mt-2"
                                    >
                                        <Send size={14} className="mr-1" />
                                        Enviar Anúncio
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Ou escolha uma loja:</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {managedShops.map(shop => (
                                    <div
                                        key={shop.id}
                                        onClick={() => { setSelectedShop(shop.id); setShowNewMessageModal(false); }}
                                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <p className="font-medium text-gray-900">{shop.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
