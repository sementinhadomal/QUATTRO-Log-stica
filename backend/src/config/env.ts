import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, defaultValue: string = ''): string {
  return process.env[name] || defaultValue;
}

function optionalBool(name: string, defaultValue: boolean = false): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

function optionalInt(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export const env = {
  // App
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: optionalInt('PORT', 3001),
  APP_URL: optional('APP_URL', 'http://localhost:3001'),
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),
  IS_PRODUCTION: optional('NODE_ENV', 'development') === 'production',

  // Database
  DATABASE_URL: required('DATABASE_URL'),

  // Session
  SESSION_SECRET: required('SESSION_SECRET'),

  // CPF API
  CPF_API_BASE_URL: optional('CPF_API_BASE_URL', 'https://base4.sistemafullativo.online:81/api/cpf-cnpj'),
  CPF_API_TOKEN: optional('CPF_API_TOKEN', ''),

  // CEP API
  CEP_API_BASE_URL: optional('CEP_API_BASE_URL', 'https://base2.sistemafullativo.online:80/api/cep1'),
  VIACEP_FALLBACK: optionalBool('VIACEP_FALLBACK', true),

  // SuperFrete
  SUPERFRETE_API_URL: optional('SUPERFRETE_API_URL', 'https://superfrete.com/api/v0'),
  SUPERFRETE_API_TOKEN: optional('SUPERFRETE_API_TOKEN', ''),
  SUPERFRETE_WEBHOOK_SECRET: optional('SUPERFRETE_WEBHOOK_SECRET', ''),
  SUPERFRETE_FROM_ID: optional('SUPERFRETE_FROM_ID', ''),

  // Payt
  PAYT_API_URL: optional('PAYT_API_URL', 'https://api.payt.com.br/v1'),
  PAYT_API_TOKEN: optional('PAYT_API_TOKEN', ''),
  PAYT_WEBHOOK_SECRET: optional('PAYT_WEBHOOK_SECRET', ''),

  // Email
  EMAIL_HOST: optional('EMAIL_HOST', 'smtp.gmail.com'),
  EMAIL_PORT: optionalInt('EMAIL_PORT', 587),
  EMAIL_SECURE: optionalBool('EMAIL_SECURE', false),
  EMAIL_USER: optional('EMAIL_USER', ''),
  EMAIL_PASSWORD: optional('EMAIL_PASSWORD', ''),
  EMAIL_FROM_NAME: optional('EMAIL_FROM_NAME', 'QUATTRO Logística'),
  EMAIL_FROM_ADDRESS: optional('EMAIL_FROM_ADDRESS', ''),

  // Postback
  POSTBACK_SIGNING_SECRET: optional('POSTBACK_SIGNING_SECRET', ''),

  // Files
  UPLOAD_MAX_SIZE_MB: optionalInt('UPLOAD_MAX_SIZE_MB', 10),
  UPLOAD_DIR: optional('UPLOAD_DIR', './uploads'),
  FILE_LINK_EXPIRY_MINUTES: optionalInt('FILE_LINK_EXPIRY_MINUTES', 60),

  // Security
  LOGIN_MAX_ATTEMPTS: optionalInt('LOGIN_MAX_ATTEMPTS', 5),
  LOGIN_WINDOW_MINUTES: optionalInt('LOGIN_WINDOW_MINUTES', 15),
};

export type Env = typeof env;
