import React from 'react';

const IntegrationsPage = () => {
  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <h2>Integrações</h2>
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div style={{ background: '#0D131D', padding: '1.5rem', borderRadius: '8px', border: '1px solid #1C2A3A' }}>
          <h4>API CPF / CNPJ</h4>
          <span style={{ display: 'inline-block', padding: '4px 8px', background: 'rgba(22, 199, 132, 0.1)', color: '#16C784', borderRadius: '4px', fontSize: '12px', marginTop: '8px' }}>Conectado</span>
          <p style={{ marginTop: '1rem', color: '#8FA3B8', fontSize: '14px' }}>Integração ativa para busca de dados.</p>
          <button className="btn-secondary" style={{ marginTop: '1rem' }}>Testar conexão</button>
        </div>
        <div style={{ background: '#0D131D', padding: '1.5rem', borderRadius: '8px', border: '1px solid #1C2A3A' }}>
          <h4>Payt (Gateway)</h4>
          <span style={{ display: 'inline-block', padding: '4px 8px', background: 'rgba(255, 159, 67, 0.1)', color: '#FF9F43', borderRadius: '4px', fontSize: '12px', marginTop: '8px' }}>Aguardando Credenciais</span>
          <p style={{ marginTop: '1rem', color: '#8FA3B8', fontSize: '14px' }}>Insira o token para gerar links de pagamento.</p>
          <button className="btn-secondary" style={{ marginTop: '1rem' }}>Configurar</button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
