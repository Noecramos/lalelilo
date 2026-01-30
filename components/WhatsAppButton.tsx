'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
    phoneNumber: string;
    message?: string;
}

export default function WhatsAppButton({
    phoneNumber,
    message = 'Olá! Gostaria de mais informações.'
}: WhatsAppButtonProps) {
    const handleClick = () => {
        // Remove all non-numeric characters from phone number
        const cleanPhone = phoneNumber.replace(/\D/g, '');

        // Format message for URL
        const encodedMessage = encodeURIComponent(message);

        // Open WhatsApp with pre-filled message
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <button
            onClick={handleClick}
            className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
            aria-label="Fale conosco no WhatsApp"
        >
            <MessageCircle size={28} className="animate-pulse" />

            {/* Tooltip */}
            <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                Fale conosco no WhatsApp
            </span>
        </button>
    );
}
