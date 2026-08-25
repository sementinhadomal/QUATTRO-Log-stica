import React from 'react';

const FrustratedPage = () => {
  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <h2>Pedidos Frustrados</h2>
      <div style={{ marginTop: '2rem', background: '#0D131D', padding: '2rem', borderRadius: '8px' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1C2A3A' }}>
              <th style={{ padding: '1rem 0' }}>Cliente</th>
              <th>Motivo</th>
              <th>Valor</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} style={{ padding: '2rem 0', textAlign: 'center', color: '#8FA3B8' }}>
                Nenhum pedido frustrado encontrado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FrustratedPage;
