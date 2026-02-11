import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateRandomPassword, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { identifier } = await req.json();

        if (!identifier) {
            return NextResponse.json(
                { error: 'Identificador é obrigatório' },
                { status: 400 }
            );
        }

        const supabase = supabaseAdmin;
        let email: string | null = null;
        let entityName: string = '';

        // Check if it's super admin
        if (identifier === 'super-admin' || identifier.startsWith('admin')) {
            const { data: admin } = await supabase
                .from('super_admin')
                .select('id, username, email')
                .eq('username', identifier)
                .single();

            if (!admin) {
                return NextResponse.json(
                    { error: 'Administrador não encontrado' },
                    { status: 404 }
                );
            }

            email = admin.email;
            entityName = 'Administrador';

            // Generate new password
            const newPassword = generateRandomPassword();
            const hashedPassword = await hashPassword(newPassword);

            // Update password in database
            await supabase
                .from('super_admin')
                .update({ password_hash: hashedPassword })
                .eq('id', admin.id);

            // Send email via Supabase
            if (email) {
                await sendPasswordEmail(email, newPassword, entityName);
            }

            return NextResponse.json({
                success: true,
                email: email ? maskEmail(email) : 'N/A',
                message: 'Nova senha enviada para o email cadastrado'
            });
        }

        // Shop password reset
        const { data: shop } = await supabase
            .from('shops')
            .select('id, slug, name, email')
            .eq('slug', identifier)
            .single();

        if (!shop) {
            return NextResponse.json(
                { error: 'Loja não encontrada' },
                { status: 404 }
            );
        }

        if (!shop.email) {
            return NextResponse.json(
                { error: 'Email não configurado para esta loja. Entre em contato com o administrador.' },
                { status: 400 }
            );
        }

        email = shop.email;
        entityName = shop.name;

        // Generate new password
        const newPassword = generateRandomPassword();
        const hashedPassword = await hashPassword(newPassword);

        // Update password in database
        await supabase
            .from('shops')
            .update({ password_hash: hashedPassword })
            .eq('id', shop.id);

        // Send email via Supabase
        if (email) {
            await sendPasswordEmail(email, newPassword, entityName);
        }

        return NextResponse.json({
            success: true,
            email: email ? maskEmail(email) : 'N/A',
            message: 'Nova senha enviada para o email cadastrado'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'Erro ao processar solicitação' },
            { status: 500 }
        );
    }
}

/**
 * Send password reset email via Supabase
 */
async function sendPasswordEmail(email: string, password: string, entityName: string) {

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .password-box { background: white; border: 2px solid #9333ea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
                .password { font-size: 24px; font-weight: bold; color: #9333ea; letter-spacing: 2px; font-family: monospace; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Nova Senha - Lalelilo</h1>
                </div>
                <div class="content">
                    <p>Olá, <strong>${entityName}</strong>!</p>
                    <p>Você solicitou a recuperação de senha. Sua nova senha de acesso ao sistema Lalelilo foi gerada com sucesso:</p>
                    
                    <div class="password-box">
                        <p style="margin: 0; font-size: 14px; color: #666;">Sua nova senha:</p>
                        <p class="password">${password}</p>
                    </div>
                    
                    <p><strong>⚠️ Importante:</strong></p>
                    <ul>
                        <li>Guarde esta senha em um local seguro</li>
                        <li>Não compartilhe sua senha com ninguém</li>
                        <li>Use esta senha para fazer seu próximo login</li>
                    </ul>
                    
                    <p>Se você não solicitou esta alteração, entre em contato com o administrador imediatamente.</p>
                    
                    <div class="footer">
                        <p>© 2026 Lalelilo • Todos os direitos reservados</p>
                        <p>Este é um email automático, por favor não responda.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    // Note: Supabase Auth doesn't support custom emails directly
    // You'll need to use a service like Resend, SendGrid, or configure SMTP
    // For now, this is a placeholder - you'll need to implement actual email sending

    console.log('Email would be sent to:', email);
    console.log('Password:', password);

    // TODO: Implement actual email sending
    // Example with Resend:
    // await resend.emails.send({
    //     from: 'Lalelilo <noreply@lalelilo.com>',
    //     to: email,
    //     subject: '🔐 Nova Senha - Lalelilo',
    //     html: emailHtml
    // });
}

/**
 * Mask email for privacy
 */
function maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername = username.substring(0, 2) + '***' + username.substring(username.length - 1);
    return `${maskedUsername}@${domain}`;
}
