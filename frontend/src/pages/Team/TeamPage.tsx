import React from 'react';

const TeamPage = () => {
  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <h2>Gestão de Equipe</h2>
      <div style={{ marginTop: '2rem', background: '#0D131D', padding: '2rem', borderRadius: '8px' }}>
        <button className="btn-primary" style={{ marginBottom: '1rem' }}>+ Novo Membro</button>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1C2A3A' }}>
              <th style={{ padding: '1rem 0' }}>Nome</th>
              <th>E-mail</th>
              <th>Função</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '1rem 0' }}>Admin Quattro</td>
              <td>admin@quattro.com</td>
              <td>Administrador</td>
              <td>Ativo</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamPage;
