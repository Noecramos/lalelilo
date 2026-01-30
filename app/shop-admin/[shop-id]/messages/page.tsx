'use client';

import React, { useState, useEffect, use } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { MessageSquare, Send, Check, CheckCheck, AlertCircle } from 'lucide-react';

interface Message {
    id: string;
    sender: 'super-admin' | 'shop';
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
        // TODO: Replace with actual API call
        setTimeout(() => {
            setMessages([
                { id: '1', sender: 'super-admin', content: 'Olá! Como posso ajudar?', created_at: '2026-01-30T09:00:00', read_at: '2026-01-30T09:05:00' },
                { id: '2', sender: 'shop', content: 'Preciso de informações sobre o novo sistema de pagamento.', created_at: '2026-01-30T09:10:00', read_at: '2026-01-30T09:12:00' },
                { id: '3', sender: 'super-admin', content: 'Claro! O novo sistema será implementado na próxima semana.', created_at: '2026-01-30T09:15:00', read_at: '2026-01-30T09:20:00' },
                { id: '4', sender: 'shop', content: 'Obrigado pela informação!', created_at: '2026-01-30T09:30:00' },
                { id: '5', sender: 'super-admin', content: 'ANÚNCIO: Novo sistema de relatórios disponível a partir de segunda-feira!', created_at: '2026-01-29T14:00:00', is_broadcast: true },
            ]);
            setUnreadCount(2);
        }, 500);
    };

    const sendMessage = () => {
        if (!newMessage.trim()) return;

        const message: Message = {
            id: Date.now().toString(),
            sender: 'shop',
            content: newMessage,
            created_at: new Date().toISOString(),
        };

        setMessages([...messages, message]);
        setNewMessage('');

        // TODO: Send to API
    };

    const markAsRead = () => {
        // TODO: Mark all messages as read via API
        setUnreadCount(0);
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
