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

export type UserRole = 'super_admin' | 'shop_admin' | 'staff';

export interface User {
    id: string;
    email: string;
    password_hash: string;
    role: UserRole;
    client_id: string;
    shop_id?: string;
    name: string;
    phone?: string;
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
    revenueChange: number; // percentage
    ordersChange: number; // percentage
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
