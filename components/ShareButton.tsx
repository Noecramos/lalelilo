'use client';

import React from 'react';
import { Share2 } from 'lucide-react';

interface ShareButtonProps {
    type: 'product' | 'shop';
    title: string;
    description?: string;
    imageUrl?: string;
    url?: string;
}

export default function ShareButton({ type, title, description, imageUrl, url }: ShareButtonProps) {
    const handleShare = () => {
        // Get current URL if not provided
        const shareUrl = url || window.location.href;

        // Build WhatsApp message
        let message = `🛍️ *${title}*\n\n`;

        if (description) {
            message += `${description}\n\n`;
        }

        if (type === 'product') {
            message += `✨ Confira este produto incrível da Lalelilo!\n\n`;
        } else {
            message += `📍 Conheça nossa loja Lalelilo!\n\n`;
        }

        message += `🔗 ${shareUrl}`;

        // Encode message for URL
        const encodedMessage = encodeURIComponent(message);

        // Open WhatsApp
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md"
            title={`Compartilhar ${type === 'product' ? 'produto' : 'loja'} no WhatsApp`}
        >
            <Share2 size={18} />
            <span className="font-medium">Compartilhar</span>
        </button>
    );
}
