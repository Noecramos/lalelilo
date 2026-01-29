import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function Badge({
    children,
    variant = 'default',
    size = 'md',
    className = ''
}: BadgeProps) {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800'
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base'
    };

    return (
        <span
            className={`
        inline-flex items-center font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
        >
            {children}
        </span>
    );
}

// Helper function to get badge variant based on order status
export function getOrderStatusBadge(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
    const statusMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
        pending: 'warning',
        confirmed: 'info',
        preparing: 'info',
        ready: 'success',
        out_for_delivery: 'info',
        delivered: 'success',
        cancelled: 'danger'
    };

    return statusMap[status] || 'default';
}

// Helper function to get badge variant based on payment status
export function getPaymentStatusBadge(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
    const statusMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
        pending: 'warning',
        paid: 'success',
        failed: 'danger',
        refunded: 'info'
    };

    return statusMap[status] || 'default';
}
