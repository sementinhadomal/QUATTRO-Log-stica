import React from 'react';

const TrafficPage = () => {
  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <h2>Gestão de Tráfego</h2>
      <div style={{ marginTop: '2rem', background: '#0D131D', padding: '2rem', borderRadius: '8px' }}>
        <button className="btn-primary" style={{ marginBottom: '1rem' }}>Importar CSV</button>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1C2A3A' }}>
              <th style={{ padding: '1rem 0' }}>Data</th>
              <th>Gasto</th>
              <th>Leads</th>
              <th>CPL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '1rem 0' }}>24/10/2023</td>
              <td>R$ 1.200,00</td>
              <td>150</td>
              <td>R$ 8,00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrafficPage;
