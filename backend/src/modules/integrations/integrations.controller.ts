import { Request, Response } from 'express';
import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

// ─── CPF Validation (mathematical) ───────────────────────────────────────────
function validateCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, '');
  if (nums.length !== 11) return false;
  if (/^(\d)\1+$/.test(nums)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(nums[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (check !== parseInt(nums[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(nums[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return check === parseInt(nums[10]);
}

// ─── CPF Query Endpoint ───────────────────────────────────────────────────────
export async function queryCPF(req: Request, res: Response): Promise<void> {
  const { cpf } = req.body;

  if (!cpf) {
    res.status(400).json({ error: 'CPF é obrigatório.' });
    return;
  }

  const cpfNums = cpf.replace(/\D/g, '');

  if (cpfNums.length !== 11) {
    res.status(400).json({ error: 'CPF deve ter 11 dígitos.' });
    return;
  }

  if (!validateCPF(cpfNums)) {
    res.status(422).json({ error: 'CPF inválido.' });
    return;
  }

  if (!env.CPF_API_TOKEN) {
    res.status(503).json({
      error: 'API de CPF não configurada.',
      fallback: true,
      cpfValido: true,
    });
    return;
  }

  try {
    const url = `${env.CPF_API_BASE_URL}`;
    const response = await axios.get(url, {
      params: {
        documento: cpfNums,
        token: env.CPF_API_TOKEN,
      },
      timeout: 8000,
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data) {
      const data = response.data;
      const nome = data.nome || data.name || data.nomeCompleto || null;
      const situacao = data.situacao || data.status || null;

      res.json({
        cpfValido: true,
        nome: nome || null,
        situacao: situacao || null,
        encontrado: !!nome,
        dados: { cpf: cpfNums, nome },
      });
    } else {
      res.json({
        cpfValido: true,
        encontrado: false,
        nome: null,
        fallback: true,
      });
    }
  } catch (err: any) {
    logger.warn('CPF API error:', err.message);
    res.json({
      cpfValido: true,
      encontrado: false,
      nome: null,
      fallback: true,
    });
  }
}

// ─── CEP Query Endpoint ───────────────────────────────────────────────────────
export async function queryCEP(req: Request, res: Response): Promise<void> {
  const { cep } = req.query as { cep: string };

  if (!cep) {
    res.status(400).json({ error: 'CEP é obrigatório.' });
    return;
  }

  const cepNums = cep.replace(/\D/g, '');

  if (cepNums.length !== 8) {
    res.status(400).json({ error: 'CEP deve ter 8 dígitos.' });
    return;
  }

  try {
    const url = env.CEP_API_BASE_URL;
    const response = await axios.get(url, {
      params: { cep: cepNums },
      timeout: 5000,
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data && !response.data.erro) {
      const data = response.data;
      const endereco = {
        cep: cepNums,
        uf: data.uf || data.estado || '',
        cidade: data.cidade || data.localidade || data.municipio || '',
        rua: data.logradouro || data.rua || data.endereco || '',
        bairro: data.bairro || '',
      };

      if (endereco.uf && endereco.cidade) {
        res.json({ encontrado: true, ...endereco });
        return;
      }
    }
  } catch (err: any) {
    logger.warn('Primary CEP API error:', err.message);
  }

  // Fallback ViaCEP
  try {
    const viacepResponse = await axios.get(
      `https://viacep.com.br/ws/${cepNums}/json/`,
      { timeout: 5000, validateStatus: () => true }
    );

    if (viacepResponse.status === 200 && !viacepResponse.data.erro) {
      const v = viacepResponse.data;
      res.json({
        encontrado: true,
        cep: cepNums,
        uf: v.uf || '',
        cidade: v.localidade || '',
        rua: v.logradouro || '',
        bairro: v.bairro || '',
        fonte: 'viacep',
      });
      return;
    }
  } catch (err: any) {
    logger.warn('ViaCEP fallback error:', err.message);
  }

  res.status(404).json({ error: 'CEP não encontrado.', encontrado: false });
}

// ─── Rastreio Query Endpoint (API Fullativo Rastreio) ────────────────────────
export async function queryRastreio(req: Request, res: Response): Promise<void> {
  const codigo = (req.query.codigo || req.body?.codigo) as string;

  if (!codigo) {
    res.status(400).json({ error: 'Código de rastreio é obrigatório.' });
    return;
  }

  const cleanCodigo = codigo.trim().toUpperCase();

  try {
    const trackingUrl = `https://base2.sistemafullativo.online:80/api/rastreio?codigo=${encodeURIComponent(cleanCodigo)}`;
    
    const response = await axios.get(trackingUrl, {
      timeout: 10000,
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data) {
      res.json({
        codigo: cleanCodigo,
        encontrado: true,
        urlConsulta: trackingUrl,
        rastreio: response.data,
      });
    } else {
      res.status(response.status).json({
        codigo: cleanCodigo,
        encontrado: false,
        error: 'Rastreio não localizado na API oficial.',
      });
    }
  } catch (err: any) {
    logger.warn(`Erro ao consultar API de rastreio para o código ${cleanCodigo}:`, err.message);
    res.status(500).json({
      codigo: cleanCodigo,
      encontrado: false,
      error: 'Erro de conexão com o serviço de rastreamento.',
    });
  }
}
