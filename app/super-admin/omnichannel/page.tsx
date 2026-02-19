'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui';
import {
    MessageSquare, Phone, Instagram, Facebook, Send, Search,
    Filter, Clock, CheckCheck, User, Building2, RefreshCw,
    Edit, Trash, Check, X, Archive, Wifi, WifiOff, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const CLIENT_ID = 'acb4b354-728f-479d-915a-c857d27da9ad';

interface Contact {
    id: string;
    name: string | null;
    phone: string | null;
    instagram_id: string | null;
    facebook_id: string | null;
}

interface Conversation {
    id: string;
    contact_id: string;
    channel_type: 'whatsapp' | 'instagram' | 'facebook';
    status: string;
    last_message_at: string;
    unread_count: number;
    assigned_to: string | null;
    contacts: Contact;
    shops?: { name: string };
}

interface Message {
    id: string;
    conversation_id: string;
    sender_type: 'contact' | 'agent' | 'system';
    channel_type: string;
    content_type: string;
    content: string;
    media_url: string | null;
    status: string;
    created_at: string;
    archived?: boolean;
}

interface SyncChannelResult {
    channel: string;
    success: boolean;
    new_messages?: number;
    conversations?: number;
    error?: string;
    session_status?: string;
}

const channelIcons = {
    whatsapp: Phone,
    instagram: Instagram,
    facebook: Facebook,
};

const channelColors = {
    whatsapp: 'text-green-600 bg-green-50',
    instagram: 'text-pink-600 bg-pink-50',
    facebook: 'text-blue-600 bg-blue-50',
};

const channelLabels = {
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    facebook: 'Facebook',
};

export default function OmnichannelPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'whatsapp' | 'instagram' | 'facebook'>('all');
    const [search, setSearch] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editedContent, setEditedContent] = useState('');
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [archivedMessages, setArchivedMessages] = useState<Message[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [syncResults, setSyncResults] = useState<SyncChannelResult[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchConversations();

        // Realtime subscription for new messages
        const channel = supabase
            .channel('omnichannel_messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                () => {
                    fetchConversations();
                    if (selectedConv) fetchMessages(selectedConv);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (selectedConv) {
            fetchMessages(selectedConv);
        }
    }, [selectedConv]);

    useEffect(() => {
        // Auto-scroll to bottom when messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    contacts (*),
                    shops (name)
                `)
                .eq('client_id', CLIENT_ID)
                .order('last_message_at', { ascending: false });

            if (error) throw error;
            setConversations(data || []);
        } catch (e) {
            console.error('Error fetching conversations:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const active = (data || []).filter(msg => !msg.archived);
            const archived = (data || []).filter(msg => msg.archived);

            setMessages(active);
            setArchivedMessages(archived);

            // Mark as read
            await supabase
                .from('conversations')
                .update({ unread_count: 0 })
                .eq('id', conversationId);

            fetchConversations();
        } catch (e) {
            console.error('Error fetching messages:', e);
        }
    };

    const syncAllChannels = async () => {
        setSyncing(true);
        setSyncResults([]);
        const results: SyncChannelResult[] = [];

        // 1. Sync WhatsApp via WAHA
        try {
            const waRes = await fetch('/api/sync/whatsapp?secret=lalelilo_verify_2026');
            const waData = await waRes.json();
            results.push({
                channel: 'whatsapp',
                success: waData.success === true,
                new_messages: waData.new_messages || 0,
                conversations: waData.conversations || 0,
                error: waData.error,
                session_status: waData.session_status,
            });
        } catch (e: any) {
            results.push({ channel: 'whatsapp', success: false, error: e.message });
        }

        // 2. Sync Facebook via Graph API
        try {
            const fbRes = await fetch('/api/sync/facebook?secret=lalelilo_verify_2026');
            const fbData = await fbRes.json();
            results.push({
                channel: 'facebook',
                success: fbData.success === true,
                new_messages: fbData.new_messages || 0,
                conversations: fbData.conversations || 0,
                error: fbData.error,
            });
        } catch (e: any) {
            results.push({ channel: 'facebook', success: false, error: e.message });
        }

        // 3. Sync Instagram via Graph API
        try {
            const igRes = await fetch('/api/sync/instagram?secret=lalelilo_verify_2026');
            const igData = await igRes.json();
            results.push({
                channel: 'instagram',
                success: igData.success === true,
                new_messages: igData.new_messages || 0,
                conversations: igData.conversations || 0,
                error: igData.error,
            });
        } catch (e: any) {
            results.push({ channel: 'instagram', success: false, error: e.message });
        }

        setSyncResults(results);

        // Refresh conversations list
        await fetchConversations();
        if (selectedConv) await fetchMessages(selectedConv);

        setSyncing(false);

        // Clear results after 8 seconds
        setTimeout(() => setSyncResults([]), 8000);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConv) return;

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: selectedConv,
                    sender_type: 'agent',
                    channel_type: conversations.find(c => c.id === selectedConv)?.channel_type,
                    content_type: 'text',
                    content: newMessage,
                    status: 'sent',
                })
                .select()
                .single();

            if (error) throw error;

            setMessages([...messages, data]);
            setNewMessage('');

            await supabase
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', selectedConv);

            fetchConversations();
        } catch (e) {
            console.error('Error sending message:', e);
        }
    };

    const startEditMessage = (messageId: string, currentContent: string) => {
        setEditingMessageId(messageId);
        setEditedContent(currentContent);
    };

    const saveEditMessage = async (messageId: string) => {
        if (!editedContent.trim()) return;

        try {
            const { error } = await supabase
                .from('messages')
                .update({ content: editedContent })
                .eq('id', messageId);

            if (error) throw error;

            setMessages(messages.map(msg =>
                msg.id === messageId ? { ...msg, content: editedContent } : msg
            ));
            setEditingMessageId(null);
            setEditedContent('');
        } catch (e) {
            console.error('Error editing message:', e);
            alert('Erro ao editar mensagem');
        }
    };

    const cancelEdit = () => {
        setEditingMessageId(null);
        setEditedContent('');
    };

    const deleteMessage = async (messageId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

        try {
            const res = await fetch(`/api/messages?id=${messageId}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete');
            }

            setMessages(messages.filter(msg => msg.id !== messageId));
            setArchivedMessages(archivedMessages.filter(msg => msg.id !== messageId));
        } catch (e) {
            console.error('Error deleting message:', e);
            alert('Erro ao excluir mensagem: ' + (e instanceof Error ? e.message : String(e)));
        }
    };

    const archiveMessage = async (messageId: string) => {
        try {
            const messageToArchive = messages.find(msg => msg.id === messageId);
            if (!messageToArchive) return;

            const { error } = await supabase
                .from('messages')
                .update({ archived: true })
                .eq('id', messageId);

            if (error) throw error;

            setArchivedMessages([...archivedMessages, { ...messageToArchive, archived: true }]);
            setMessages(messages.filter(msg => msg.id !== messageId));
        } catch (e) {
            console.error('Error archiving message:', e);
            alert('Erro ao arquivar mensagem');
        }
    };

    // Filter conversations
    let filtered = conversations;
    if (filter !== 'all') {
        filtered = filtered.filter(c => c.channel_type === filter);
    }
    if (search) {
        filtered = filtered.filter(c =>
            c.contacts?.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.contacts?.phone?.includes(search)
        );
    }

    const selectedConversation = conversations.find(c => c.id === selectedConv);
    const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lale-orange" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <MessageSquare className="text-lale-orange" size={32} />
                            Central de Comunicação
                        </h1>
                        <p className="text-gray-500 mt-1">
                            WhatsApp, Instagram e Facebook em um só lugar
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Sync Results */}
                        {syncResults.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {syncResults.map((r) => (
                                    <span
                                        key={r.channel}
                                        className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${r.success
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                            }`}
                                        title={r.error || `${r.new_messages} novas msgs`}
                                    >
                                        {r.success ? <Wifi size={10} /> : <AlertTriangle size={10} />}
                                        {channelLabels[r.channel as keyof typeof channelLabels]}:
                                        {r.success
                                            ? ` +${r.new_messages} msgs`
                                            : ' ⚠'
                                        }
                                    </span>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={syncAllChannels}
                            disabled={syncing}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-lale-pink to-lale-orange text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
                        >
                            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                            {syncing ? 'Sincronizando...' : 'Sincronizar Tudo'}
                        </button>
                        <button
                            onClick={fetchConversations}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Atualizar lista"
                        >
                            <RefreshCw size={20} className="text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <Card padding="md" className={`text-center cursor-pointer hover:shadow-md transition-shadow ${filter === 'all' ? 'ring-2 ring-lale-orange' : ''}`} onClick={() => setFilter('all')}>
                    <MessageSquare size={24} className="text-gray-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
                    <p className="text-xs text-gray-500">Total</p>
                    {totalUnread > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {totalUnread} não lidas
                        </span>
                    )}
                </Card>
                <Card padding="md" className={`text-center cursor-pointer hover:shadow-md transition-shadow ${filter === 'whatsapp' ? 'ring-2 ring-green-500' : ''}`} onClick={() => setFilter(filter === 'whatsapp' ? 'all' : 'whatsapp')}>
                    <Phone size={24} className="text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                        {conversations.filter(c => c.channel_type === 'whatsapp').length}
                    </p>
                    <p className="text-xs text-gray-500">WhatsApp</p>
                </Card>
                <Card padding="md" className={`text-center cursor-pointer hover:shadow-md transition-shadow ${filter === 'instagram' ? 'ring-2 ring-pink-500' : ''}`} onClick={() => setFilter(filter === 'instagram' ? 'all' : 'instagram')}>
                    <Instagram size={24} className="text-pink-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                        {conversations.filter(c => c.channel_type === 'instagram').length}
                    </p>
                    <p className="text-xs text-gray-500">Instagram</p>
                </Card>
                <Card padding="md" className={`text-center cursor-pointer hover:shadow-md transition-shadow ${filter === 'facebook' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setFilter(filter === 'facebook' ? 'all' : 'facebook')}>
                    <Facebook size={24} className="text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                        {conversations.filter(c => c.channel_type === 'facebook').length}
                    </p>
                    <p className="text-xs text-gray-500">Facebook</p>
                </Card>
            </div>

            {/* Chat Interface */}
            <div className="grid grid-cols-1 gap-4">
                {/* Conversations List */}
                <Card padding="none" className="flex flex-col" style={{ height: '600px' }}>
                    <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar conversas..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                            />
                        </div>
                        {filter !== 'all' && (
                            <button
                                onClick={() => setFilter('all')}
                                className="mt-2 text-xs text-lale-orange hover:underline"
                            >
                                Limpar filtro ({channelLabels[filter]})
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <MessageSquare size={48} className="mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-500">Nenhuma conversa encontrada</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Clique em &quot;Sincronizar Tudo&quot; para buscar mensagens
                                </p>
                            </div>
                        ) : (
                            filtered.map((conv) => {
                                const ChannelIcon = channelIcons[conv.channel_type] || MessageSquare;
                                const channelColor = channelColors[conv.channel_type] || 'text-gray-600 bg-gray-50';
                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => setSelectedConv(conv.id)}
                                        className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${selectedConv === conv.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${channelColor}`}>
                                                <ChannelIcon size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-semibold text-gray-900 truncate">
                                                        {conv.contacts?.name || conv.contacts?.phone || 'Sem nome'}
                                                    </h4>
                                                    {conv.unread_count > 0 && (
                                                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                                            {conv.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${channelColor}`}>
                                                        {conv.channel_type}
                                                    </span>
                                                    {conv.contacts?.phone && (
                                                        <span className="text-xs text-gray-400">{conv.contacts.phone}</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                    <Clock size={12} />
                                                    {new Date(conv.last_message_at).toLocaleString('pt-BR')}
                                                </p>
                                                {conv.shops && (
                                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                        <Building2 size={12} />
                                                        {conv.shops.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>
            </div>

            {/* Chat Modal - Opens when conversation is selected */}
            {selectedConversation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedConv(null)}>
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${channelColors[selectedConversation.channel_type]}`}>
                                        {React.createElement(channelIcons[selectedConversation.channel_type] || MessageSquare, { size: 20 })}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {selectedConversation.contacts?.name || selectedConversation.contacts?.phone || 'Sem nome'}
                                        </h3>
                                        <p className="text-sm text-gray-600 capitalize">
                                            {selectedConversation.channel_type}
                                            {selectedConversation.contacts?.phone && ` • ${selectedConversation.contacts.phone}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Histórico Button */}
                                    {archivedMessages.length > 0 && (
                                        <button
                                            onClick={() => setShowArchived(!showArchived)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showArchived
                                                ? 'bg-yellow-500 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                        >
                                            <Archive size={18} />
                                            <span className="font-medium">Histórico</span>
                                            <span className="px-2 py-0.5 bg-white bg-opacity-30 rounded-full text-xs font-bold">
                                                {archivedMessages.length}
                                            </span>
                                        </button>
                                    )}

                                    {/* Archive Conversation Button */}
                                    <button
                                        onClick={async () => {
                                            if (confirm('Arquivar esta conversa?')) {
                                                try {
                                                    await fetch(`/api/messaging`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ action: 'archive_conversation', conversationId: selectedConv }),
                                                    });
                                                    if (selectedConv) fetchMessages(selectedConv);
                                                } catch (e) {
                                                    console.error('Error archiving:', e);
                                                }
                                            }
                                        }}
                                        className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                                        title="Arquivar conversa"
                                    >
                                        <Archive size={20} />
                                    </button>

                                    {/* Delete Conversation Button */}
                                    <button
                                        onClick={async () => {
                                            if (confirm('Excluir esta conversa e todas as mensagens?')) {
                                                try {
                                                    const res = await fetch(`/api/messages?conversationId=${selectedConv}`, { method: 'DELETE' });
                                                    if (res.ok) {
                                                        setSelectedConv(null);
                                                        fetchConversations();
                                                    }
                                                } catch (e) {
                                                    console.error('Error deleting conversation:', e);
                                                }
                                            }
                                        }}
                                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                        title="Excluir conversa"
                                    >
                                        <Trash size={20} />
                                    </button>

                                    {/* Close Modal Button */}
                                    <button
                                        onClick={() => setSelectedConv(null)}
                                        className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                        title="Fechar"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {!showArchived && messages.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageSquare size={48} className="mx-auto text-gray-400 mb-3" />
                                    <p className="text-gray-500">Nenhuma mensagem ainda</p>
                                    <p className="text-sm text-gray-400 mt-1">Envie uma mensagem para começar</p>
                                </div>
                            ) : !showArchived ? (
                                // Active messages
                                <>
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'} mb-4`}
                                            onMouseEnter={() => setHoveredMessageId(msg.id)}
                                            onMouseLeave={() => setHoveredMessageId(null)}
                                        >
                                            <div className="relative group">
                                                <div
                                                    className={`max-w-[70%] min-w-[120px] rounded-lg p-3 ${msg.sender_type === 'agent'
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-white text-gray-900 border border-gray-200'
                                                        }`}
                                                >
                                                    {editingMessageId === msg.id ? (
                                                        <div className="space-y-2">
                                                            <textarea
                                                                value={editedContent}
                                                                onChange={(e) => setEditedContent(e.target.value)}
                                                                className="w-full p-2 text-sm border border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                                                rows={3}
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => saveEditMessage(msg.id)}
                                                                    className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center gap-1"
                                                                >
                                                                    <Check size={12} /> Salvar
                                                                </button>
                                                                <button
                                                                    onClick={cancelEdit}
                                                                    className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 flex items-center gap-1"
                                                                >
                                                                    <X size={12} /> Cancelar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {msg.content && msg.content.trim() !== '' ? (
                                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                            ) : (
                                                                <p className="text-sm italic text-gray-400">Mídia enviada</p>
                                                            )}
                                                            {msg.media_url && (
                                                                <img src={msg.media_url} alt="Media" className="mt-2 rounded-lg max-w-full" />
                                                            )}
                                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                                <p className={`text-xs ${msg.sender_type === 'agent' ? 'text-purple-200' : 'text-gray-500'}`}>
                                                                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                                {msg.sender_type === 'agent' && msg.status === 'delivered' && (
                                                                    <CheckCheck size={14} />
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Message actions (hover) */}
                                                {hoveredMessageId === msg.id && editingMessageId !== msg.id && (
                                                    <div className={`absolute top-0 ${msg.sender_type === 'agent' ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex gap-1 px-1`}>
                                                        <button
                                                            onClick={() => startEditMessage(msg.id, msg.content)}
                                                            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => archiveMessage(msg.id)}
                                                            className="p-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                                                            title="Arquivar"
                                                        >
                                                            <Archive size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteMessage(msg.id)}
                                                            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </>
                            ) : (
                                // Archived messages view
                                <>
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                                            <Archive size={20} />
                                            Histórico de Mensagens Arquivadas
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {archivedMessages.length} {archivedMessages.length === 1 ? 'mensagem arquivada' : 'mensagens arquivadas'}
                                        </p>
                                    </div>

                                    {archivedMessages.map((msg) => (
                                        <div key={msg.id} className="flex items-start gap-3 mb-4 opacity-75">
                                            <div className={`flex-1 flex ${msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] rounded-lg p-3 ${msg.sender_type === 'agent'
                                                    ? 'bg-purple-400 text-white'
                                                    : 'bg-gray-200 text-gray-700 border border-gray-300'
                                                    }`}>
                                                    {msg.content && msg.content.trim() !== '' ? (
                                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                    ) : (
                                                        <p className="text-sm italic text-gray-400">Mídia enviada</p>
                                                    )}
                                                    {msg.media_url && <img src={msg.media_url} alt="Media" className="mt-2 rounded-lg max-w-full" />}
                                                    <div className="flex items-center justify-between gap-2 mt-1">
                                                        <span className="text-xs italic">Arquivada</span>
                                                        <p className={`text-xs ${msg.sender_type === 'agent' ? 'text-purple-100' : 'text-gray-500'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5 pt-1">
                                                <button
                                                    onClick={() => deleteMessage(msg.id)}
                                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md transition-colors"
                                                    title="Excluir permanentemente"
                                                >
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Digite sua mensagem..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                />
                                <button
                                    onClick={sendMessage}
                                    className="px-4 py-2 bg-lale-orange text-white rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
