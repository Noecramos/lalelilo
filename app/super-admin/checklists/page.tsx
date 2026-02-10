'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import {
    ClipboardCheck, ListChecks, Camera, ToggleLeft,
    FileText, ChevronDown, ChevronUp, CheckCircle2,
    AlertTriangle, Clock, Hash
} from 'lucide-react';

const CLIENT_ID = 'acb4b354-728f-479d-915a-c857d27da9ad';

interface TemplateItem {
    id: string;
    section: string;
    question: string;
    input_type: string;
    is_required: boolean;
    order_index: number;
    auto_ticket_on_fail: boolean;
    ticket_priority: string;
    fail_values: string[];
}

interface Template {
    id: string;
    name: string;
    category: string;
    description: string;
    is_active: boolean;
    created_at: string;
    checklist_template_items: TemplateItem[];
}

export default function ChecklistsPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState<string | null>(null);
    const [previewAnswers, setPreviewAnswers] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/checklists?action=templates&client_id=${CLIENT_ID}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setTemplates(data);
            } else if (data && data.checklist_template_items) {
                setTemplates([data]);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const inputIcon = (type: string) => {
        const map: Record<string, React.ReactNode> = {
            boolean: <ToggleLeft size={16} className="text-blue-500" />,
            photo: <Camera size={16} className="text-purple-500" />,
            text: <FileText size={16} className="text-gray-500" />,
            number: <Hash size={16} className="text-green-500" />,
            select: <ListChecks size={16} className="text-orange-500" />,
        };
        return map[type] || <FileText size={16} className="text-gray-400" />;
    };

    const inputLabel = (type: string) => {
        const map: Record<string, string> = {
            boolean: 'Sim/Não', photo: 'Foto', text: 'Texto',
            number: 'Número', select: 'Seleção',
        };
        return map[type] || type;
    };

    const groupItemsBySection = (items: TemplateItem[]) => {
        const sections: Record<string, TemplateItem[]> = {};
        [...items].sort((a, b) => a.order_index - b.order_index).forEach(item => {
            const section = item.section || 'Geral';
            if (!sections[section]) sections[section] = [];
            sections[section].push(item);
        });
        return sections;
    };

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
                        <ClipboardCheck className="text-lale-orange" size={28} />
                        Checklists & Vistorias
                    </h2>
                    <p className="text-gray-500 mt-1">Modelos de inspeção e vistorias diárias</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2.5 rounded-lg">
                            <ClipboardCheck className="text-green-600" size={22} />
                        </div>
                        <div>
                            <p className="text-sm text-green-700 font-medium">Templates Ativos</p>
                            <p className="text-2xl font-bold text-gray-900">{templates.filter(t => t.is_active).length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2.5 rounded-lg">
                            <ListChecks className="text-blue-600" size={22} />
                        </div>
                        <div>
                            <p className="text-sm text-blue-700 font-medium">Total de Perguntas</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {templates.reduce((sum, t) => sum + (t.checklist_template_items?.length || 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2.5 rounded-lg">
                            <AlertTriangle className="text-orange-600" size={22} />
                        </div>
                        <div>
                            <p className="text-sm text-orange-700 font-medium">Auto-Ticket Ativo</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {templates.reduce((sum, t) => sum + (t.checklist_template_items?.filter(i => i.auto_ticket_on_fail).length || 0), 0)}
                            </p>
                            <p className="text-xs text-orange-600">Itens que criam tickets ao falhar</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Templates */}
            {templates.map(template => {
                const isExpanded = expandedTemplate === template.id;
                const isPreview = previewMode === template.id;
                const sections = groupItemsBySection(template.checklist_template_items || []);
                const totalItems = template.checklist_template_items?.length || 0;
                const autoTicketItems = template.checklist_template_items?.filter(i => i.auto_ticket_on_fail).length || 0;

                return (
                    <Card key={template.id} padding="none">
                        {/* Template Header */}
                        <button
                            onClick={() => {
                                setExpandedTemplate(isExpanded ? null : template.id);
                                setPreviewMode(null);
                                setPreviewAnswers({});
                            }}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-gradient-to-br from-lale-orange to-lale-pink p-3 rounded-xl">
                                    <ClipboardCheck size={22} className="text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium capitalize">
                                            {template.category?.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <ListChecks size={12} /> {totalItems} itens
                                        </span>
                                        {autoTicketItems > 0 && (
                                            <span className="text-xs text-orange-600 flex items-center gap-1">
                                                <AlertTriangle size={12} /> {autoTicketItems} auto-tickets
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {template.is_active ? 'Ativo' : 'Inativo'}
                                </span>
                                {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                            </div>
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                            <div className="border-t border-gray-100">
                                {/* Toggle Preview Mode */}
                                <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                                    <span className="text-sm text-gray-600">
                                        {isPreview ? '📱 Modo Pré-Visualização' : '📋 Estrutura do Template'}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setPreviewMode(isPreview ? null : template.id);
                                            setPreviewAnswers({});
                                        }}
                                        className="text-sm text-lale-orange hover:underline font-medium"
                                    >
                                        {isPreview ? 'Ver Estrutura' : 'Simular Preenchimento'}
                                    </button>
                                </div>

                                {isPreview ? (
                                    /* Preview Mode - Simulates filling out the checklist */
                                    <div className="p-5 max-w-lg mx-auto space-y-6">
                                        {Object.entries(sections).map(([section, items]) => (
                                            <div key={section}>
                                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-lale-orange rounded-full" />
                                                    {section}
                                                </h4>
                                                <div className="space-y-3">
                                                    {items.map(item => (
                                                        <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                                            <label className="block text-sm font-medium text-gray-800 mb-2">
                                                                {item.question}
                                                                {item.is_required && <span className="text-red-500 ml-1">*</span>}
                                                            </label>
                                                            {item.input_type === 'boolean' && (
                                                                <div className="flex gap-2">
                                                                    {['Sim', 'Não'].map(opt => (
                                                                        <button
                                                                            key={opt}
                                                                            onClick={() => setPreviewAnswers(p => ({ ...p, [item.id]: opt.toLowerCase() === 'sim' ? 'true' : 'false' }))}
                                                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${previewAnswers[item.id] === (opt.toLowerCase() === 'sim' ? 'true' : 'false')
                                                                                    ? opt === 'Sim' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                                }`}
                                                                        >
                                                                            {opt}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {item.input_type === 'text' && (
                                                                <textarea
                                                                    placeholder="Digite aqui..."
                                                                    rows={2}
                                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-lale-orange focus:border-transparent"
                                                                    onChange={e => setPreviewAnswers(p => ({ ...p, [item.id]: e.target.value }))}
                                                                />
                                                            )}
                                                            {item.input_type === 'photo' && (
                                                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                                                                    <Camera size={28} className="mx-auto text-gray-300 mb-2" />
                                                                    <p className="text-xs text-gray-400">Toque para tirar foto</p>
                                                                </div>
                                                            )}
                                                            {item.input_type === 'select' && (
                                                                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                                                                    <option value="">Selecione...</option>
                                                                    <option value="otimo">Ótimo</option>
                                                                    <option value="bom">Bom</option>
                                                                    <option value="regular">Regular</option>
                                                                    <option value="ruim">Ruim</option>
                                                                    <option value="pessimo">Péssimo</option>
                                                                </select>
                                                            )}
                                                            {item.auto_ticket_on_fail && (
                                                                <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                                                                    <AlertTriangle size={12} /> Cria ticket automático se falhar ({item.ticket_priority})
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <button className="w-full py-3 bg-gradient-to-r from-lale-orange to-lale-pink text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                                            Enviar Checklist (Simulação)
                                        </button>
                                    </div>
                                ) : (
                                    /* Structure Mode */
                                    <div className="p-5">
                                        {Object.entries(sections).map(([section, items]) => (
                                            <div key={section} className="mb-6 last:mb-0">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-gradient-to-r from-lale-orange to-lale-pink rounded-full" />
                                                    {section}
                                                </h4>
                                                <div className="space-y-1.5">
                                                    {items.map(item => (
                                                        <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                                                            <span className="text-xs text-gray-300 font-mono w-5">{item.order_index}</span>
                                                            {inputIcon(item.input_type)}
                                                            <span className="flex-1 text-sm text-gray-800">{item.question}</span>
                                                            <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 rounded">
                                                                {inputLabel(item.input_type)}
                                                            </span>
                                                            {item.is_required && (
                                                                <span className="text-xs text-red-400">Obrig.</span>
                                                            )}
                                                            {item.auto_ticket_on_fail && (
                                                                <span className="text-xs text-orange-500">
                                                                    <AlertTriangle size={14} />
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                );
            })}

            {templates.length === 0 && (
                <div className="text-center py-16">
                    <ClipboardCheck size={48} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Nenhum template de checklist encontrado</p>
                </div>
            )}
        </div>
    );
}
