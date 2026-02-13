import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_CONFIG = {
    from: 'Lalelilo <noreply@noviapp.com.br>',
    replyTo: 'suporte@noviapp.com.br',
};
