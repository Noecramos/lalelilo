'use client';

import React, { useState, use } from 'react';
import { Card, Button, Input, Loading } from '@/components/ui';
import { Save, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function SettingsPage({
    params
}: {
    params: Promise<{ 'shop-id': string }>;
}) {
    const { 'shop-id': shopId } = use(params);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Shop settings state
    const [settings, setSettings] = useState({
        name: 'Lalelilo - Loja Centro',
        phone: '(81) 3333-4444',
        whatsapp: '(81) 99999-8888',
        email: 'centro@lalelilo.com.br',
        address: 'Rua do Comércio, 123',
        city: 'Recife',
        state: 'PE',
        cep: '50010-000',
        delivery_radius: '5000',
        pix_key: '',
        pix_name: '',
        business_hours: {
            monday: { open: '09:00', close: '18:00', closed: false },
            tuesday: { open: '09:00', close: '18:00', closed: false },
            wednesday: { open: '09:00', close: '18:00', closed: false },
            thursday: { open: '09:00', close: '18:00', closed: false },
            friday: { open: '09:00', close: '18:00', closed: false },
            saturday: { open: '09:00', close: '14:00', closed: false },
            sunday: { open: '00:00', close: '00:00', closed: true }
        }
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            // TODO: Replace with actual API call
            // await fetch(`/api/shops/${shopId}`, {
            //   method: 'PUT',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(settings)
            // });

            setTimeout(() => {
                alert('Configurações salvas com sucesso!');
                setSaving(false);
            }, 1000);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar configurações');
            setSaving(false);
        }
    };

    const weekDays = [
        { key: 'monday', label: 'Segunda-feira' },
        { key: 'tuesday', label: 'Terça-feira' },
        { key: 'wednesday', label: 'Quarta-feira' },
        { key: 'thursday', label: 'Quinta-feira' },
        { key: 'friday', label: 'Sexta-feira' },
        { key: 'saturday', label: 'Sábado' },
        { key: 'sunday', label: 'Domingo' }
    ];

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
                    <p className="text-gray-600 mt-1">
                        Gerencie as informações da sua loja
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    isLoading={saving}
                >
                    <Save size={16} className="mr-2" />
                    Salvar Alterações
                </Button>
            </div>

            {/* Basic information */}
            <Card title="Informações Básicas" padding="md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Nome da Loja"
                        value={settings.name}
                        onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Telefone"
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        icon={<Phone size={18} />}
                    />
                    <Input
                        label="WhatsApp"
                        value={settings.whatsapp}
                        onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                        icon={<Phone size={18} />}
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        icon={<Mail size={18} />}
                    />
                </div>
            </Card>

            {/* Address */}
            <Card title="Endereço" padding="md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Input
                            label="Endereço Completo"
                            value={settings.address}
                            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                            icon={<MapPin size={18} />}
                            required
                        />
                    </div>
                    <Input
                        label="Cidade"
                        value={settings.city}
                        onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                        required
                    />
                    <Input
                        label="Estado"
                        value={settings.state}
                        onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                        maxLength={2}
                        required
                    />
                    <Input
                        label="CEP"
                        value={settings.cep}
                        onChange={(e) => setSettings({ ...settings, cep: e.target.value })}
                    />
                    <Input
                        label="Raio de Entrega (metros)"
                        type="number"
                        value={settings.delivery_radius}
                        onChange={(e) => setSettings({ ...settings, delivery_radius: e.target.value })}
                        helperText="Distância máxima para entregas"
                    />
                </div>
            </Card>

            {/* PIX Configuration */}
            <Card title="Configuração PIX" padding="md">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 mb-4">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                        <span>💳</span>
                        Configure sua chave PIX para receber pagamentos dos clientes
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Chave PIX"
                        value={settings.pix_key}
                        onChange={(e) => setSettings({ ...settings, pix_key: e.target.value })}
                        placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
                        helperText="Chave que receberá os pagamentos"
                    />
                    <Input
                        label="Nome do Titular"
                        value={settings.pix_name}
                        onChange={(e) => setSettings({ ...settings, pix_name: e.target.value })}
                        placeholder="Nome completo ou Razão Social"
                        helperText="Nome que aparecerá no PIX"
                    />
                </div>
            </Card>

            {/* Business hours */}
            <Card title="Horário de Funcionamento" padding="md">
                <div className="space-y-3">
                    {weekDays.map((day) => {
                        const hours = settings.business_hours[day.key as keyof typeof settings.business_hours];

                        return (
                            <div key={day.key} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                <div className="w-32">
                                    <span className="font-medium text-gray-900">{day.label}</span>
                                </div>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={hours.closed}
                                        onChange={(e) => {
                                            setSettings({
                                                ...settings,
                                                business_hours: {
                                                    ...settings.business_hours,
                                                    [day.key]: {
                                                        ...hours,
                                                        closed: e.target.checked
                                                    }
                                                }
                                            });
                                        }}
                                        className="rounded border-gray-300 text-[#ffa944] focus:ring-[#ffa944]"
                                    />
                                    <span className="text-sm text-gray-700">Fechado</span>
                                </label>

                                {!hours.closed && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-gray-400" />
                                            <input
                                                type="time"
                                                value={hours.open}
                                                onChange={(e) => {
                                                    setSettings({
                                                        ...settings,
                                                        business_hours: {
                                                            ...settings.business_hours,
                                                            [day.key]: {
                                                                ...hours,
                                                                open: e.target.value
                                                            }
                                                        }
                                                    });
                                                }}
                                                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:border-[#ffa944] focus:ring-[#ffa944] focus:ring-2 focus:ring-opacity-50"
                                            />
                                        </div>

                                        <span className="text-gray-500">até</span>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="time"
                                                value={hours.close}
                                                onChange={(e) => {
                                                    setSettings({
                                                        ...settings,
                                                        business_hours: {
                                                            ...settings.business_hours,
                                                            [day.key]: {
                                                                ...hours,
                                                                close: e.target.value
                                                            }
                                                        }
                                                    });
                                                }}
                                                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:border-[#ffa944] focus:ring-[#ffa944] focus:ring-2 focus:ring-opacity-50"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Save button (bottom) */}
            <div className="flex justify-end">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSave}
                    isLoading={saving}
                >
                    <Save size={18} className="mr-2" />
                    Salvar Todas as Alterações
                </Button>
            </div>
        </div>
    );
}
