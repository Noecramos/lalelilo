'use client';

import React, { useState, useEffect, use } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { MessageSquare, Send, Check, CheckCheck, AlertCircle } from 'lucide-react';

interface Message {
    id: string;
    sender: 'super-admin' | 'shop';
    sender_id: string; // Added this
    content: string;
    created_at: string;
    read_at?: string;
    is_broadcast?: boolean;
}

export default function ShopMessagesPage({
    params
}: {
    params: Promise<{ 'shop-id': string }>;
}) {
    const { 'shop-id': shopId } = use(params);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchMessages();
    }, [shopId]);

    const fetchMessages = async () => {
        if (!shopId) return;
        try {
            // Pass shopId. Backend handles slug->uuid resolution.
            const response = await fetch(`/api/messages?shopId=${shopId}`);
            const data = await response.json();

            if (data.error) {
                console.error('API Error:', data.error);
                // alert('Erro ao carregar mensagens: ' + data.error); 
            } else if (data.messages) {
                setMessages(data.messages);

                // Calculate unread
                const unread = data.messages.filter(
                    (m: Message) => m.sender === 'super-admin' && !m.read_at
                ).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        // Try to find the UUID from existing messages first to avoid extra API calls
        // If we have messages, we know our true UUID is in sender_id or recipient_id
        let realShopId = shopId;
        const previousMsg = messages.find(m => m.sender_id !== 'super-admin');
        if (previousMsg) {
            realShopId = previousMsg.sender_id;
        }

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_type: 'shop',
                    sender_id: realShopId, // Send the best ID we have (slug or uuid)
                    recipient_id: 'super-admin',
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

    const markAsRead = async () => {
        try {
            // Get IDs of unread messages from super-admin
            const unreadIds = messages
                .filter(m => m.sender === 'super-admin' && !m.read_at)
                .map(m => m.id);

            if (unreadIds.length === 0) return;

            const response = await fetch('/api/messages', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message_ids: unreadIds
                })
            });

            const data = await response.json();

            if (data.success) {
                setUnreadCount(0);
                // Update local messages state to show as read
                setMessages(messages.map(m =>
                    unreadIds.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m
                ));
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Mensagens</h2>
                    <p className="text-gray-600 mt-1">Comunicação com a administração</p>
                </div>
                {unreadCount > 0 && (
                    <Badge variant="danger" className="text-lg px-4 py-2">
                        {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                    </Badge>
                )}
            </div>

            {/* Chat Interface */}
            <Card padding="none" className="h-[calc(100vh-16rem)] flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">Administração Lalelilo</h3>
                            <p className="text-sm text-gray-600">Suporte e anúncios</p>
                        </div>
                        {unreadCount > 0 && (
                            <Button variant="outline" size="sm" onClick={markAsRead}>
                                Marcar como lida
                            </Button>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <MessageSquare size={64} className="mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Nenhuma mensagem ainda
                                </h3>
                                <p className="text-gray-600">
                                    Envie uma mensagem para a administração
                                </p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id}>
                                {/* Broadcast Message */}
                                {msg.is_broadcast && (
                                    <div className="mb-4">
                                        <Card padding="md" className="bg-yellow-50 border-l-4 border-l-yellow-500">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-yellow-900 mb-1">Anúncio da Administração</p>
                                                    <p className="text-sm text-yellow-800">{msg.content}</p>
                                                    <p className="text-xs text-yellow-600 mt-2">
                                                        {new Date(msg.created_at).toLocaleString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                )}

                                {/* Regular Messages */}
                                {!msg.is_broadcast && (
                                    <div
                                        className={`flex ${msg.sender === 'shop' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg p-3 ${msg.sender === 'shop'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-200 text-gray-900'
                                                }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                <p className={`text-xs ${msg.sender === 'shop' ? 'text-purple-200' : 'text-gray-500'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {msg.sender === 'shop' && (
                                                    msg.read_at ? <CheckCheck size={14} /> : <Check size={14} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
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
                    <p className="text-xs text-gray-500 mt-2">
                        Envie mensagens para a administração da plataforma
                    </p>
                </div>
            </Card>
        </div>
    );
}
