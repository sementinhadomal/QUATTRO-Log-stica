import React, { Component, ErrorInfo, ReactNode } from 'react';
import { formatErrorString } from '../../utils/format';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const errorMsg = formatErrorString(this.state.error);

      return (
        <div style={{
          minHeight: '100vh',
          background: '#05070A',
          color: '#F5F8FC',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif'
        }}>
          <h2 style={{ color: '#FF496C', marginBottom: '1rem', fontSize: '1.5rem' }}>
            Ops! Algo deu errado ao carregar este componente.
          </h2>
          <p style={{ color: '#8FA3B8', marginBottom: '1.5rem', maxWidth: '500px', fontSize: '0.875rem' }}>
            {errorMsg || 'Ocorreu um erro inesperado na interface.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
            style={{
              background: '#1478FF',
              color: '#FFF',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Voltar ao Início
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
