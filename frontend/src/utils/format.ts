export const formatCurrency = (value: number | null | undefined): string => {
  const num = typeof value === 'number' && !isNaN(value) ? value : Number(value) || 0;
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  } catch (e) {
    return 'R$ 0,00';
  }
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return String(dateString || '-');
  }
};

export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return String(dateString || '-');
  }
};

export const maskCPF = (cpf: string | null | undefined): string => {
  if (!cpf) return '';
  const str = String(cpf);
  return str
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  const str = String(phone);
  return str
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

export const formatErrorString = (err: any): string => {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    if (typeof err.error === 'string') return err.error;
    if (typeof err.message === 'string') return err.message;
    if (typeof err.error === 'object' && err.error !== null) {
      if (typeof err.error.message === 'string') return err.error.message;
      if (typeof err.error.error === 'string') return err.error.error;
    }
    try {
      return JSON.stringify(err);
    } catch (e) {
      return 'Ocorreu um erro.';
    }
  }
  return String(err);
};

export const formatCPF = maskCPF;
export const formatPhone = maskPhone;
