import React from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    options: SelectOption[];
}

export default function Select({
    label,
    error,
    helperText,
    options,
    className = '',
    ...props
}: SelectProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <select
                className={`
          w-full rounded-lg border transition-all duration-200
          px-3 py-2
          ${error
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-[#ffa944] focus:ring-[#ffa944]'
                    }
          focus:outline-none focus:ring-2 focus:ring-opacity-50
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}

            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
}
