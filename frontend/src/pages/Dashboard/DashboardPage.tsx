import React from 'react';

const DashboardPage = () => {
  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <h2>Dashboard Analytics</h2>
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div style={{ background: '#0D131D', padding: '1.5rem', borderRadius: '8px' }}>
          <h4>Receita Total</h4>
          <h2 style={{ color: '#16C784', marginTop: '0.5rem' }}>R$ 45.230,00</h2>
        </div>
        <div style={{ background: '#0D131D', padding: '1.5rem', borderRadius: '8px' }}>
          <h4>Leads</h4>
          <h2 style={{ marginTop: '0.5rem' }}>1.234</h2>
        </div>
        <div style={{ background: '#0D131D', padding: '1.5rem', borderRadius: '8px' }}>
          <h4>CPA Médio</h4>
          <h2 style={{ color: '#FF496C', marginTop: '0.5rem' }}>R$ 45,50</h2>
        </div>
        <div style={{ background: '#0D131D', padding: '1.5rem', borderRadius: '8px' }}>
          <h4>ROI</h4>
          <h2 style={{ color: '#1478FF', marginTop: '0.5rem' }}>3.2x</h2>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
