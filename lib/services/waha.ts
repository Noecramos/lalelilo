// Lalelilo - WAHA (WhatsApp HTTP API) Client
// Direct integration — no n8n, no external automation

const WAHA_URL = process.env.WAHA_API_URL || 'http://localhost:3001';
const WAHA_API_KEY = process.env.WAHA_API_KEY || '';
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';

interface WahaResponse {
    id?: string;
    status?: string;
    error?: string;
}

interface SendTextParams {
    phone: string;
    text: string;
    session?: string;
}

interface SendImageParams {
    phone: string;
    imageUrl: string;
    caption?: string;
    session?: string;
}

interface SendDocumentParams {
    phone: string;
    documentUrl: string;
    fileName?: string;
    caption?: string;
    session?: string;
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

async function wahaFetch(endpoint: string, body: Record<string, unknown>): Promise<WahaResponse> {
    try {
        const res = await fetch(`${WAHA_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(WAHA_API_KEY ? { 'Authorization': `Bearer ${WAHA_API_KEY}` } : {}),
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[WAHA] Error ${res.status}: ${errorText}`);
            return { error: errorText };
        }

        return await res.json();
    } catch (err) {
        console.error('[WAHA] Request failed:', err);
        return { error: String(err) };
    }
}

/**
 * Send a text message via WhatsApp
 */
export async function sendText({ phone, text, session }: SendTextParams): Promise<WahaResponse> {
    const chatId = `${formatPhone(phone)}@c.us`;
    const sessionName = session || WAHA_SESSION;
    return wahaFetch(`/api/${sessionName}/sendText`, {
        chatId,
        text,
    });
}

/**
 * Send an image via WhatsApp
 */
export async function sendImage({ phone, imageUrl, caption, session }: SendImageParams): Promise<WahaResponse> {
    const chatId = `${formatPhone(phone)}@c.us`;
    const sessionName = session || WAHA_SESSION;
    return wahaFetch(`/api/${sessionName}/sendImage`, {
        chatId,
        file: { url: imageUrl },
        caption: caption || '',
    });
}

/**
 * Send a document via WhatsApp
 */
export async function sendDocument({ phone, documentUrl, fileName, caption, session }: SendDocumentParams): Promise<WahaResponse> {
    const chatId = `${formatPhone(phone)}@c.us`;
    const sessionName = session || WAHA_SESSION;
    return wahaFetch(`/api/${sessionName}/sendFile`, {
        chatId,
        file: { url: documentUrl },
        fileName: fileName || 'document',
        caption: caption || '',
    });
}

/**
 * Check WAHA session status
 */
export async function getSessionStatus(session?: string): Promise<WahaResponse> {
    try {
        const res = await fetch(`${WAHA_URL}/api/sessions/${session || WAHA_SESSION}`, {
            headers: {
                ...(WAHA_API_KEY ? { 'Authorization': `Bearer ${WAHA_API_KEY}` } : {}),
            },
        });
        return await res.json();
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
