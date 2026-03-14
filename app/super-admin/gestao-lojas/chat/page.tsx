'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Modal } from '@/components/ui';
import { MessageSquare, Send, Users, Search, Plus, Check, CheckCheck, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Shop { id: string; name: string; }

interface Message {
    id: string;
    sender: string;
    sender_id: string;
    recipient_id: string;
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

export default function ChatInternoGestaoPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedShop, setSelectedShop] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showBroadcast, setShowBroadcast] = useState(false);
    const [managedShops, setManagedShops] = useState<Shop[]>([]);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [managerId, setManagerId] = useState('');

    useEffect(() => {
        const init = async () => {
            try {
                const mgrRes = await fetch('/api/managers');
                const mgrData = await mgrRes.json();
                const mgr = (mgrData.managers || [])[0];
                if (!mgr) { setLoading(false); return; }
                setManagerId(mgr.id);

                const shopsRes = await fetch(`/api/managers/shops?managerId=${mgr.id}`);
                const shopsData = await shopsRes.json();
                const shops = shopsData.shops || [];
                setManagedShops(shops);

                const convs = shops.map((s: Shop) => ({
                    shop_id: s.id, shop_name: s.name,
                    last_message: 'Iniciar conversa', last_message_time: new Date().toISOString(), unread_count: 0
                }));
                setConversations(convs);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        init();
    }, []);

    useEffect(() => {
        if (selectedShop) {
            fetchMessages(selectedShop);
            const channel = supabase.channel(`gestao_chat_${selectedShop}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'internal_messages' }, () => fetchMessages(selectedShop))
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [selectedShop]);

    const fetchMessages = async (shopId: string) => {
        try {
            const res = await fetch(`/api/messages?isAdmin=true&shopId=${shopId}`);
            const data = await res.json();
            if (data.messages) setMessages(data.messages);
        } catch (e) { console.error(e); }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedShop) return;
        try {
            const res = await fetch('/api/messages', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender_type: 'super-admin', sender_id: managerId, recipient_id: selectedShop, content: newMessage })
            });
            const data = await res.json();
            if (data.success && data.message) { setMessages([...messages, data.message]); setNewMessage(''); }
        } catch (e) { console.error(e); alert('Erro ao enviar'); }
    };

    const sendBroadcast = async () => {
        if (!broadcastMessage.trim()) return;
        for (const shop of managedShops) {
            await fetch('/api/messages', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender_type: 'super-admin', sender_id: managerId, recipient_id: shop.id, content: broadcastMessage })
            });
        }
        alert(`Enviado para ${managedShops.length} lojas!`);
        setBroadcastMessage(''); setShowBroadcast(false);
    };

    const filtered = conversations.filter(c => c.shop_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const selectedName = conversations.find(c => c.shop_id === selectedShop)?.shop_name || '';

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500" /></div>;

    if (managedShops.length === 0) {
        return (
            <div className="text-center py-20">
                <MessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma loja atribuída</h3>
                <p className="text-gray-500">Adicione lojas em &quot;Minhas Lojas&quot; para usar o chat.</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="text-teal-600" size={28} />
                        Chat Interno — Gestão
                    </h2>
                    <p className="text-gray-600 mt-1">Comunique-se com as lojas gerenciadas</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => setShowBroadcast(true)}>
                    <Plus size={16} className="mr-2" /> Anúncio
                </Button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
                <Card padding="none" className="flex flex-col h-full">
                    <div className="p-3 border-b border-gray-200">
                        <Input placeholder="Buscar lojas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={<Search size={18} />} />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filtered.map(conv => (
                            <div key={conv.shop_id} onClick={() => setSelectedShop(conv.shop_id)}
                                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${selectedShop === conv.shop_id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''}`}>
                                <div className="flex items-start justify-between mb-1">
                                    <h4 className="font-semibold text-gray-900 text-sm">{conv.shop_name}</h4>
                                    {conv.unread_count > 0 && <Badge variant="danger">{conv.unread_count}</Badge>}
                                </div>
                                <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card padding="none" className="md:col-span-2 flex flex-col h-full">
                    {selectedShop ? (
                        <>
                            <div className="p-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="font-semibold text-gray-900">{selectedName}</h3>
                                <p className="text-sm text-gray-600">Loja</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender !== 'shop' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-lg p-3 ${msg.sender !== 'shop' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-900'}`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                <p className={`text-xs ${msg.sender !== 'shop' ? 'text-purple-200' : 'text-gray-500'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {msg.sender !== 'shop' && (msg.read_at ? <CheckCheck size={14} /> : <Check size={14} />)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-gray-200">
                                <div className="flex gap-2">
                                    <Input placeholder="Digite sua mensagem..." value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()} className="flex-1" />
                                    <Button variant="primary" onClick={sendMessage}><Send size={18} /></Button>
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

            {showBroadcast && (
                <Modal isOpen={showBroadcast} onClose={() => setShowBroadcast(false)} title="Anúncio para Lojas Gerenciadas" size="lg">
                    <div className="space-y-4">
                        <Card padding="md" className="bg-purple-50">
                            <div className="flex items-start gap-3">
                                <Users size={24} className="text-purple-600 mt-1" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-2">Enviar para {managedShops.length} lojas</h4>
                                    <textarea placeholder="Digite o anúncio..." value={broadcastMessage}
                                        onChange={(e) => setBroadcastMessage(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg resize-none text-gray-900" rows={3} />
                                    <Button variant="primary" size="sm" onClick={sendBroadcast} className="mt-2">
                                        <Send size={14} className="mr-1" /> Enviar
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </Modal>
            )}
        </div>
    );
}
