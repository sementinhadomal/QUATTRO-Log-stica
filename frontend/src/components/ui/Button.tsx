import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  isLoading, 
  variant = 'primary', 
  className = '', 
  disabled, 
  ...props 
}) => {
  let baseClass = 'btn-primary';
  if (variant === 'secondary') baseClass = 'btn-secondary';
  if (variant === 'danger') baseClass = 'btn-danger'; // Requires CSS for btn-danger

  return (
    <button 
      className={`${baseClass} ${className} flex items-center justify-center`} 
      disabled={isLoading || disabled} 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        opacity: (isLoading || disabled) ? 0.7 : 1,
        cursor: (isLoading || disabled) ? 'not-allowed' : 'pointer'
      }}
      {...props}
    >
      {isLoading && <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />}
      {children}
    </button>
  );
};

export default Button;
