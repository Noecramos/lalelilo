'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Modal } from '@/components/ui';
import { MessageSquare, Send, Users, Search, Plus, Check, CheckCheck } from 'lucide-react';

interface Shop {
    id: string;
    name: string;
}

interface Message {
    id: string;
    sender: 'super-admin' | 'shop';
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
        }
    }, [selectedShop]);

    const fetchConversations = async () => {
        // TODO: Replace with actual API call
        setTimeout(() => {
            setConversations([
                { shop_id: '1', shop_name: 'Lalelilo Centro', last_message: 'Obrigado pela informação!', last_message_time: '2026-01-30T09:30:00', unread_count: 2 },
                { shop_id: '2', shop_name: 'Lalelilo Boa Viagem', last_message: 'Quando teremos novos produtos?', last_message_time: '2026-01-29T15:20:00', unread_count: 0 },
                { shop_id: '3', shop_name: 'Lalelilo Shopping', last_message: 'Tudo certo!', last_message_time: '2026-01-28T11:45:00', unread_count: 1 },
            ]);
        }, 500);
    };

    const fetchShops = async () => {
        // TODO: Replace with actual API call
        setTimeout(() => {
            setShops([
                { id: '1', name: 'Lalelilo Centro' },
                { id: '2', name: 'Lalelilo Boa Viagem' },
                { id: '3', name: 'Lalelilo Shopping' },
                { id: '4', name: 'Lalelilo Olinda' },
                { id: '5', name: 'Lalelilo Jaboatão' },
            ]);
        }, 500);
    };

    const fetchMessages = async (shopId: string) => {
        // TODO: Replace with actual API call
        setTimeout(() => {
            setMessages([
                { id: '1', sender: 'super-admin', recipient_id: shopId, content: 'Olá! Como posso ajudar?', created_at: '2026-01-30T09:00:00', read_at: '2026-01-30T09:05:00' },
                { id: '2', sender: 'shop', recipient_id: 'super-admin', content: 'Preciso de informações sobre o novo sistema de pagamento.', created_at: '2026-01-30T09:10:00', read_at: '2026-01-30T09:12:00' },
                { id: '3', sender: 'super-admin', recipient_id: shopId, content: 'Claro! O novo sistema será implementado na próxima semana.', created_at: '2026-01-30T09:15:00', read_at: '2026-01-30T09:20:00' },
                { id: '4', sender: 'shop', recipient_id: 'super-admin', content: 'Obrigado pela informação!', created_at: '2026-01-30T09:30:00' },
            ]);
        }, 300);
    };

    const sendMessage = () => {
        if (!newMessage.trim() || !selectedShop) return;

        const message: Message = {
            id: Date.now().toString(),
            sender: 'super-admin',
            recipient_id: selectedShop,
            content: newMessage,
            created_at: new Date().toISOString(),
        };

        setMessages([...messages, message]);
        setNewMessage('');

        // TODO: Send to API
    };

    const sendBroadcast = () => {
        if (!broadcastMessage.trim()) return;

        // TODO: Send broadcast to all shops via API
        alert(`Mensagem enviada para todas as lojas: "${broadcastMessage}"`);
        setBroadcastMessage('');
        setShowNewMessageModal(false);
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
                <Button variant="primary" onClick={() => setShowNewMessageModal(true)}>
                    <Plus size={16} className="mr-2" />
                    Nova Mensagem
                </Button>
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
                                        className="w-full p-2 border border-gray-300 rounded-lg resize-none"
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
