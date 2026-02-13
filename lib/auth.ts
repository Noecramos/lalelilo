import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate a random password
 * Format: 12 characters with uppercase, lowercase, numbers, and symbols
 * Example: aB3!xK9@mP2#
 */
export function generateRandomPassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%&*';

    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';

    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = 4; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate a unique token for password reset
 */
export function generateResetToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Authenticate a shop by slug and password
 */
export async function authenticateShop(slug: string, password: string): Promise<{ success: boolean; shop?: any; error?: string }> {
    const supabase = supabaseAdmin;

    // Find shop by slug
    const { data: shop, error } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (error || !shop) {
        return { success: false, error: 'Loja não encontrada ou inativa' };
    }

    if (!shop.password_hash) {
        return { success: false, error: 'Senha não configurada. Entre em contato com o administrador.' };
    }

    // Verify password
    const isValid = await verifyPassword(password, shop.password_hash);

    if (!isValid) {
        return { success: false, error: 'Senha incorreta' };
    }

    // Update last login
    await supabase
        .from('shops')
        .update({ last_login: new Date().toISOString() })
        .eq('id', shop.id);

    return { success: true, shop };
}

/**
 * Authenticate super admin
 */
export async function authenticateSuperAdmin(username: string, password: string): Promise<{ success: boolean; admin?: any; error?: string }> {
    const supabase = supabaseAdmin;

    // Find super admin by username
    const { data: admin, error } = await supabase
        .from('super_admin')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

    if (error || !admin) {
        return { success: false, error: 'Administrador não encontrado ou inativo' };
    }

    if (!admin.password_hash) {
        return { success: false, error: 'Senha não configurada' };
    }

    // Verify password
    const isValid = await verifyPassword(password, admin.password_hash);

    if (!isValid) {
        return { success: false, error: 'Senha incorreta' };
    }

    // Update last login
    await supabase
        .from('super_admin')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id);

    return { success: true, admin };
}
