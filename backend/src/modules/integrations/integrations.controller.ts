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
  const cpf = req.body?.cpf || req.query?.cpf;

  if (!cpf) {
    res.status(400).json({ error: 'CPF é obrigatório.' });
    return;
  }

  const cpfNums = String(cpf).replace(/\D/g, '');

  if (cpfNums.length !== 11) {
    res.status(400).json({ error: 'CPF deve ter 11 dígitos.' });
    return;
  }

  const isValid = validateCPF(cpfNums);

  if (env.CPF_API_TOKEN) {
    try {
      const response = await axios.get(`${env.CPF_API_BASE_URL}`, {
        params: { documento: cpfNums, token: env.CPF_API_TOKEN },
        timeout: 6000,
        validateStatus: () => true,
      });

      if (response.status === 200 && response.data) {
        const data = response.data;
        const nome = data.nome || data.name || data.nomeCompleto || null;
        res.json({
          cpfValido: true,
          nome: nome || null,
          encontrado: !!nome,
          dados: { cpf: cpfNums, nome },
        });
        return;
      }
    } catch (err: any) {
      logger.warn('CPF API connection error:', err.message);
    }
  }

  // Fallback response: validate mathematically and return clean payload
  res.json({
    cpfValido: isValid,
    encontrado: true,
    nome: null,
    fallback: true,
  });
}

// ─── CEP Query Endpoint ───────────────────────────────────────────────────────
export async function queryCEP(req: Request, res: Response): Promise<void> {
  const cep = (req.query.cep || req.body?.cep) as string;

  if (!cep) {
    res.status(400).json({ error: 'CEP é obrigatório.' });
    return;
  }

  const cepNums = String(cep).replace(/\D/g, '');

  if (cepNums.length !== 8) {
    res.status(400).json({ error: 'CEP deve ter 8 dígitos.' });
    return;
  }

  // 1. Try ViaCEP (Fastest public REST service for Brazil CEPs)
  try {
    const viacepResponse = await axios.get(
      `https://viacep.com.br/ws/${cepNums}/json/`,
      { timeout: 5000, validateStatus: () => true }
    );

    if (viacepResponse.status === 200 && !viacepResponse.data?.erro) {
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
    logger.warn('ViaCEP API error:', err.message);
  }

  // 2. Fallback BrasilAPI
  try {
    const brasilapiResponse = await axios.get(
      `https://brasilapi.com.br/api/cep/v1/${cepNums}`,
      { timeout: 5000, validateStatus: () => true }
    );

    if (brasilapiResponse.status === 200 && brasilapiResponse.data) {
      const b = brasilapiResponse.data;
      res.json({
        encontrado: true,
        cep: cepNums,
        uf: b.state || '',
        cidade: b.city || '',
        rua: b.street || '',
        bairro: b.neighborhood || '',
        fonte: 'brasilapi',
      });
      return;
    }
  } catch (err: any) {
    logger.warn('BrasilAPI fallback error:', err.message);
  }

  // Safe fallback to avoid throwing errors on client
  res.json({
    encontrado: false,
    cep: cepNums,
    uf: '',
    cidade: '',
    rua: '',
    bairro: '',
    error: 'CEP não localizado automaticamente.',
  });
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
      timeout: 8000,
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
      res.json({
        codigo: cleanCodigo,
        encontrado: false,
        urlConsulta: trackingUrl,
        error: 'Rastreio não localizado na API oficial.',
      });
    }
  } catch (err: any) {
    logger.warn(`Erro ao consultar API de rastreio para o código ${cleanCodigo}:`, err.message);
    res.json({
      codigo: cleanCodigo,
      encontrado: false,
      error: 'Erro de conexão com o serviço de rastreamento.',
    });
  }
}
