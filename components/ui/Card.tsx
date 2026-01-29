import React from 'react';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    headerAction?: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

export default function Card({
    children,
    title,
    subtitle,
    headerAction,
    className = '',
    padding = 'md',
    hover = false
}: CardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6'
    };

    return (
        <div
            className={`
        bg-white rounded-lg border border-gray-200 shadow-sm
        ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
        ${className}
      `}
        >
            {(title || subtitle || headerAction) && (
                <div className={`border-b border-gray-200 ${paddingClasses[padding]} flex items-center justify-between`}>
                    <div>
                        {title && (
                            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        )}
                        {subtitle && (
                            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                        )}
                    </div>
                    {headerAction && (
                        <div>{headerAction}</div>
                    )}
                </div>
            )}

            <div className={paddingClasses[padding]}>
                {children}
            </div>
        </div>
    );
}
