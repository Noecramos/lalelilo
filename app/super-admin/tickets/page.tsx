'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import {
    TicketCheck, Plus, Clock, AlertCircle, CheckCircle2,
    ChevronRight, Filter, ArrowUpCircle, ArrowDownCircle, MinusCircle,
    Camera, X, Upload
} from 'lucide-react';

const CLIENT_ID = 'acb4b354-728f-479d-915a-c857d27da9ad';

interface Ticket {
    id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    category: string;
    shop_id: string;
    assigned_to: string;
    created_at: string;
    shops?: { name: string };
    assigned_user?: { name: string };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
    open: { label: 'Aberto', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200', icon: AlertCircle },
    in_progress: { label: 'Em Andamento', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', icon: Clock },
    resolved: { label: 'Resolvido', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200', icon: CheckCircle2 },
    closed: { label: 'Fechado', color: 'text-gray-500', bgColor: 'bg-gray-50 border-gray-200', icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    critical: { label: 'Crítica', color: 'bg-red-100 text-red-700', icon: ArrowUpCircle },
    high: { label: 'Alta', color: 'bg-orange-100 text-orange-700', icon: ArrowUpCircle },
    medium: { label: 'Média', color: 'bg-yellow-100 text-yellow-700', icon: MinusCircle },
    low: { label: 'Baixa', color: 'bg-green-100 text-green-700', icon: ArrowDownCircle },
};

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium', category: 'operational', shop_id: '' });
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tickets?action=list&client_id=${CLIENT_ID}`);
            const data = await res.json();
            setTickets(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const createTicket = async () => {
        if (!newTicket.title || !newTicket.description) {
            alert('Preencha título e descrição');
            return;
        }

        setUploading(true);
        try {
            await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    clientId: CLIENT_ID,
                    ...newTicket,
                    attachments: uploadedFiles.map(f => f.name)
                }),
            });
            setShowForm(false);
            setNewTicket({ title: '', description: '', priority: 'medium', category: 'operational', shop_id: '' });
            setUploadedFiles([]);
            fetchTickets();
            alert('Ticket criado com sucesso!');
        } catch (e) {
            console.error(e);
            alert('Erro ao criar ticket');
        } finally {
            setUploading(false);
        }
    };

    const updateStatus = async (ticketId: string, status: string) => {
        try {
            await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_status', ticketId, status }),
            });
            fetchTickets();
        } catch (e) { console.error(e); }
    };

    const filtered = filterStatus === 'all' ? tickets : tickets.filter(t => t.status === filterStatus);
    const statuses = ['open', 'in_progress', 'resolved', 'closed'] as const;

    const countByStatus = (s: string) => tickets.filter(t => t.status === s).length;
    const countByPriority = (p: string) => tickets.filter(t => t.priority === p).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-lale-orange" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <TicketCheck className="text-lale-orange" size={28} />
                        Tickets & Ocorrências
                    </h2>
                    <p className="text-gray-500 mt-1">Gerencie problemas e melhorias das lojas</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-lale-orange to-lale-pink text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-md"
                >
                    <Plus size={18} /> Novo Ticket
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {statuses.map(s => {
                    const cfg = statusConfig[s];
                    const StatusIcon = cfg.icon;
                    return (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
                            className={`p-4 rounded-xl border-2 transition-all ${filterStatus === s ? 'ring-2 ring-lale-orange ring-offset-2' : ''
                                } ${cfg.bgColor}`}
                        >
                            <div className="flex items-center gap-2">
                                <StatusIcon size={18} className={cfg.color} />
                                <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{countByStatus(s)}</p>
                        </button>
                    );
                })}
            </div>

            {/* Create Ticket Form */}
            {showForm && (
                <Card padding="md">
                    <h3 className="font-semibold text-gray-900 mb-4">Criar Novo Ticket</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                            <input
                                type="text"
                                value={newTicket.title}
                                onChange={e => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Descreva o problema..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                            <textarea
                                value={newTicket.description}
                                onChange={e => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                placeholder="Detalhes adicionais..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                            <select
                                value={newTicket.priority}
                                onChange={e => setNewTicket(prev => ({ ...prev, priority: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="low">Baixa</option>
                                <option value="medium">Média</option>
                                <option value="high">Alta</option>
                                <option value="critical">Crítica</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                            <select
                                value={newTicket.category}
                                onChange={e => setNewTicket(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="eletrica">⚡ Elétrica</option>
                                <option value="tecnologia">💻 Tecnologia</option>
                                <option value="estrutura">🏗️ Estrutura</option>
                                <option value="mobiliario">🪑 Mobiliário</option>
                                <option value="climatizacao">🌡️ Climatização</option>
                                <option value="hidraulica">🚰 Hidráulica</option>
                                <option value="seguranca">🔒 Segurança</option>
                                <option value="pintura">🎨 Pintura</option>
                                <option value="limpeza">🧹 Limpeza Especial</option>
                                <option value="equipamentos">📦 Equipamentos</option>
                                <option value="portas_janelas">🚪 Portas/Janelas</option>
                                <option value="outros">🛠️ Outros</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={createTicket}
                            disabled={!newTicket.title}
                            className="px-4 py-2 bg-lale-orange text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            Criar Ticket
                        </button>
                    </div>
                </Card>
            )}

            {/* Ticket List */}
            <Card padding="none">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Filter size={16} className="text-gray-400" />
                        {filterStatus === 'all' ? 'Todos os Tickets' : statusConfig[filterStatus]?.label}
                        <span className="text-sm font-normal text-gray-400">({filtered.length})</span>
                    </h3>
                </div>
                {filtered.length === 0 ? (
                    <div className="px-5 py-16 text-center">
                        <TicketCheck size={48} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Nenhum ticket encontrado</p>
                        <p className="text-gray-400 text-sm mt-1">Crie um novo ticket clicando no botão acima</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filtered.map(ticket => {
                            const sCfg = statusConfig[ticket.status] || statusConfig.open;
                            const pCfg = priorityConfig[ticket.priority] || priorityConfig.medium;
                            const PIcon = pCfg.icon;
                            return (
                                <div key={ticket.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 p-1.5 rounded-lg ${sCfg.bgColor}`}>
                                            <sCfg.icon size={16} className={sCfg.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-medium text-gray-900">{ticket.title}</p>
                                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${pCfg.color}`}>
                                                    <PIcon size={12} /> {pCfg.label}
                                                </span>
                                            </div>
                                            {ticket.description && (
                                                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{ticket.description}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                <span>{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
                                                <span className="capitalize">{ticket.category?.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {ticket.status !== 'closed' && (
                                                <select
                                                    value={ticket.status}
                                                    onChange={e => updateStatus(ticket.id, e.target.value)}
                                                    className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
                                                >
                                                    <option value="open">Aberto</option>
                                                    <option value="in_progress">Em Andamento</option>
                                                    <option value="resolved">Resolvido</option>
                                                    <option value="closed">Fechar</option>
                                                </select>
                                            )}
                                            <ChevronRight size={16} className="text-gray-300" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Priority Summary */}
            {
                tickets.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(priorityConfig).map(([key, cfg]) => {
                            const PIcon = cfg.icon;
                            return (
                                <div key={key} className={`p-3 rounded-lg ${cfg.color} text-center`}>
                                    <PIcon size={18} className="mx-auto mb-1" />
                                    <p className="text-lg font-bold">{countByPriority(key)}</p>
                                    <p className="text-xs font-medium">{cfg.label}</p>
                                </div>
                            );
                        })}
                    </div>
                )
            }

            {/* Create Ticket Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <TicketCheck className="text-lale-orange" size={24} />
                                Novo Ticket
                            </h3>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setUploadedFiles([]);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-6 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Título <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newTicket.title}
                                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                    placeholder="Ex: Problema na vitrine"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                    placeholder="Descreva o problema em detalhes..."
                                />
                            </div>

                            {/* Priority & Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                                    <select
                                        value={newTicket.priority}
                                        onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                    >
                                        <option value="low">Baixa</option>
                                        <option value="medium">Média</option>
                                        <option value="high">Alta</option>
                                        <option value="critical">Crítica</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <select
                                        value={newTicket.category}
                                        onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                    >
                                        <option value="operational">Operacional</option>
                                        <option value="maintenance">Manutenção</option>
                                        <option value="inventory">Estoque</option>
                                        <option value="customer_service">Atendimento</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Anexos (Fotos/Documentos)
                                </label>

                                {/* Upload Buttons */}
                                <div className="flex gap-2 mb-3">
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            multiple
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    setUploadedFiles([...uploadedFiles, ...Array.from(e.target.files)]);
                                                }
                                            }}
                                            className="hidden"
                                        />
                                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg border-2 border-blue-200 hover:bg-blue-100 transition-colors">
                                            <Camera size={18} />
                                            <span className="text-sm font-medium">Tirar Foto</span>
                                        </div>
                                    </label>

                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            multiple
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    setUploadedFiles([...uploadedFiles, ...Array.from(e.target.files)]);
                                                }
                                            }}
                                            className="hidden"
                                        />
                                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg border-2 border-purple-200 hover:bg-purple-100 transition-colors">
                                            <Upload size={18} />
                                            <span className="text-sm font-medium">Escolher Arquivo</span>
                                        </div>
                                    </label>
                                </div>

                                {/* File Preview */}
                                {uploadedFiles.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {uploadedFiles.map((file, idx) => (
                                            <div key={idx} className="relative group">
                                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                    {file.type.startsWith('image/') ? (
                                                        <img
                                                            src={URL.createObjectURL(file)}
                                                            alt={file.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <Upload size={32} />
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                                <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setUploadedFiles([]);
                                }}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={createTicket}
                                disabled={uploading || !newTicket.title || !newTicket.description}
                                className="px-6 py-2 bg-gradient-to-r from-lale-orange to-lale-pink text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? 'Criando...' : 'Criar Ticket'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
