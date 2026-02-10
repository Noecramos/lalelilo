// Lalelilo - Role-Based Access Control (RBAC)
// File-based permissions config — no DB table needed for 6 roles

export type Role = 'super_admin' | 'shop_admin' | 'store_manager' | 'sales_associate' | 'auditor' | 'staff';

export type Action =
    // Users
    | 'users:read' | 'users:create' | 'users:update' | 'users:delete'
    // Shops
    | 'shops:read' | 'shops:create' | 'shops:update' | 'shops:delete'
    // Products
    | 'products:read' | 'products:create' | 'products:update' | 'products:delete'
    // Inventory
    | 'inventory:read' | 'inventory:update'
    // Orders
    | 'orders:read' | 'orders:create' | 'orders:update' | 'orders:cancel'
    // Replenishment
    | 'replenishment:read' | 'replenishment:create' | 'replenishment:approve' | 'replenishment:receive'
    // Gamification
    | 'gamification:read' | 'gamification:manage' | 'kudos:send' | 'feedback:give'
    // Promotions
    | 'promo:read' | 'promo:create' | 'promo:update' | 'promo:delete'
    // Checklists & Audit
    | 'checklists:read' | 'checklists:create_template' | 'checklists:submit' | 'checklists:review'
    // Tickets
    | 'tickets:read' | 'tickets:create' | 'tickets:update' | 'tickets:assign'
    // Analytics
    | 'analytics:read' | 'analytics:export'
    // CRM
    | 'crm:read' | 'crm:manage'
    // Messaging
    | 'messaging:read' | 'messaging:send' | 'messaging:manage_channels'
    // Settings
    | 'settings:read' | 'settings:update'
    // DC
    | 'dc:read' | 'dc:manage';

const PERMISSIONS: Record<Role, Action[]> = {
    super_admin: [
        // Full access to everything
        'users:read', 'users:create', 'users:update', 'users:delete',
        'shops:read', 'shops:create', 'shops:update', 'shops:delete',
        'products:read', 'products:create', 'products:update', 'products:delete',
        'inventory:read', 'inventory:update',
        'orders:read', 'orders:create', 'orders:update', 'orders:cancel',
        'replenishment:read', 'replenishment:create', 'replenishment:approve', 'replenishment:receive',
        'gamification:read', 'gamification:manage', 'kudos:send', 'feedback:give',
        'promo:read', 'promo:create', 'promo:update', 'promo:delete',
        'checklists:read', 'checklists:create_template', 'checklists:submit', 'checklists:review',
        'tickets:read', 'tickets:create', 'tickets:update', 'tickets:assign',
        'analytics:read', 'analytics:export',
        'crm:read', 'crm:manage',
        'messaging:read', 'messaging:send', 'messaging:manage_channels',
        'settings:read', 'settings:update',
        'dc:read', 'dc:manage',
    ],

    shop_admin: [
        // Legacy role — same as store_manager
        'shops:read',
        'products:read',
        'inventory:read', 'inventory:update',
        'orders:read', 'orders:update', 'orders:cancel',
        'replenishment:read', 'replenishment:create', 'replenishment:receive',
        'gamification:read', 'kudos:send', 'feedback:give',
        'promo:read',
        'checklists:read',
        'tickets:read', 'tickets:create', 'tickets:update',
        'analytics:read',
        'crm:read',
        'messaging:read', 'messaging:send',
        'settings:read',
    ],

    store_manager: [
        // Manages a specific store
        'shops:read',
        'products:read',
        'inventory:read', 'inventory:update',
        'orders:read', 'orders:update', 'orders:cancel',
        'replenishment:read', 'replenishment:create', 'replenishment:receive',
        'gamification:read', 'gamification:manage', 'kudos:send', 'feedback:give',
        'promo:read',
        'checklists:read',
        'tickets:read', 'tickets:create', 'tickets:update', 'tickets:assign',
        'analytics:read',
        'crm:read',
        'messaging:read', 'messaging:send',
        'settings:read',
    ],

    sales_associate: [
        // Store employee — sells, views
        'shops:read',
        'products:read',
        'inventory:read',
        'orders:read', 'orders:create', 'orders:update',
        'gamification:read', 'kudos:send',
        'promo:read',
        'messaging:read', 'messaging:send',
    ],

    auditor: [
        // Field auditor — checklists, tickets
        'shops:read',
        'products:read',
        'checklists:read', 'checklists:submit', 'checklists:review',
        'tickets:read', 'tickets:create', 'tickets:update',
        'analytics:read',
    ],

    staff: [
        // Generic staff — minimal access
        'shops:read',
        'products:read',
        'inventory:read',
        'orders:read',
        'gamification:read', 'kudos:send',
    ],
};

/**
 * Check if a role has permission for an action
 */
export function hasPermission(role: Role, action: Action): boolean {
    return PERMISSIONS[role]?.includes(action) ?? false;
}

/**
 * Check multiple permissions at once (ALL must pass)
 */
export function hasAllPermissions(role: Role, actions: Action[]): boolean {
    return actions.every(action => hasPermission(role, action));
}

/**
 * Check multiple permissions at once (ANY must pass)
 */
export function hasAnyPermission(role: Role, actions: Action[]): boolean {
    return actions.some(action => hasPermission(role, action));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role): Action[] {
    return PERMISSIONS[role] ?? [];
}

/**
 * Middleware-style permission check — throws if denied
 */
export function requirePermission(role: Role, action: Action): void {
    if (!hasPermission(role, action)) {
        throw new Error(`Access denied: role '${role}' cannot perform '${action}'`);
    }
}
