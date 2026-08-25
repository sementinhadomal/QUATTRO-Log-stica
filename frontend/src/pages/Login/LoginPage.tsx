import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../stores/auth.store';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/login', { 
        email: email.trim(), 
        senha: password,
        password: password 
      });

      const loggedUser = response.data.user || response.data;
      setUser(loggedUser);
      navigate('/', { replace: true });
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Erro ao realizar login. Verifique suas credenciais.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/recuperar-senha', { email: forgotEmail });
      setForgotMsg('Link de recuperação enviado para seu e-mail.');
    } catch (err: any) {
      setForgotMsg('Erro ao solicitar recuperação.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/assets/logo-quattro.png" alt="QUATTRO Logística" className="login-logo" />
          <h2>QUATTRO Logística</h2>
          <p>Acesse sua conta para continuar</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>E-mail</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="seu@email.com"
            />
          </div>
          
          <div className="form-group">
            <label>Senha</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="input-field" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="login-actions">
            <button type="button" className="forgot-link" onClick={() => setShowForgot(true)}>
              Esqueci minha senha
            </button>
          </div>

          <button type="submit" className="btn-primary login-btn" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>

      {showForgot && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Recuperar Senha</h3>
            <p>Digite seu e-mail para receber um link de recuperação.</p>
            {forgotMsg && <div className="forgot-msg">{forgotMsg}</div>}
            <form onSubmit={handleForgot}>
              <input 
                type="email" 
                className="input-field" 
                placeholder="E-mail cadastrado" 
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForgot(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Enviar link</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
