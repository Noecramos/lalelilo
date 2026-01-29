import React from 'react';

interface LoadingProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullScreen?: boolean;
}

export default function Loading({
    size = 'md',
    text,
    fullScreen = false
}: LoadingProps) {
    const sizes = {
        sm: 'h-6 w-6',
        md: 'h-10 w-10',
        lg: 'h-16 w-16'
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center gap-3">
            <div className={`${sizes[size]} relative`}>
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#ffa944] border-t-transparent animate-spin"></div>
            </div>
            {text && (
                <p className="text-sm text-gray-600">{text}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
                {spinner}
            </div>
        );
    }

    return spinner;
}
