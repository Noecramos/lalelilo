// Lalelilo TypeScript Types

export interface Client {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    created_at: string;
    updated_at: string;
}

export interface Shop {
    id: string;
    client_id: string;
    name: string;
    slug: string;
    address?: string;
    city?: string;
    state?: string;
    cep?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    delivery_radius: number;
    is_active: boolean;
    business_hours: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    client_id: string;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    parent_id?: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    client_id: string;
    category_id?: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    compare_at_price?: number;
    cost_price?: number;
    sku?: string;
    barcode?: string;
    image_url?: string;
    images: string[];
    sizes: string[];
    colors: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Inventory {
    id: string;
    shop_id: string;
    product_id: string;
    quantity: number;
    low_stock_threshold: number;
    updated_at: string;
}

export type OrderType = 'delivery' | 'pickup' | 'dine-in';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'mercado_pago';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
    subtotal: number;
}

export interface Order {
    id: string;
    order_number: string;
    shop_id?: string;
    client_id: string;

    // Customer Info
    customer_name: string;
    customer_email?: string;
    customer_phone: string;
    customer_cep?: string;
    customer_address?: string;
    customer_city?: string;
    customer_state?: string;
    customer_neighborhood?: string;
    customer_complement?: string;

    // Order Details
    order_type: OrderType;
    status: OrderStatus;

    // Pricing
    subtotal: number;
    delivery_fee: number;
    discount: number;
    total_amount: number;

    // Payment
    payment_method?: PaymentMethod;
    payment_status: PaymentStatus;
    payment_id?: string;

    // Items
    items: OrderItem[];

    // Notes
    customer_notes?: string;
    internal_notes?: string;

    // Timestamps
    created_at: string;
    updated_at: string;
    confirmed_at?: string;
    delivered_at?: string;
    cancelled_at?: string;
}

export type UserRole = 'super_admin' | 'shop_admin' | 'store_manager' | 'sales_associate' | 'auditor' | 'staff';

export interface User {
    id: string;
    email: string;
    password_hash: string;
    role: UserRole;
    client_id: string;
    shop_id?: string;
    name: string;
    phone?: string;
    avatar_url?: string;
    birthday?: string;
    hire_date?: string;
    department?: string;
    bio?: string;
    is_active: boolean;
    last_login?: string;
    created_at: string;
    updated_at: string;
}

export interface AnalyticsDaily {
    id: string;
    shop_id: string;
    client_id: string;
    date: string;
    total_revenue: number;
    total_orders: number;
    avg_ticket: number;
    cancelled_orders: number;
    top_products: Array<{
        product_id: string;
        name: string;
        quantity: number;
        revenue: number;
    }>;
    created_at: string;
}

// Dashboard Types
export interface DashboardMetrics {
    totalRevenue: number;
    totalOrders: number;
    avgTicket: number;
    activeShops: number;
    revenueChange: number;
    ordersChange: number;
}

export interface ShopPerformance {
    shop_id: string;
    shop_name: string;
    revenue: number;
    orders: number;
    avg_ticket: number;
    rating?: number;
}

export interface RevenueData {
    date: string;
    revenue: number;
    orders: number;
}

// ============================================================================
// V2 MODULE TYPES
// ============================================================================

// --- Regions ---
export interface Region {
    id: string;
    client_id: string;
    name: string;
    description?: string;
    manager_id?: string;
    created_at: string;
    updated_at: string;
}

// --- Distribution Center ---
export interface DistributionCenter {
    id: string;
    client_id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    manager_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface DCInventory {
    id: string;
    dc_id: string;
    product_id: string;
    size: string;
    quantity: number;
    low_stock_threshold: number;
    updated_at: string;
}

// --- Replenishment ---
export type ReplenishmentStatus = 'requested' | 'processing' | 'in_transit' | 'received' | 'cancelled';

export interface ReplenishmentRequest {
    id: string;
    client_id: string;
    shop_id: string;
    dc_id: string;
    requested_by: string;
    status: ReplenishmentStatus;
    notes?: string;
    request_date: string;
    expected_delivery?: string;
    received_at?: string;
    total_items: number;
    created_at: string;
    updated_at: string;
}

export interface ReplenishmentItem {
    id: string;
    request_id: string;
    product_id: string;
    size: string;
    quantity_requested: number;
    quantity_fulfilled: number;
    created_at: string;
}

// --- Gamification ---
export interface XPLedgerEntry {
    id: string;
    user_id: string;
    amount: number;
    reason: string;
    source_type?: string;
    source_id?: string;
    shop_id?: string;
    created_at: string;
}

export interface Badge {
    id: string;
    client_id: string;
    name: string;
    description?: string;
    icon_url?: string;
    criteria: Record<string, unknown>;
    xp_threshold?: number;
    category?: string;
    is_active: boolean;
    created_at: string;
}

export interface UserBadge {
    id: string;
    user_id: string;
    badge_id: string;
    awarded_at: string;
    awarded_by?: string;
}

export interface Kudos {
    id: string;
    from_user_id: string;
    to_user_id: string;
    message: string;
    category?: string;
    shop_id?: string;
    created_at: string;
}

export interface ManagerFeedback {
    id: string;
    manager_id: string;
    employee_id: string;
    type: 'praise' | 'improvement' | 'goal' | 'note';
    content: string;
    is_private: boolean;
    shop_id?: string;
    created_at: string;
}

// --- E-Commerce ---
export interface Cart {
    id: string;
    client_id: string;
    shop_id?: string;
    contact_id?: string;
    customer_phone?: string;
    customer_name?: string;
    is_abandoned: boolean;
    abandoned_at?: string;
    converted_at?: string;
    order_id?: string;
    expires_at?: string;
    created_at: string;
    updated_at: string;
}

export interface CartItem {
    id: string;
    cart_id: string;
    product_id: string;
    size?: string;
    color?: string;
    quantity: number;
    price: number;
    created_at: string;
}

export interface PromoCode {
    id: string;
    client_id: string;
    code: string;
    description?: string;
    discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
    discount_value: number;
    min_order_value: number;
    max_uses?: number;
    uses_count: number;
    max_uses_per_user: number;
    valid_from: string;
    valid_until?: string;
    is_active: boolean;
    created_at: string;
}

export interface OrderStatusLog {
    id: string;
    order_id: string;
    from_status?: string;
    to_status: string;
    changed_by?: string;
    message?: string;
    metadata: Record<string, unknown>;
    created_at: string;
}

// --- Audit & QC ---
export interface ChecklistTemplate {
    id: string;
    client_id: string;
    name: string;
    description?: string;
    category?: string;
    version: number;
    is_active: boolean;
    created_by?: string;
    created_at: string;
}

export interface ChecklistTemplateItem {
    id: string;
    template_id: string;
    order_index: number;
    section?: string;
    question: string;
    input_type: 'boolean' | 'text' | 'photo' | 'audio' | 'qr_barcode' | 'rating' | 'select';
    is_required: boolean;
    options: unknown[];
    conditional_rules: Record<string, unknown>;
    fail_values: unknown[];
    auto_ticket_on_fail: boolean;
    ticket_priority: string;
}

export interface ChecklistSubmission {
    id: string;
    template_id: string;
    client_id: string;
    shop_id: string;
    submitted_by: string;
    status: 'draft' | 'completed' | 'reviewed';
    score: number;
    total_items: number;
    failed_items: number;
    notes?: string;
    submitted_at: string;
    reviewed_by?: string;
    reviewed_at?: string;
}

export type TicketType = 'maintenance' | 'non_conformity' | 'general' | 'task';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'to_do' | 'in_progress' | 'resolved' | 'cancelled';

export interface Ticket {
    id: string;
    client_id: string;
    shop_id?: string;
    title: string;
    description?: string;
    type: TicketType;
    priority: TicketPriority;
    status: TicketStatus;
    source_type?: string;
    source_id?: string;
    assigned_to?: string;
    created_by?: string;
    resolved_at?: string;
    due_date?: string;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

// --- Messaging / Omnichannel ---
export type ChannelType = 'whatsapp' | 'instagram' | 'facebook';

export interface Contact {
    id: string;
    client_id: string;
    name?: string;
    phone?: string;
    email?: string;
    instagram_id?: string;
    facebook_id?: string;
    avatar_url?: string;
    tags: string[];
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface Conversation {
    id: string;
    client_id: string;
    contact_id: string;
    channel_id?: string;
    channel_type: ChannelType;
    status: 'open' | 'closed' | 'archived';
    assigned_to?: string;
    shop_id?: string;
    last_message_at?: string;
    unread_count: number;
    created_at: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    contact_id?: string;
    sender_type: 'contact' | 'agent' | 'system';
    sender_id?: string;
    channel_type: ChannelType;
    content_type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'sticker';
    content?: string;
    media_url?: string;
    external_id?: string;
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    created_at: string;
}

// --- CRM ---
export interface CRMEvent {
    id: string;
    client_id: string;
    contact_id: string;
    event_type: 'birthday' | 'anniversary' | 'vip_milestone' | 'custom';
    event_date: string;
    title?: string;
    description?: string;
    is_recurring: boolean;
    notification_sent: boolean;
    notification_sent_at?: string;
    metadata: Record<string, unknown>;
    created_at: string;
}

// --- Activity Log ---
export interface ActivityLogEntry {
    id: string;
    actor_id?: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    metadata: Record<string, unknown>;
    shop_id?: string;
    client_id: string;
    created_at: string;
}

// --- Notifications ---
export interface Notification {
    id: string;
    user_id?: string;
    type: string;
    channel: string;
    title?: string;
    body: string;
    metadata: Record<string, unknown>;
    status: 'pending' | 'sent' | 'failed' | 'cancelled';
    phone_number?: string;
    scheduled_for?: string;
    sent_at?: string;
    error?: string;
    created_at: string;
}

// --- KPIs ---
export interface SalesKPIs {
    aov: number;
    total_revenue: number;
    total_orders: number;
    conversion_rate: number;
    top_products: Array<{
        product_id: string;
        name: string;
        qty: number;
        rev: number;
    }>;
}

export interface LeaderboardEntry {
    rank: number;
    user_id: string;
    xp: number;
    user: Pick<User, 'id' | 'name' | 'avatar_url' | 'shop_id' | 'role'> | null;
}

export interface GamificationProfile {
    total_xp: number;
    badges: UserBadge[];
    recent_kudos: Kudos[];
    recent_xp: XPLedgerEntry[];
}
