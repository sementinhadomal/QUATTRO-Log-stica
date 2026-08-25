import { Request, Response } from 'express';
import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

interface IntegrationStatus {
  nome: string;
  status: 'conectado' | 'aguardando_credenciais' | 'erro';
  ultimo_teste: string | null;
  mensagem: string;
  token_configurado: boolean;
}

export async function getIntegrationsStatus(req: Request, res: Response): Promise<void> {
  const statuses: IntegrationStatus[] = [
    {
      nome: 'API de CPF',
      status: env.CPF_API_TOKEN ? 'conectado' : 'aguardando_credenciais',
      ultimo_teste: null,
      mensagem: env.CPF_API_TOKEN
        ? 'Token configurado. Use "Testar" para verificar.'
        : 'Configure CPF_API_TOKEN no arquivo .env',
      token_configurado: !!env.CPF_API_TOKEN,
    },
    {
      nome: 'API de CEP',
      status: env.CEP_API_BASE_URL ? 'conectado' : 'aguardando_credenciais',
      ultimo_teste: null,
      mensagem: 'API pública — sem token necessário.',
      token_configurado: true,
    },
    {
      nome: 'SuperFrete',
      status: env.SUPERFRETE_API_TOKEN ? 'conectado' : 'aguardando_credenciais',
      ultimo_teste: null,
      mensagem: env.SUPERFRETE_API_TOKEN
        ? 'Token configurado. Use "Testar" para verificar.'
        : 'Configure SUPERFRETE_API_TOKEN no arquivo .env',
      token_configurado: !!env.SUPERFRETE_API_TOKEN,
    },
    {
      nome: 'Payt',
      status: env.PAYT_API_TOKEN ? 'conectado' : 'aguardando_credenciais',
      ultimo_teste: null,
      mensagem: env.PAYT_API_TOKEN
        ? 'Token configurado. Use "Testar" para verificar.'
        : 'Configure PAYT_API_TOKEN no arquivo .env',
      token_configurado: !!env.PAYT_API_TOKEN,
    },
    {
      nome: 'E-mail (SMTP)',
      status:
        env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASSWORD
          ? 'conectado'
          : 'aguardando_credenciais',
      ultimo_teste: null,
      mensagem:
        env.EMAIL_HOST && env.EMAIL_USER
          ? `Configurado: ${env.EMAIL_USER}@${env.EMAIL_HOST}`
          : 'Configure EMAIL_HOST, EMAIL_USER e EMAIL_PASSWORD no arquivo .env',
      token_configurado: !!(env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASSWORD),
    },
    {
      nome: 'Postback',
      status: env.POSTBACK_SIGNING_SECRET ? 'conectado' : 'aguardando_credenciais',
      ultimo_teste: null,
      mensagem: env.POSTBACK_SIGNING_SECRET
        ? 'Secret configurado. Postbacks prontos para envio.'
        : 'Configure POSTBACK_SIGNING_SECRET no arquivo .env',
      token_configurado: !!env.POSTBACK_SIGNING_SECRET,
    },
  ];

  res.json({ integracoes: statuses });
}

export async function testIntegration(req: Request, res: Response): Promise<void> {
  const { nome } = req.params;

  try {
    switch (nome.toLowerCase()) {
      case 'cpf':
      case 'api-de-cpf': {
        if (!env.CPF_API_TOKEN) {
          res.json({ sucesso: false, mensagem: 'Token não configurado.' });
          return;
        }
        const r = await axios.get(env.CPF_API_BASE_URL, {
          params: { documento: '00000000000', token: env.CPF_API_TOKEN },
          timeout: 8000,
          validateStatus: () => true,
        });
        res.json({
          sucesso: r.status !== 500,
          mensagem: `Status HTTP: ${r.status}`,
        });
        break;
      }

      case 'cep':
      case 'api-de-cep': {
        const r = await axios.get(env.CEP_API_BASE_URL, {
          params: { cep: '01001000' },
          timeout: 5000,
          validateStatus: () => true,
        });
        res.json({
          sucesso: r.status === 200,
          mensagem: r.status === 200 ? 'API de CEP respondendo.' : `Status: ${r.status}`,
        });
        break;
      }

      case 'superfrete': {
        if (!env.SUPERFRETE_API_TOKEN) {
          res.json({ sucesso: false, mensagem: 'Token não configurado.' });
          return;
        }
        const r = await axios.get(`${env.SUPERFRETE_API_URL}/user/info`, {
          headers: { Authorization: `Bearer ${env.SUPERFRETE_API_TOKEN}` },
          timeout: 10000,
          validateStatus: () => true,
        });
        res.json({
          sucesso: r.status === 200,
          mensagem: r.status === 200 ? 'Conectado à SuperFrete.' : `Erro: ${r.status}`,
        });
        break;
      }

      case 'payt': {
        if (!env.PAYT_API_TOKEN) {
          res.json({ sucesso: false, mensagem: 'Token não configurado.' });
          return;
        }
        const r = await axios.get(`${env.PAYT_API_URL}/account`, {
          headers: { Authorization: `Bearer ${env.PAYT_API_TOKEN}` },
          timeout: 10000,
          validateStatus: () => true,
        });
        res.json({
          sucesso: r.status === 200,
          mensagem: r.status === 200 ? 'Conectado ao Payt.' : `Erro: ${r.status}`,
        });
        break;
      }

      default:
        res.status(404).json({ error: 'Integração não encontrada.' });
    }
  } catch (err: any) {
    res.json({ sucesso: false, mensagem: `Erro de conexão: ${err.message}` });
  }
}
