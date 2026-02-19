// Lalelilo - Intelligent Bot Handler with Gemini AI
// Handles shop selection flow and lead management

import { createClient } from '@supabase/supabase-js';
import {
    analyzeMessage,
    suggestShopAssignment,
    buildShopSelectionMenu,
    parseShopSelection,
    buildWelcomeMessage,
    buildAssignmentConfirmation
} from './gemini';
import { findOrCreateContact, assignLeadToShop } from './crm';
import { sendText as cloudSendText } from './whatsapp-cloud';
import { sendText as wahaSendTextFn } from './waha';

// Use Cloud API if configured, otherwise fall back to WAHA
const useCloudApi = !!(process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
const wahaSendText = useCloudApi ? cloudSendText : wahaSendTextFn;

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const getSupabase = () => createClient(supabaseUrl, supabaseKey);

const CLIENT_ID = process.env.DEFAULT_CLIENT_ID || '';

interface ConversationState {
    id: string;
    phone: string;
    state: string;
    context: {
        shops?: Array<{ id: string; name: string; city: string }>;
        retryCount?: number;
        contactId?: string;
    };
}

/**
 * Main bot handler - processes incoming messages with AI
 */
export async function handleBotMessage(params: {
    phone: string;
    message: string;
    contactName?: string;
    channelType: 'whatsapp' | 'instagram' | 'facebook';
}): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
        const supabase = getSupabase();

        // 1. Find or create contact
        const result = await findOrCreateContact({
            clientId: CLIENT_ID,
            phone: params.phone,
            name: params.contactName,
            source: params.channelType
        });

        const contact = result.data;
        if (!contact) {
            return { success: false, error: 'Failed to create contact' };
        }

        // 2. Check if contact already has a shop assigned
        if (contact.assigned_shop_id) {
            // Contact already assigned, just acknowledge
            const response = await analyzeMessage(params.message, {
                contactName: contact.name || undefined,
            });

            if (params.channelType === 'whatsapp') {
                await wahaSendText({ phone: params.phone, text: response.text });
            }

            return { success: true, response: response.text };
        }

        // 3. Get or create conversation state
        const state = await getOrCreateConversationState(params.phone, contact.id);

        // 4. Handle based on current state
        if (state.state === 'awaiting_shop_selection') {
            return await handleShopSelection(params.phone, params.message, state, params.channelType);
        } else {
            // New conversation - start shop selection flow
            return await startShopSelectionFlow(params.phone, contact.name || undefined, contact.id, params.channelType);
        }

    } catch (error) {
        console.error('Bot handler error:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Start shop selection flow for new leads
 */
async function startShopSelectionFlow(
    phone: string,
    contactName: string | undefined,
    contactId: string,
    channelType: 'whatsapp' | 'instagram' | 'facebook'
): Promise<{ success: boolean; response: string }> {
    const supabase = getSupabase();

    // Get active shops
    const { data: shops } = await supabase
        .from('shops')
        .select('id, name, city')
        .eq('client_id', CLIENT_ID)
        .eq('is_active', true)
        .order('name');

    if (!shops || shops.length === 0) {
        return {
            success: false,
            response: 'Desculpe, não temos lojas disponíveis no momento.'
        };
    }

    // Build menu message
    const menuMessage = buildShopSelectionMenu(shops, contactName);

    // Save conversation state
    await supabase.from('conversation_states').insert({
        phone,
        client_id: CLIENT_ID,
        state: 'awaiting_shop_selection',
        context: { shops, contactId, retryCount: 0 }
    });

    // Send menu
    if (channelType === 'whatsapp') {
        await wahaSendText({ phone, text: menuMessage });
    }

    return { success: true, response: menuMessage };
}

/**
 * Handle shop selection response
 */
async function handleShopSelection(
    phone: string,
    message: string,
    state: ConversationState,
    channelType: 'whatsapp' | 'instagram' | 'facebook'
): Promise<{ success: boolean; response: string }> {
    const supabase = getSupabase();
    const shops = state.context.shops || [];
    const contactId = state.context.contactId!;
    const retryCount = state.context.retryCount || 0;

    // Try to parse selection
    const basicParse = parseShopSelection(message, shops);

    let selectedShopId = basicParse.shopId;
    let confidence = basicParse.confidence;

    // If basic parsing failed, use Gemini AI
    if (!selectedShopId || confidence < 0.7) {
        const aiSuggestion = await suggestShopAssignment(message, shops);
        selectedShopId = aiSuggestion.shopId;
        confidence = aiSuggestion.confidence;
    }

    // Valid selection found
    if (selectedShopId && confidence >= 0.7) {
        const selectedShop = shops.find(s => s.id === selectedShopId)!;

        // Assign lead to shop
        await assignLeadToShop({
            contactId,
            shopId: selectedShopId,
            assignedBy: 'system',
            method: 'auto'
        });

        // Build confirmation message
        const confirmationMessage = buildAssignmentConfirmation(
            selectedShop.name,
            selectedShop.city
        );

        // Clear conversation state
        await supabase
            .from('conversation_states')
            .update({ state: 'completed' })
            .eq('id', state.id);

        // Send confirmation
        if (channelType === 'whatsapp') {
            await wahaSendText({ phone, text: confirmationMessage });
        }

        return { success: true, response: confirmationMessage };
    }

    // Invalid selection - retry or escalate
    if (retryCount >= 2) {
        // Escalate to super admin after 2 failed attempts
        const escalationMessage = `Desculpe, estou tendo dificuldade em entender. 😅

Um de nossos atendentes entrará em contato em breve para ajudar você!

Enquanto isso, pode me contar o que você procura? 😊`;

        // Mark as unassigned (super admin will handle)
        await supabase
            .from('conversation_states')
            .update({ state: 'failed' })
            .eq('id', state.id);

        // TODO: Notify super admin

        if (channelType === 'whatsapp') {
            await wahaSendText({ phone, text: escalationMessage });
        }

        return { success: true, response: escalationMessage };
    }

    // Retry
    const retryMessage = `Desculpe, não entendi sua resposta. 😅

Por favor, escolha uma das opções:
${shops.map((s, i) => `${i + 1}️⃣ ${s.name} - ${s.city}`).join('\n')}

Ou me diga qual loja é mais próxima de você! 📍`;

    // Update retry count
    await supabase
        .from('conversation_states')
        .update({
            context: { ...state.context, retryCount: retryCount + 1 }
        })
        .eq('id', state.id);

    if (channelType === 'whatsapp') {
        await wahaSendText({ phone, text: retryMessage });
    }

    return { success: true, response: retryMessage };
}

/**
 * Get or create conversation state
 */
async function getOrCreateConversationState(
    phone: string,
    contactId: string
): Promise<ConversationState> {
    const supabase = getSupabase();

    // Check for existing active state
    const { data: existing, error: fetchError } = await supabase
        .from('conversation_states')
        .select('*')
        .eq('phone', phone)
        .eq('client_id', CLIENT_ID)
        .in('state', ['awaiting_shop_selection'])
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle() instead of single()

    if (existing && !fetchError) {
        return existing as ConversationState;
    }

    // Create new state
    const { data: newState, error: insertError } = await supabase
        .from('conversation_states')
        .insert({
            phone,
            client_id: CLIENT_ID,
            state: 'new',
            context: { contactId }
        })
        .select()
        .single();

    if (insertError || !newState) {
        throw new Error(`Failed to create conversation state: ${insertError?.message}`);
    }

    return newState as ConversationState;
}

/**
 * Cleanup expired conversation states (run periodically)
 */
export async function cleanupExpiredStates(): Promise<number> {
    const supabase = getSupabase();

    const { data } = await supabase
        .from('conversation_states')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

    return data?.length || 0;
}
