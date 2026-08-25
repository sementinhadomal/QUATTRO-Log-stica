import React from 'react';
import { useAuth } from '../../stores/auth.store';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  
  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <h2>Meu Perfil</h2>
      <div style={{ marginTop: '2rem', background: '#0D131D', padding: '2rem', borderRadius: '8px', maxWidth: '600px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8FA3B8' }}>Nome</label>
          <input type="text" className="input-field" defaultValue={user?.name || ''} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8FA3B8' }}>E-mail</label>
          <input type="email" className="input-field" defaultValue={user?.email || ''} />
        </div>
        
        <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Segurança</h3>
        <button className="btn-secondary" style={{ color: '#FF496C', borderColor: 'rgba(255, 73, 108, 0.2)' }} onClick={logout}>
          Encerrar todas as sessões
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
