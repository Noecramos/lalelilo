import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateRandomPassword, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { shopId } = await req.json();

        if (!shopId) {
            return NextResponse.json(
                { error: 'Shop ID é obrigatório' },
                { status: 400 }
            );
        }

        const supabase = supabaseAdmin;

        // Get shop details
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('id, name, slug, email')
            .eq('id', shopId)
            .single();

        if (shopError || !shop) {
            return NextResponse.json(
                { error: 'Loja não encontrada' },
                { status: 404 }
            );
        }

        // Generate new password
        const newPassword = generateRandomPassword();
        const hashedPassword = await hashPassword(newPassword);

        // Update shop with new password
        const { error: updateError } = await supabase
            .from('shops')
            .update({ password_hash: hashedPassword })
            .eq('id', shopId);

        if (updateError) {
            throw new Error('Erro ao salvar senha no banco de dados');
        }

        // TODO: Send email if shop has email configured
        if (shop.email) {
            console.log(`Email would be sent to ${shop.email} with password: ${newPassword}`);
            // Implement email sending here
            // Example:
            // await sendPasswordEmail(shop.email, newPassword, shop.name);
        }

        return NextResponse.json({
            success: true,
            password: newPassword,
            message: 'Senha resetada com sucesso'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: 'Erro ao resetar senha' },
            { status: 500 }
        );
    }
}
