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

  // Check if CPF_API_TOKEN is configured
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
    
    // NEVER expose the token to the browser — call from backend only
    const response = await axios.get(url, {
      params: {
        documento: cpfNums,
        token: env.CPF_API_TOKEN, // Token only in backend
      },
      timeout: 8000,
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data) {
      const data = response.data;

      // Map the real API response fields
      // Testing the actual API response format and mapping accordingly
      const nome = data.nome || data.name || data.nomeCompleto || null;
      const situacao = data.situacao || data.status || null;

      res.json({
        cpfValido: true,
        nome: nome || null,
        situacao: situacao || null,
        encontrado: !!nome,
        dados: {
          cpf: cpfNums,
          nome: nome,
        },
      });
    } else if (response.status === 404 || response.status === 204) {
      res.json({
        cpfValido: true,
        encontrado: false,
        nome: null,
      });
    } else if (response.status === 429) {
      res.status(429).json({
        error: 'Limite de consultas de CPF atingido.',
        cpfValido: true,
        fallback: true,
      });
    } else {
      logger.warn(`CPF API returned status ${response.status}`);
      res.json({
        cpfValido: true,
        encontrado: false,
        nome: null,
        aviso: 'API de CPF indisponível. Dados não verificados.',
        fallback: true,
      });
    }
  } catch (err: any) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      logger.warn('CPF API timeout');
      res.json({
        cpfValido: true,
        encontrado: false,
        nome: null,
        aviso: 'API de CPF indisponível no momento. Você pode continuar com a validação matemática.',
        fallback: true,
      });
      return;
    }

    logger.warn('CPF API error (token not logged):', err.message);
    res.json({
      cpfValido: true,
      encontrado: false,
      nome: null,
      aviso: 'API de CPF indisponível. Continuando com validação matemática.',
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

  // Try primary CEP API
  try {
    const url = env.CEP_API_BASE_URL;
    const response = await axios.get(url, {
      params: { cep: cepNums },
      timeout: 5000,
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data && !response.data.erro) {
      const data = response.data;

      // Map real API response (tested against actual endpoint)
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

  // Fallback: ViaCEP
  if (env.VIACEP_FALLBACK) {
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
  }

  res.status(404).json({ error: 'CEP não encontrado.', encontrado: false });
}
