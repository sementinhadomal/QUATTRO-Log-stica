import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASSWORD) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_SECURE,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
    });
  }

  return transporter;
}

export async function sendPasswordResetEmail(
  to: string,
  nome: string,
  token: string
): Promise<void> {
  const transport = getTransporter();
  
  if (!transport) {
    logger.warn('Email service not configured — password reset email not sent');
    return;
  }

  const resetUrl = `${env.FRONTEND_URL}/redefinir-senha?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redefinição de Senha — QUATTRO Logística</title>
    </head>
    <body style="margin:0;padding:0;background:#05070A;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0"
              style="background:#0D131D;border-radius:12px;border:1px solid #1C2A3A;overflow:hidden;">
              <!-- Header -->
              <tr>
                <td align="center" style="padding:40px;background:#070B12;border-bottom:1px solid #1C2A3A;">
                  <h1 style="color:#1478FF;margin:0;font-size:28px;letter-spacing:2px;">QUATTRO</h1>
                  <p style="color:#8FA3B8;margin:4px 0 0;font-size:12px;letter-spacing:4px;">LOGÍSTICA</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <h2 style="color:#F5F8FC;margin:0 0 16px;font-size:22px;">Redefinição de Senha</h2>
                  <p style="color:#8FA3B8;font-size:15px;line-height:1.6;margin:0 0 24px;">
                    Olá, <strong style="color:#F5F8FC;">${nome}</strong>! Recebemos uma solicitação 
                    para redefinir a senha da sua conta QUATTRO Logística.
                  </p>
                  <p style="color:#8FA3B8;font-size:15px;line-height:1.6;margin:0 0 32px;">
                    Clique no botão abaixo para criar uma nova senha. Este link expirará em <strong style="color:#FF9F43;">1 hora</strong>.
                  </p>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center"
                        style="background:#0866E5;border-radius:8px;padding:14px 32px;">
                        <a href="${resetUrl}"
                          style="color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:600;display:block;">
                          Redefinir Senha
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color:#8FA3B8;font-size:13px;line-height:1.6;margin:32px 0 0;">
                    Se você não solicitou a redefinição de senha, ignore este e-mail.
                    Sua senha permanece a mesma.
                  </p>
                  <p style="color:#8FA3B8;font-size:12px;margin:16px 0 0;word-break:break-all;">
                    Ou copie e cole este link no navegador:<br>
                    <span style="color:#1478FF;">${resetUrl}</span>
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:24px 40px;background:#070B12;border-top:1px solid #1C2A3A;">
                  <p style="color:#8FA3B8;font-size:12px;margin:0;text-align:center;">
                    QUATTRO Logística — Sistema de Gerenciamento<br>
                    Este é um e-mail automático, não responda.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transport.sendMail({
    from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDRESS || env.EMAIL_USER}>`,
    to,
    subject: 'Redefinição de Senha — QUATTRO Logística',
    html,
  });

  logger.info(`Password reset email sent to: ${to}`);
}

export async function sendWelcomeEmail(to: string, nome: string, senha: string): Promise<void> {
  const transport = getTransporter();

  if (!transport) {
    logger.warn('Email service not configured — welcome email not sent');
    return;
  }

  const loginUrl = `${env.FRONTEND_URL}/login`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Bem-vindo ao QUATTRO Logística</title>
    </head>
    <body style="margin:0;padding:0;background:#05070A;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0"
              style="background:#0D131D;border-radius:12px;border:1px solid #1C2A3A;overflow:hidden;">
              <tr>
                <td align="center" style="padding:40px;background:#070B12;border-bottom:1px solid #1C2A3A;">
                  <h1 style="color:#1478FF;margin:0;font-size:28px;letter-spacing:2px;">QUATTRO</h1>
                  <p style="color:#8FA3B8;margin:4px 0 0;font-size:12px;letter-spacing:4px;">LOGÍSTICA</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <h2 style="color:#F5F8FC;margin:0 0 16px;">Bem-vindo, ${nome}!</h2>
                  <p style="color:#8FA3B8;font-size:15px;line-height:1.6;margin:0 0 24px;">
                    Seu acesso ao QUATTRO Logística foi criado. Use as credenciais abaixo para entrar.
                  </p>
                  <div style="background:#111A27;border:1px solid #1C2A3A;border-radius:8px;padding:20px;margin:0 0 24px;">
                    <p style="color:#8FA3B8;font-size:13px;margin:0 0 8px;">E-mail:</p>
                    <p style="color:#F5F8FC;font-size:16px;margin:0 0 16px;font-weight:600;">${to}</p>
                    <p style="color:#8FA3B8;font-size:13px;margin:0 0 8px;">Senha provisória:</p>
                    <p style="color:#1478FF;font-size:16px;margin:0;font-weight:600;font-family:monospace;">${senha}</p>
                  </div>
                  <p style="color:#FF9F43;font-size:13px;margin:0 0 24px;">
                    ⚠️ Por segurança, altere sua senha imediatamente após o primeiro acesso.
                  </p>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:#0866E5;border-radius:8px;padding:14px 32px;">
                        <a href="${loginUrl}" style="color:#FFF;text-decoration:none;font-size:16px;font-weight:600;">
                          Acessar o Sistema
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 40px;background:#070B12;border-top:1px solid #1C2A3A;">
                  <p style="color:#8FA3B8;font-size:12px;margin:0;text-align:center;">
                    QUATTRO Logística — Este é um e-mail automático, não responda.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transport.sendMail({
    from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDRESS || env.EMAIL_USER}>`,
    to,
    subject: 'Seu acesso ao QUATTRO Logística',
    html,
  });
}
