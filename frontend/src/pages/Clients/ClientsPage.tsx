import React from 'react';

const ClientsPage = () => {
  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <h2>Clientes</h2>
      <div style={{ marginTop: '2rem', background: '#0D131D', padding: '2rem', borderRadius: '8px' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1C2A3A' }}>
              <th style={{ padding: '1rem 0' }}>Nome</th>
              <th>Telefone</th>
              <th>Cidade</th>
              <th>Total Gasto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '1rem 0' }}>João Silva</td>
              <td>(11) 99999-9999</td>
              <td>São Paulo</td>
              <td>R$ 347,00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientsPage;
