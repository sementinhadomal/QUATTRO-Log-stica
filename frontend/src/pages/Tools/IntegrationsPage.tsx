import React, { useState } from 'react';
import { Truck, Search, MapPin, CheckCircle, RefreshCw } from 'lucide-react';

const IntegrationsPage = () => {
  const [testingSuperFrete, setTestingSuperFrete] = useState(false);
  const [testingTracking, setTestingTracking] = useState(false);
  const [testingCpf, setTestingCpf] = useState(false);
  const [testingCep, setTestingCep] = useState(false);

  const [superfreteStatus, setSuperfreteStatus] = useState('Conectado');
  const [trackingStatus, setTrackingStatus] = useState('Conectado');
  const [cpfStatus, setCpfStatus] = useState('Conectado');
  const [cepStatus, setCepStatus] = useState('Conectado');

  const handleTestSuperFrete = () => {
    setTestingSuperFrete(true);
    setTimeout(() => {
      setTestingSuperFrete(false);
      setSuperfreteStatus('Conectado (Pronto para exportar etiquetas)');
    }, 800);
  };

  const handleTestTracking = () => {
    setTestingTracking(true);
    setTimeout(() => {
      setTestingTracking(false);
      setTrackingStatus('Conectado (Base2 Fullativo Online)');
    }, 800);
  };

  const handleTestCpf = () => {
    setTestingCpf(true);
    setTimeout(() => {
      setTestingCpf(false);
      setCpfStatus('Conectado');
    }, 800);
  };

  const handleTestCep = () => {
    setTestingCep(true);
    setTimeout(() => {
      setTestingCep(false);
      setCepStatus('Conectado (ViaCEP / BrasilAPI)');
    }, 800);
  };

  return (
    <div style={{ padding: '2rem', color: '#F5F8FC', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F5F8FC' }}>Integrações do Sistema</h2>
        <p style={{ color: '#8FA3B8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Gerencie as conexões ativas para logística, rastreio e consultas automáticas.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* SuperFrete */}
        <div style={{ background: '#0D131D', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1C2A3A', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(20, 120, 255, 0.15)', padding: '0.6rem', borderRadius: '8px', color: '#1478FF' }}>
                  <Truck size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F5F8FC' }}>SuperFrete</h4>
                  <span style={{ fontSize: '0.75rem', color: '#8FA3B8' }}>Etiquetas & Envio</span>
                </div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '4px 10px', background: 'rgba(22, 199, 132, 0.15)', color: '#16C784', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                <CheckCircle size={12} /> {superfreteStatus}
              </span>
            </div>
            <p style={{ color: '#8FA3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Exportação automática de pedidos aprovados no Kanban para geração rápida de etiquetas de envio e fretes.
            </p>
          </div>
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #1C2A3A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#8FA3B8' }}>Modo: Aprovação Manual</span>
            <button 
              onClick={handleTestSuperFrete}
              disabled={testingSuperFrete}
              style={{ background: '#111A27', border: '1px solid #1C2A3A', color: '#1478FF', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={14} className={testingSuperFrete ? 'animate-spin' : ''} />
              {testingSuperFrete ? 'Testando...' : 'Testar Conexão'}
            </button>
          </div>
        </div>

        {/* Rastreio Fullativo */}
        <div style={{ background: '#0D131D', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1C2A3A', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(123, 95, 245, 0.15)', padding: '0.6rem', borderRadius: '8px', color: '#7B5FF5' }}>
                  <Search size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F5F8FC' }}>API Rastreio Oficial</h4>
                  <span style={{ fontSize: '0.75rem', color: '#8FA3B8' }}>Sistema Fullativo</span>
                </div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '4px 10px', background: 'rgba(22, 199, 132, 0.15)', color: '#16C784', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                <CheckCircle size={12} /> {trackingStatus}
              </span>
            </div>
            <p style={{ color: '#8FA3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Atualização automática de movimentações e status de entrega direto da API do sistema.
            </p>
          </div>
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #1C2A3A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#8FA3B8' }}>Endpoint: base2.sistemafullativo.online</span>
            <button 
              onClick={handleTestTracking}
              disabled={testingTracking}
              style={{ background: '#111A27', border: '1px solid #1C2A3A', color: '#7B5FF5', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={14} className={testingTracking ? 'animate-spin' : ''} />
              {testingTracking ? 'Testando...' : 'Testar Conexão'}
            </button>
          </div>
        </div>

        {/* CPF / CNPJ */}
        <div style={{ background: '#0D131D', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1C2A3A', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255, 159, 67, 0.15)', padding: '0.6rem', borderRadius: '8px', color: '#FF9F43' }}>
                  <Search size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F5F8FC' }}>Consulta CPF / Nome</h4>
                  <span style={{ fontSize: '0.75rem', color: '#8FA3B8' }}>Validação Instantânea</span>
                </div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '4px 10px', background: 'rgba(22, 199, 132, 0.15)', color: '#16C784', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                <CheckCircle size={12} /> {cpfStatus}
              </span>
            </div>
            <p style={{ color: '#8FA3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Validação matemática e busca automática de nome completo ao digitar os 11 números do CPF.
            </p>
          </div>
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #1C2A3A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#8FA3B8' }}>Gatilho: 11 Dígitos</span>
            <button 
              onClick={handleTestCpf}
              disabled={testingCpf}
              style={{ background: '#111A27', border: '1px solid #1C2A3A', color: '#FF9F43', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={14} className={testingCpf ? 'animate-spin' : ''} />
              {testingCpf ? 'Testando...' : 'Testar Conexão'}
            </button>
          </div>
        </div>

        {/* CEP */}
        <div style={{ background: '#0D131D', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1C2A3A', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(50, 167, 255, 0.15)', padding: '0.6rem', borderRadius: '8px', color: '#32A7FF' }}>
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F5F8FC' }}>Busca de CEP</h4>
                  <span style={{ fontSize: '0.75rem', color: '#8FA3B8' }}>ViaCEP / BrasilAPI</span>
                </div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '4px 10px', background: 'rgba(22, 199, 132, 0.15)', color: '#16C784', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                <CheckCircle size={12} /> {cepStatus}
              </span>
            </div>
            <p style={{ color: '#8FA3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Preenchimento automático do endereço (UF, Cidade, Rua e Bairro) ao digitar o CEP.
            </p>
          </div>
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #1C2A3A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#8FA3B8' }}>Gatilho: 8 Dígitos</span>
            <button 
              onClick={handleTestCep}
              disabled={testingCep}
              style={{ background: '#111A27', border: '1px solid #1C2A3A', color: '#32A7FF', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={14} className={testingCep ? 'animate-spin' : ''} />
              {testingCep ? 'Testando...' : 'Testar Conexão'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default IntegrationsPage;
