import React, { InputHTMLAttributes } from 'react';
import { maskCPF, maskPhone } from '../../utils/format';

export const maskCEP = (cep: string) => {
  return cep
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  maskType?: 'cpf' | 'phone' | 'cep';
}

export const Input: React.FC<InputProps> = ({ label, error, maskType, onChange, className = '', ...props }) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (maskType && onChange) {
      let value = e.target.value;
      if (maskType === 'cpf') value = maskCPF(value);
      if (maskType === 'phone') value = maskPhone(value);
      if (maskType === 'cep') value = maskCEP(value);
      
      e.target.value = value;
      onChange(e);
    } else if (onChange) {
      onChange(e);
    }
  };

  return (
    <div style={{ marginBottom: '1rem', width: '100%' }}>
      {label && <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#8FA3B8' }}>{label}</label>}
      <input 
        className={`input-field ${className}`}
        onChange={handleChange}
        style={{ borderColor: error ? '#FF496C' : undefined }}
        {...props} 
      />
      {error && <span style={{ color: '#FF496C', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{error}</span>}
    </div>
  );
};

export default Input;
