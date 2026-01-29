'use client';

import React, { useState } from 'react';
import { Card, Button, Select, Input } from '@/components/ui';
import { Download, FileText, Calendar, Filter } from 'lucide-react';

export default function ReportsPage() {
    const [reportType, setReportType] = useState('sales');
    const [period, setPeriod] = useState('30');
    const [format, setFormat] = useState('pdf');
    const [generating, setGenerating] = useState(false);

    const generateReport = async () => {
        setGenerating(true);
        try {
            // TODO: Replace with actual API call
            setTimeout(() => {
                alert(`Relatório de ${reportType} gerado com sucesso!\nFormato: ${format}\nPeríodo: ${period} dias`);
                setGenerating(false);
            }, 2000);
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Erro ao gerar relatório');
            setGenerating(false);
        }
    };

    const reportTemplates = [
        {
            id: 'sales',
            name: 'Relatório de Vendas',
            description: 'Vendas consolidadas por loja, período e categoria',
            icon: FileText,
            color: 'bg-blue-100 text-blue-600'
        },
        {
            id: 'inventory',
            name: 'Relatório de Estoque',
            description: 'Níveis de estoque, produtos em falta e alertas',
            icon: FileText,
            color: 'bg-purple-100 text-purple-600'
        },
        {
            id: 'performance',
            name: 'Desempenho de Lojas',
            description: 'Comparativo de performance entre todas as lojas',
            icon: FileText,
            color: 'bg-green-100 text-green-600'
        },
        {
            id: 'products',
            name: 'Produtos Mais Vendidos',
            description: 'Ranking de produtos por vendas e receita',
            icon: FileText,
            color: 'bg-orange-100 text-orange-600'
        },
        {
            id: 'customers',
            name: 'Análise de Clientes',
            description: 'Comportamento e preferências dos clientes',
            icon: FileText,
            color: 'bg-pink-100 text-pink-600'
        },
        {
            id: 'financial',
            name: 'Relatório Financeiro',
            description: 'Receitas, despesas e margens de lucro',
            icon: FileText,
            color: 'bg-yellow-100 text-yellow-600'
        }
    ];

    const recentReports = [
        { name: 'Vendas Janeiro 2026', date: '29/01/2026', type: 'PDF', size: '2.4 MB' },
        { name: 'Estoque Semanal', date: '28/01/2026', type: 'Excel', size: '1.8 MB' },
        { name: 'Performance Lojas Q4', date: '25/01/2026', type: 'PDF', size: '3.1 MB' },
        { name: 'Top Produtos Dezembro', date: '20/01/2026', type: 'Excel', size: '1.2 MB' }
    ];

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
                <p className="text-gray-600 mt-1">
                    Gere relatórios personalizados e acompanhe histórico
                </p>
            </div>

            {/* Report generator */}
            <Card title="Gerar Novo Relatório" padding="md">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            label="Tipo de Relatório"
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            options={[
                                { value: 'sales', label: 'Vendas' },
                                { value: 'inventory', label: 'Estoque' },
                                { value: 'performance', label: 'Desempenho' },
                                { value: 'products', label: 'Produtos' },
                                { value: 'customers', label: 'Clientes' },
                                { value: 'financial', label: 'Financeiro' }
                            ]}
                        />

                        <Select
                            label="Período"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            options={[
                                { value: '7', label: 'Últimos 7 dias' },
                                { value: '30', label: 'Últimos 30 dias' },
                                { value: '90', label: 'Últimos 90 dias' },
                                { value: '365', label: 'Último ano' },
                                { value: 'custom', label: 'Personalizado' }
                            ]}
                        />

                        <Select
                            label="Formato"
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            options={[
                                { value: 'pdf', label: 'PDF' },
                                { value: 'excel', label: 'Excel (XLSX)' },
                                { value: 'csv', label: 'CSV' }
                            ]}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={generateReport}
                            isLoading={generating}
                        >
                            <Download size={18} className="mr-2" />
                            Gerar Relatório
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Report templates */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Modelos de Relatórios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportTemplates.map((template) => {
                        const Icon = template.icon;

                        return (
                            <Card
                                key={template.id}
                                padding="md"
                                hover
                                className="cursor-pointer"
                                onClick={() => setReportType(template.id)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`${template.color} p-3 rounded-lg`}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1">
                                            {template.name}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            {template.description}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Recent reports */}
            <Card title="Relatórios Recentes" padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Nome do Relatório
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Data de Geração
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Formato
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tamanho
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {recentReports.map((report, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-gray-400" />
                                            <span className="font-medium text-gray-900">{report.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {report.date}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {report.type}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {report.size}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center">
                                        <Button size="sm" variant="outline">
                                            <Download size={14} className="mr-1" />
                                            Baixar
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card padding="md">
                    <p className="text-sm text-gray-600 mb-1">Relatórios Gerados</p>
                    <p className="text-2xl font-bold text-gray-900">127</p>
                    <p className="text-xs text-gray-500 mt-1">Este mês</p>
                </Card>

                <Card padding="md">
                    <p className="text-sm text-gray-600 mb-1">Downloads</p>
                    <p className="text-2xl font-bold text-gray-900">342</p>
                    <p className="text-xs text-gray-500 mt-1">Este mês</p>
                </Card>

                <Card padding="md">
                    <p className="text-sm text-gray-600 mb-1">Formato Mais Usado</p>
                    <p className="text-2xl font-bold text-gray-900">PDF</p>
                    <p className="text-xs text-gray-500 mt-1">68% dos relatórios</p>
                </Card>

                <Card padding="md">
                    <p className="text-sm text-gray-600 mb-1">Último Relatório</p>
                    <p className="text-2xl font-bold text-gray-900">Hoje</p>
                    <p className="text-xs text-gray-500 mt-1">Vendas Janeiro</p>
                </Card>
            </div>
        </div>
    );
}
