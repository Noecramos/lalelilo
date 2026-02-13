import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
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
            .select('id, name, slug, email, password_hash')
            .eq('id', shopId)
            .single();

        if (shopError || !shop) {
            return NextResponse.json(
                { error: 'Loja não encontrada' },
                { status: 404 }
            );
        }

        // Check if password already exists
        if (shop.password_hash) {
            return NextResponse.json(
                { error: 'Esta loja já possui senha configurada. Use a opção "Resetar" para gerar uma nova.' },
                { status: 400 }
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
        }

        return NextResponse.json({
            success: true,
            password: newPassword,
            message: 'Senha gerada com sucesso'
        });

    } catch (error) {
        console.error('Generate password error:', error);
        return NextResponse.json(
            { error: 'Erro ao gerar senha' },
            { status: 500 }
        );
    }
}
