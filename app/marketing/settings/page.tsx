'use client';

import React from 'react';
import { Settings, Bell, Shield, Palette, Globe, Info } from 'lucide-react';

export default function MarketingSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="text-lale-pink" size={28} />
                    Configurações
                </h2>
                <p className="text-gray-500 mt-1">Configurações do painel de marketing</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Notifications */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                            <Bell size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Notificações</h3>
                            <p className="text-xs text-gray-500">Configurar alertas de campanhas</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Notificar quando campanha expirar', desc: 'Receba alertas 3 dias antes do fim' },
                            { label: 'Notificar novas confirmações', desc: 'Quando uma loja confirmar recebimento' },
                            { label: 'Resumo semanal por email', desc: 'Relatório consolidado toda segunda-feira' },
                        ].map((opt, i) => (
                            <label key={i} className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" defaultChecked={i < 2} className="mt-1 rounded border-gray-300 text-lale-pink focus:ring-lale-pink" />
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                                    <p className="text-xs text-gray-500">{opt.desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Access */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
                            <Shield size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Acesso & Permissões</h3>
                            <p className="text-xs text-gray-500">Controle quem pode gerenciar campanhas</p>
                        </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-2">
                            <Info size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">Em breve</p>
                                <p className="text-xs text-amber-600 mt-1">
                                    O controle de permissões por usuário será habilitado em uma próxima
                                    atualização. Atualmente, todos os usuários com acesso ao painel de marketing
                                    podem criar e editar campanhas.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branding */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl">
                            <Palette size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Aparência</h3>
                            <p className="text-xs text-gray-500">Personalizar visuais das campanhas</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Tipos de campanha padrão</label>
                            <div className="flex flex-wrap gap-2">
                                {['🌸 Sazonal', '🖤 Black Friday', '🚀 Lançamento', '🔥 Promoção', '📢 Geral'].map(t => (
                                    <span key={t} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">{t}</span>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Tipos personalizados estarão disponíveis em breve</p>
                        </div>
                    </div>
                </div>

                {/* General */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl">
                            <Globe size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Geral</h3>
                            <p className="text-xs text-gray-500">Configurações gerais do módulo</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Prazo padrão de confirmação (dias)</label>
                            <input type="number" defaultValue={7} min={1} max={30} className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-lale-pink/30" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Alerta de expiração (dias antes)</label>
                            <input type="number" defaultValue={3} min={1} max={14} className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-lale-pink/30" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
                <button className="px-6 py-2.5 bg-gradient-to-r from-lale-pink to-lale-orange text-white rounded-xl font-medium hover:opacity-90 shadow-md transition-all">
                    Salvar Configurações
                </button>
            </div>
        </div>
    );
}
