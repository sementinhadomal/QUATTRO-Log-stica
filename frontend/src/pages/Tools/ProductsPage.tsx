import React from 'react';

const ProductsPage = () => {
  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <h2>Produtos e Kits</h2>
      <div style={{ marginTop: '2rem', background: '#0D131D', padding: '2rem', borderRadius: '8px' }}>
        <h3>Kits QUATTRO 4-em-1</h3>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1C2A3A' }}>
              <th style={{ padding: '1rem 0' }}>Kit</th>
              <th>Preço</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '1rem 0' }}>1 Pote</td>
              <td>R$ 147,00</td>
              <td><button className="btn-secondary">Editar</button></td>
            </tr>
            <tr>
              <td style={{ padding: '1rem 0' }}>2 Potes</td>
              <td>R$ 247,00</td>
              <td><button className="btn-secondary">Editar</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsPage;
