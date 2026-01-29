import React from 'react';

interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    width?: string;
    align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    isLoading?: boolean;
}

export default function Table<T extends Record<string, any>>({
    data,
    columns,
    onRowClick,
    emptyMessage = 'Nenhum dado encontrado',
    isLoading = false
}: TableProps<T>) {
    if (isLoading) {
        return (
            <div className="w-full overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    style={{ width: column.width }}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(5)].map((_, i) => (
                            <tr key={i} className="border-b border-gray-200">
                                {columns.map((column) => (
                                    <td key={column.key} className="px-4 py-4">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12">
                <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                </svg>
                <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${column.align === 'center' ? 'text-center' :
                                        column.align === 'right' ? 'text-right' :
                                            'text-left'
                                    }`}
                                style={{ width: column.width }}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item, index) => (
                        <tr
                            key={index}
                            onClick={() => onRowClick?.(item)}
                            className={onRowClick ? 'hover:bg-gray-50 cursor-pointer transition-colors' : ''}
                        >
                            {columns.map((column) => (
                                <td
                                    key={column.key}
                                    className={`px-4 py-4 text-sm text-gray-900 ${column.align === 'center' ? 'text-center' :
                                            column.align === 'right' ? 'text-right' :
                                                'text-left'
                                        }`}
                                >
                                    {column.render ? column.render(item) : item[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
