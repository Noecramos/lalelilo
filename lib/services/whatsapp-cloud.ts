// Lalelilo - WhatsApp Cloud API Client
// Official Meta WhatsApp Business Platform integration

const WHATSAPP_TOKEN = process.env.WHATSAPP_CLOUD_TOKEN || process.env.META_ACCESS_TOKEN || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WABA_ID = process.env.WHATSAPP_WABA_ID || '';
const API_VERSION = 'v21.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

export interface CloudApiResponse {
    id?: string;
    status?: string;
    error?: string;
    messaging_product?: string;
    contacts?: Array<{ input: string; wa_id: string }>;
    messages?: Array<{ id: string }>;
}

interface SendTextParams {
    phone: string;
    text: string;
}

interface SendImageParams {
    phone: string;
    imageUrl: string;
    caption?: string;
}

interface SendTemplateParams {
    phone: string;
    templateName: string;
    languageCode?: string;
    parameters?: string[];
}

function formatPhone(phone: string): string {
    // Remove non-digits
    const digits = phone.replace(/\D/g, '');
    // Add Brazil country code if not present
    if (digits.length <= 11) {
        return `55${digits}`;
    }
    return digits;
}

async function cloudApiFetch(endpoint: string, body: Record<string, unknown>): Promise<CloudApiResponse> {
    try {
        const res = await fetch(`${BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error(`[WhatsApp Cloud API] Error ${res.status}:`, data);
            return { error: data.error?.message || `HTTP ${res.status}` };
        }

        return data;
    } catch (err) {
        console.error('[WhatsApp Cloud API] Request failed:', err);
        return { error: String(err) };
    }
}

/**
 * Send a text message via WhatsApp Cloud API
 */
export async function sendText({ phone, text }: SendTextParams): Promise<CloudApiResponse> {
    const formattedPhone = formatPhone(phone);
    return cloudApiFetch(`${PHONE_NUMBER_ID}/messages`, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: { body: text },
    });
}

/**
 * Send an image via WhatsApp Cloud API
 */
export async function sendImage({ phone, imageUrl, caption }: SendImageParams): Promise<CloudApiResponse> {
    const formattedPhone = formatPhone(phone);
    return cloudApiFetch(`${PHONE_NUMBER_ID}/messages`, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'image',
        image: {
            link: imageUrl,
            ...(caption ? { caption } : {}),
        },
    });
}

/**
 * Send a template message via WhatsApp Cloud API
 */
export async function sendTemplate({ phone, templateName, languageCode, parameters }: SendTemplateParams): Promise<CloudApiResponse> {
    const formattedPhone = formatPhone(phone);
    const components: any[] = [];

    if (parameters && parameters.length > 0) {
        components.push({
            type: 'body',
            parameters: parameters.map(p => ({ type: 'text', text: p })),
        });
    }

    return cloudApiFetch(`${PHONE_NUMBER_ID}/messages`, {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
            name: templateName,
            language: { code: languageCode || 'pt_BR' },
            ...(components.length > 0 ? { components } : {}),
        },
    });
}

/**
 * Mark a message as read
 */
export async function markAsRead(messageId: string): Promise<CloudApiResponse> {
    return cloudApiFetch(`${PHONE_NUMBER_ID}/messages`, {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
    });
}

/**
 * Get the phone number profile info
 */
export async function getPhoneInfo(): Promise<any> {
    try {
        const res = await fetch(
            `${BASE_URL}/${PHONE_NUMBER_ID}?fields=display_phone_number,verified_name,quality_rating,platform_type,status`,
            { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
        );
        return res.json();
    } catch (err) {
        return { error: String(err) };
    }
}

/**
 * Get WABA business profile
 */
export async function getBusinessProfile(): Promise<any> {
    try {
        const res = await fetch(
            `${BASE_URL}/${PHONE_NUMBER_ID}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`,
            { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
        );
        return res.json();
    } catch (err) {
        return { error: String(err) };
    }
}

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

export function buildOrderStatusMessage(orderNumber: string, status: string, customerName: string): string {
    const statusMap: Record<string, string> = {
        confirmed: '✅ Pedido confirmado!',
        preparing: '👗 Seu pedido está sendo preparado!',
        ready: '📦 Pedido pronto para retirada!',
        out_for_delivery: '🚚 Pedido saiu para entrega!',
        delivered: '🎉 Pedido entregue! Obrigada pela compra!',
        cancelled: '❌ Pedido cancelado.',
    };

    return `Olá ${customerName}! 👋\n\n${statusMap[status] || `Status: ${status}`}\n\nPedido: #${orderNumber}\n\n🛍️ Lalelilo - Moda Infantil`;
}

export function buildReplenishmentStatusMessage(requestId: string, status: string, shopName: string): string {
    const statusMap: Record<string, string> = {
        processing: '⚙️ Pedido de reposição está sendo processado',
        in_transit: '🚛 Reposição a caminho da loja!',
        received: '✅ Reposição recebida com sucesso!',
        cancelled: '❌ Pedido de reposição cancelado',
    };

    return `📋 Reposição #${requestId.slice(0, 8)}\n${statusMap[status] || status}\nLoja: ${shopName}\n\n🏭 Lalelilo CD`;
}

export function buildBirthdayMessage(customerName: string, promoCode?: string): string {
    let msg = `🎂 Feliz Aniversário, ${customerName}! 🎉\n\nA Lalelilo deseja um dia maravilhoso pra você!`;
    if (promoCode) {
        msg += `\n\n🎁 Presente especial: Use o cupom ${promoCode} e ganhe desconto na sua próxima compra!`;
    }
    msg += '\n\n🛍️ Lalelilo - Moda Infantil';
    return msg;
}

export function buildTicketCreatedMessage(ticketTitle: string, shopName: string, priority: string): string {
    const priorityEmoji: Record<string, string> = {
        low: '🟢', medium: '🟡', high: '🟠', critical: '🔴',
    };
    return `🎫 Novo Ticket Criado\n\n${priorityEmoji[priority] || '🟡'} ${ticketTitle}\nLoja: ${shopName}\nPrioridade: ${priority}\n\nAcesse o painel para mais detalhes.`;
}

export function buildKudosMessage(fromName: string, message: string): string {
    return `⭐ Você recebeu um Kudos!\n\nDe: ${fromName}\n"${message}"\n\nContinue arrasando! 💪`;
}
