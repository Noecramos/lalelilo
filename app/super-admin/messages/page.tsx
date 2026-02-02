'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Modal } from '@/components/ui';
import { MessageSquare, Send, Users, Search, Plus, Check, CheckCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Shop {
    id: string;
    name: string;
}

interface Message {
    id: string;
    sender: 'super-admin' | 'shop';
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

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedShop, setSelectedShop] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewMessageModal, setShowNewMessageModal] = useState(false);
    const [shops, setShops] = useState<Shop[]>([]);
    const [broadcastMessage, setBroadcastMessage] = useState('');

    useEffect(() => {
        fetchConversations();
        fetchShops();
    }, []);

    useEffect(() => {
        if (selectedShop) {
            fetchMessages(selectedShop);

            // Realtime subscription for this specific conversation
            const channel = supabase
                .channel(`convo_${selectedShop}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages' },
                    () => fetchMessages(selectedShop)
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedShop]);

    const fetchConversations = async () => {
        try {
            // Fetch all messages for admin
            const response = await fetch('/api/messages?isAdmin=true');
            const data = await response.json();

            if (data.messages) {
                const msgs = data.messages;
                const grouped = new Map<string, Conversation>();

                // Helper to get shop name (optimistic or fallback)
                const getShopName = (id: string) => {
                    const shop = shops.find(s => s.id === id);
                    return shop ? shop.name : 'Loja Desconhecida';
                };

                msgs.forEach((msg: any) => {
                    // Determine the other party in the conversation
                    // If sender is shop, the "other party" is the sender_id
                    // If sender is super-admin, the "other party" is the recipient_id
                    const otherPartyId = msg.sender === 'shop' ? msg.sender_id : msg.recipient_id;

                    if (otherPartyId === 'all' || otherPartyId === 'super-admin') return;

                    if (!grouped.has(otherPartyId)) {
                        grouped.set(otherPartyId, {
                            shop_id: otherPartyId,
                            shop_name: getShopName(otherPartyId),
                            last_message: msg.content,
                            last_message_time: msg.created_at,
                            unread_count: 0
                        });
                    }

                    const conv = grouped.get(otherPartyId)!;

                    // Update last message if this one is newer
                    if (new Date(msg.created_at) > new Date(conv.last_message_time)) {
                        conv.last_message = msg.content;
                        conv.last_message_time = msg.created_at;
                    }

                    // Count unread (messages FROM shop that are NOT read)
                    if (msg.sender === 'shop' && !msg.read_at) {
                        conv.unread_count++;
                    }
                });

                // Merge with existing shops that might not have messages yet
                const activeConversations = Array.from(grouped.values());

                // If we also want to show shops with NO messages yet:
                const existingShopIds = new Set(activeConversations.map(c => c.shop_id));
                shops.forEach(shop => {
                    if (!existingShopIds.has(shop.id)) {
                        activeConversations.push({
                            shop_id: shop.id,
                            shop_name: shop.name,
                            last_message: 'Nenhuma mensagem',
                            last_message_time: new Date(0).toISOString(), // Old date to put at bottom
                            unread_count: 0
                        });
                    }
                });

                // Sort by last message time
                activeConversations.sort((a, b) =>
                    new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
                );

                setConversations(activeConversations);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        }
    };

    // Refresh conversations when shops are loaded to update names
    useEffect(() => {
        if (shops.length > 0) {
            fetchConversations();
        }
    }, [shops]);

    // Polling and Realtime for conversation list
    useEffect(() => {
        const interval = setInterval(fetchConversations, 10000);

        const channel = supabase
            .channel('admin_messages_list')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                () => fetchConversations()
            )
            .subscribe();

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [shops]);

    // Existing fetchShops... (keep it as is, but ensure it runs)

    const fetchShops = async () => {
        try {
            const response = await fetch('/api/shops');
            const data = await response.json();
            if (data.shops) {
                setShops(data.shops);

                // After fetching shops, we can build conversations from messages if we had them
                // For simplicity, let's initialize conversations based on shops for now
                // Real implementation would look at actual messages
                const initialConversations = data.shops.map((shop: any) => ({
                    shop_id: shop.id,
                    shop_name: shop.name,
                    last_message: 'Iniciar conversa',
                    last_message_time: new Date().toISOString(),
                    unread_count: 0
                }));
                setConversations(initialConversations);
            }
        } catch (error) {
            console.error('Failed to fetch shops:', error);
        }
    };

    const fetchMessages = async (shopId: string) => {
        try {
            // Fix: ensure we pass isAdmin=true so backend knows it's a super-admin request
            // AND pass shopId to get conversation with that specific shop
            const response = await fetch(`/api/messages?isAdmin=true&shopId=${shopId}`);
            const data = await response.json();
            if (data.messages) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
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
                    sender_id: 'super-admin',
                    recipient_id: selectedShop,
                    content: newMessage
                })
            });

            const data = await response.json();

            if (data.success && data.message) {
                setMessages([...messages, data.message]);
                setNewMessage('');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Erro ao enviar mensagem');
        }
    };

    const sendBroadcast = async () => {
        if (!broadcastMessage.trim()) return;

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_type: 'super-admin',
                    sender_id: 'super-admin',
                    recipient_id: 'all',
                    content: broadcastMessage,
                    is_broadcast: true
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(`Mensagem enviada para todas as lojas!`);
                setBroadcastMessage('');
                setShowNewMessageModal(false);
            }
        } catch (error) {
            console.error('Failed to send broadcast:', error);
            alert('Erro ao enviar anúncio');
        }
    };

    const startNewConversation = (shopId: string) => {
        setSelectedShop(shopId);
        setShowNewMessageModal(false);
    };

    const filteredConversations = conversations.filter(conv =>
        conv.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedShopName = conversations.find(c => c.shop_id === selectedShop)?.shop_name ||
        shops.find(s => s.id === selectedShop)?.name || '';

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Mensagens</h2>
                    <p className="text-gray-600 mt-1">Comunique-se com as lojas</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={async () => {
                        if (confirm('Tem certeza? Isso apagará todas as mensagens.')) {
                            await fetch('/api/debug/messages', { method: 'DELETE' });
                            window.location.reload();
                        }
                    }}>
                        Resetar Mensagens
                    </Button>
                    <Button variant="primary" onClick={() => setShowNewMessageModal(true)}>
                        <Plus size={16} className="mr-2" />
                        Nova Mensagem
                    </Button>
                </div>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
                {/* Conversations List */}
                <Card padding="none" className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-200">
                        <Input
                            placeholder="Buscar conversas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search size={18} />}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <MessageSquare size={48} className="mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-500">Nenhuma conversa encontrada</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => (
                                <div
                                    key={conv.shop_id}
                                    onClick={() => setSelectedShop(conv.shop_id)}
                                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${selectedShop === conv.shop_id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <h4 className="font-semibold text-gray-900">{conv.shop_name}</h4>
                                        {conv.unread_count > 0 && (
                                            <Badge variant="danger">{conv.unread_count}</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(conv.last_message_time).toLocaleString('pt-BR')}
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
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="font-semibold text-gray-900">{selectedShopName}</h3>
                                <p className="text-sm text-gray-600">Loja</p>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === 'super-admin' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg p-3 ${msg.sender === 'super-admin'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-200 text-gray-900'
                                                }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                <p className={`text-xs ${msg.sender === 'super-admin' ? 'text-purple-200' : 'text-gray-500'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {msg.sender === 'super-admin' && (
                                                    msg.read_at ? <CheckCheck size={14} /> : <Check size={14} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Message Input */}
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
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Selecione uma conversa
                                </h3>
                                <p className="text-gray-600">
                                    Escolha uma loja para começar a conversar
                                </p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* New Message Modal */}
            {showNewMessageModal && (
                <Modal
                    isOpen={showNewMessageModal}
                    onClose={() => setShowNewMessageModal(false)}
                    title="Nova Mensagem"
                    size="lg"
                >
                    <div className="space-y-4">
                        {/* Broadcast Option */}
                        <Card padding="md" className="bg-purple-50">
                            <div className="flex items-start gap-3">
                                <Users size={24} className="text-purple-600 mt-1" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-2">Enviar para todas as lojas</h4>
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

                        {/* Individual Shops */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Ou escolha uma loja:</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {shops.map((shop) => (
                                    <div
                                        key={shop.id}
                                        onClick={() => startNewConversation(shop.id)}
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
