import React from 'react';

const PostbackPage = () => {
  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <h2>Webhooks / Postbacks</h2>
      <div style={{ marginTop: '2rem', background: '#0D131D', padding: '2rem', borderRadius: '8px' }}>
        <button className="btn-primary" style={{ marginBottom: '1rem' }}>+ Novo Postback</button>
        <p style={{ color: '#8FA3B8' }}>Nenhum postback configurado no momento.</p>
      </div>
    </div>
  );
};

export default PostbackPage;
