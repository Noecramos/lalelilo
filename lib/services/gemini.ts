// Lalelilo - Gemini AI Service for Intelligent Conversations

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export interface ConversationContext {
    contactName?: string;
    previousMessages?: string[];
    shops?: Array<{ id: string; name: string; city: string }>;
    userIntent?: string;
}

export interface GeminiResponse {
    text: string;
    intent?: 'shop_selection' | 'product_inquiry' | 'general' | 'order_status';
    suggestedShopId?: string;
    confidence?: number;
}

/**
 * Analyze incoming message and generate intelligent response
 */
export async function analyzeMessage(
    message: string,
    context: ConversationContext = {}
): Promise<GeminiResponse> {
    try {
        const prompt = buildPrompt(message, context);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Parse response for intent and suggestions
        const parsed = parseGeminiResponse(text, context);

        return {
            text: parsed.text,
            intent: parsed.intent as 'shop_selection' | 'product_inquiry' | 'general' | 'order_status',
            suggestedShopId: parsed.suggestedShopId,
            confidence: parsed.confidence
        };
    } catch (error) {
        console.error('Gemini API error:', error);
        return {
            text: 'Desculpe, não consegui processar sua mensagem. Pode tentar novamente?',
            intent: 'general',
            confidence: 0
        };
    }
}

/**
 * Determine which shop to assign based on user message
 */
export async function suggestShopAssignment(
    message: string,
    shops: Array<{ id: string; name: string; city: string }>
): Promise<{ shopId: string | null; confidence: number; reason: string }> {
    try {
        const prompt = `
Você é um assistente de atendimento da Lalelilo, uma rede de lojas de moda feminina.

Lojas disponíveis:
${shops.map((s, i) => `${i + 1}. ${s.name} - ${s.city}`).join('\n')}

Mensagem do cliente: "${message}"

Analise a mensagem e determine qual loja seria mais adequada para este cliente.
Considere:
- Menções de localização (centro, boa viagem, olinda, shopping, etc.)
- Proximidade geográfica mencionada
- Preferências explícitas

Responda APENAS no formato JSON:
{
  "shopIndex": número da loja (1-${shops.length}) ou null,
  "confidence": número de 0 a 1,
  "reason": "breve explicação"
}
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const shopId = parsed.shopIndex ? shops[parsed.shopIndex - 1]?.id : null;
            return {
                shopId,
                confidence: parsed.confidence || 0,
                reason: parsed.reason || 'Análise automática'
            };
        }
    } catch (error) {
        console.error('Shop suggestion error:', error);
    }

    return { shopId: null, confidence: 0, reason: 'Não foi possível determinar' };
}

/**
 * Generate shop selection menu message
 */
export function buildShopSelectionMenu(
    shops: Array<{ id: string; name: string; city: string }>,
    contactName?: string
): string {
    const greeting = contactName ? `Olá, ${contactName}!` : 'Olá!';

    return `${greeting} Bem-vindo à Lalelilo! 👗✨

Para melhor atendê-lo, qual loja é mais próxima de você?

${shops.map((shop, i) => `${i + 1}️⃣ ${shop.name} - ${shop.city}`).join('\n')}

Responda com o número da loja ou me diga onde você está! 😊`;
}

/**
 * Parse user's shop selection response
 */
export function parseShopSelection(
    message: string,
    shops: Array<{ id: string; name: string; city: string }>
): { shopId: string | null; confidence: number } {
    const normalized = message.toLowerCase().trim();

    // Check for number (1, 2, 3)
    const numberMatch = normalized.match(/^(\d+)$/);
    if (numberMatch) {
        const index = parseInt(numberMatch[1]) - 1;
        if (index >= 0 && index < shops.length) {
            return { shopId: shops[index].id, confidence: 1.0 };
        }
    }

    // Check for shop name or city mentions
    for (const shop of shops) {
        const shopNameLower = shop.name.toLowerCase();
        const cityLower = shop.city.toLowerCase();

        if (normalized.includes(shopNameLower) || normalized.includes(cityLower)) {
            return { shopId: shop.id, confidence: 0.9 };
        }
    }

    // Fuzzy matching for common locations
    const locationMap: Record<string, string[]> = {
        'centro': ['centro', 'recife centro', 'downtown'],
        'boa viagem': ['boa viagem', 'shopping', 'praia'],
        'olinda': ['olinda', 'casa caiada', 'norte']
    };

    for (const [location, keywords] of Object.entries(locationMap)) {
        if (keywords.some(kw => normalized.includes(kw))) {
            const shop = shops.find(s => s.city.toLowerCase().includes(location));
            if (shop) {
                return { shopId: shop.id, confidence: 0.7 };
            }
        }
    }

    return { shopId: null, confidence: 0 };
}

/**
 * Build prompt for Gemini based on context
 */
function buildPrompt(message: string, context: ConversationContext): string {
    let prompt = `Você é um assistente virtual da Lalelilo, uma rede de lojas de moda feminina no Recife.

Seja amigável, prestativo e profissional. Use emojis moderadamente.

`;

    if (context.contactName) {
        prompt += `Nome do cliente: ${context.contactName}\n`;
    }

    if (context.shops && context.shops.length > 0) {
        prompt += `\nNossas lojas:\n${context.shops.map(s => `- ${s.name} (${s.city})`).join('\n')}\n`;
    }

    if (context.previousMessages && context.previousMessages.length > 0) {
        prompt += `\nMensagens anteriores:\n${context.previousMessages.join('\n')}\n`;
    }

    prompt += `\nMensagem do cliente: "${message}"\n\nResponda de forma natural e útil.`;

    return prompt;
}

/**
 * Parse Gemini response to extract intent and suggestions
 */
function parseGeminiResponse(
    text: string,
    context: ConversationContext
): { text: string; intent: string; suggestedShopId?: string; confidence: number } {
    // Detect intent from response
    let intent = 'general';

    if (text.toLowerCase().includes('loja') || text.toLowerCase().includes('localização')) {
        intent = 'shop_selection';
    } else if (text.toLowerCase().includes('produto') || text.toLowerCase().includes('vestido')) {
        intent = 'product_inquiry';
    } else if (text.toLowerCase().includes('pedido') || text.toLowerCase().includes('compra')) {
        intent = 'order_status';
    }

    return {
        text,
        intent,
        confidence: 0.8
    };
}

/**
 * Generate welcome message for new leads
 */
export function buildWelcomeMessage(contactName?: string): string {
    const greeting = contactName ? `Olá, ${contactName}!` : 'Olá!';
    return `${greeting} Bem-vindo à Lalelilo! 👗✨

Somos uma rede de lojas de moda feminina com as melhores tendências e preços incríveis!

Como posso ajudar você hoje? 😊`;
}

/**
 * Generate confirmation message after shop assignment
 */
export function buildAssignmentConfirmation(
    shopName: string,
    shopCity: string
): string {
    return `Perfeito! ✅

Você será atendido pela nossa equipe de ${shopName} (${shopCity}).

Em breve um de nossos vendedores entrará em contato para ajudar você! 

Enquanto isso, fique à vontade para me contar o que procura. 😊`;
}
