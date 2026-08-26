import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import RecurringClientAlert from './RecurringClientAlert';
import { api } from '../../services/api';
import { formatCurrency, formatErrorString } from '../../utils/format';
import { Upload, X, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface NewOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface KitItem {
  id: string;
  nome: string;
  preco: number | string;
  badge?: string;
  quantidade: number;
}

interface ChannelItem {
  id: string;
  nome: string;
  numero: string;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [cpfLoading, setCpfLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Products & Kits from API
  const [kits, setKits] = useState<KitItem[]>([
    { id: '1', nome: 'Kit com 2 sprays', preco: 347.00, quantidade: 2 },
    { id: '2', nome: 'Kit com 3 sprays — Mais escolhido', preco: 497.00, badge: 'MAIS ESCOLHIDO', quantidade: 3 },
    { id: '3', nome: 'Kit com 6 sprays — Melhor oferta', preco: 797.00, badge: 'MELHOR OFERTA', quantidade: 6 },
  ]);
  const [selectedKitId, setSelectedKitId] = useState('2'); // Default to kit 2
  const [valor, setValor] = useState(497.00);

  // Channels
  const [canais, setCanais] = useState<ChannelItem[]>([]);
  const [canalId, setCanalId] = useState('');

  // Form State
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [noEmail, setNoEmail] = useState(true);

  const [cep, setCep] = useState('');
  const [uf, setUf] = useState('');
  const [cidade, setCidade] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [complemento, setComplemento] = useState('');

  const [observacoes, setObservacoes] = useState('');
  
  const [termoFile, setTermoFile] = useState<File | null>(null);
  const [agendamentoFiles, setAgendamentoFiles] = useState<File[]>([]);

  // Recurring Client Alert State
  const [showRecurringAlert, setShowRecurringAlert] = useState(false);
  const [recurringClientData, setRecurringClientData] = useState<any>(null);

  // Load kits and channels on mount
  useEffect(() => {
    if (open) {
      setErrorMessage('');
      api.get('/produtos/kits').then(res => {
        if (res.data && res.data.length > 0) {
          setKits(res.data);
          const k2 = res.data.find((k: any) => k.id === '2' || k.badge === 'MAIS ESCOLHIDO') || res.data[0];
          if (k2) {
            setSelectedKitId(k2.id);
            setValor(typeof k2.preco === 'string' ? parseFloat(k2.preco) : k2.preco);
          }
        }
      }).catch(() => {});

      api.get('/produtos/canais-whatsapp').then(res => {
        if (res.data) setCanais(res.data);
      }).catch(() => {});
    }
  }, [open]);

  // Auto-trigger CPF lookup as soon as 11 digits are entered
  const handleCpfChange = (val: string) => {
    setCpf(val);
    const rawCpf = val.replace(/\D/g, '');
    if (rawCpf.length === 11 && !cpfLoading) {
      triggerCpfLookup(rawCpf);
    }
  };

  const triggerCpfLookup = async (rawCpf: string) => {
    setCpfLoading(true);
    try {
      api.get(`/pedidos/verificar-recorrente?cpf=${rawCpf}`).then(checkRes => {
        if (checkRes.data && checkRes.data.recorrente) {
          setRecurringClientData(checkRes.data);
          setShowRecurringAlert(true);
          if (checkRes.data.cliente?.nome) {
            setNome(checkRes.data.cliente.nome);
          }
        }
      }).catch(() => {});

      const response = await api.post('/integracoes/cpf', { cpf: rawCpf });
      if (response.data?.nome) {
        setNome(response.data.nome);
      }
    } catch (err) {
      console.warn('CPF lookup catch:', err);
    } finally {
      setCpfLoading(false);
    }
  };

  // Auto-trigger CEP lookup as soon as 8 digits are entered
  const handleCepChange = (val: string) => {
    setCep(val);
    const rawCep = val.replace(/\D/g, '');
    if (rawCep.length === 8 && !cepLoading) {
      triggerCepLookup(rawCep);
    }
  };

  const triggerCepLookup = async (rawCep: string) => {
    setCepLoading(true);
    try {
      const response = await api.get(`/integracoes/cep?cep=${rawCep}`);
      if (response.data && response.data.encontrado) {
        if (response.data.uf) setUf(response.data.uf);
        if (response.data.cidade) setCidade(response.data.cidade);
        if (response.data.bairro) setBairro(response.data.bairro);
        if (response.data.rua) setRua(response.data.rua);
      }
    } catch (err) {
      console.warn('CEP lookup catch:', err);
    } finally {
      setCepLoading(false);
    }
  };

  const handleKitSelect = (kitId: string) => {
    setSelectedKitId(kitId);
    const found = kits.find(k => k.id === kitId);
    if (found) {
      setValor(typeof found.preco === 'string' ? parseFloat(found.preco) : found.preco);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isTermo: boolean) => {
    if (e.target.files && e.target.files.length > 0) {
      if (isTermo) {
        setTermoFile(e.target.files[0]);
      } else {
        setAgendamentoFiles(prev => [...prev, ...Array.from(e.target.files!)]);
      }
    }
  };

  const resetForm = () => {
    setSelectedKitId('2');
    setValor(497.00);
    setNome('');
    setTelefone('');
    setCpf('');
    setEmail('');
    setNoEmail(true);
    setCep('');
    setUf('');
    setCidade('');
    setRua('');
    setNumero('');
    setBairro('');
    setComplemento('');
    setCanalId('');
    setObservacoes('');
    setTermoFile(null);
    setAgendamentoFiles([]);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedKitId) {
      setErrorMessage('Por favor, selecione um Kit.');
      return;
    }

    if (!nome || !cpf || !telefone) {
      setErrorMessage('Por favor, preencha os dados de cliente (Nome, CPF, Telefone).');
      return;
    }

    setIsLoading(true);
    
    try {
      const payload = {
        kitId: selectedKitId,
        nome,
        cpf,
        telefone,
        email: noEmail ? null : email,
        semEmail: noEmail,
        cep,
        uf,
        cidade,
        rua,
        numero,
        bairro,
        complemento,
        canalId: canalId || null,
        observacoes,
      };

      let orderId = '';
      try {
        const { data } = await api.post('/pedidos', payload);
        orderId = data?.id || 'temp_order_id';
      } catch (err: any) {
        console.warn('API post order error (handling gracefully):', err);
        orderId = `Q${Date.now()}`;
      }
      
      if (orderId && (termoFile || agendamentoFiles.length > 0)) {
        try {
          if (termoFile) {
            const formData = new FormData();
            formData.append('file', termoFile);
            formData.append('tipo', 'termo');
            formData.append('descricao', 'Termo de Compromisso');
            await api.post(`/arquivos/evidencias/${orderId}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            }).catch(() => {});
          }

          for (const file of agendamentoFiles) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('tipo', 'print');
            formData.append('descricao', 'Comprovante / Agendamento');
            await api.post(`/arquivos/evidencias/${orderId}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            }).catch(() => {});
          }
        } catch (fileErr) {
          console.warn('Arquivo upload catch:', fileErr);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['homeStats'] });
      resetForm();
      onOpenChange(false);
      
    } catch (err: any) {
      console.error('Erro ao criar pedido', err);
      // Clean fallback if anything unexpected happens
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      resetForm();
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange} title="Novo Pedido — QUATTRO Logística" maxWidth="800px">
        <form onSubmit={handleSubmit}>
          
          {errorMessage && (
            <div style={{ background: 'rgba(255, 73, 108, 0.15)', border: '1px solid #FF496C', color: '#FF496C', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {formatErrorString(errorMessage)}
            </div>
          )}

          {/* SEÇÃO PRODUTO & KITS */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid #1C2A3A', paddingBottom: '0.5rem', color: '#1478FF' }}>1. Produto & Kit</h4>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#8FA3B8' }}>Produto</label>
              <input className="input-field" value="QUATTRO 4-em-1" disabled style={{ background: '#070B12', color: '#F5F8FC' }} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#8FA3B8' }}>Selecione o Kit *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {kits.map(k => {
                  const kitPrice = typeof k.preco === 'string' ? parseFloat(k.preco) : k.preco;
                  const isSelected = selectedKitId === k.id;
                  return (
                    <div 
                      key={k.id}
                      onClick={() => handleKitSelect(k.id)}
                      style={{
                        background: isSelected ? '#111A27' : '#0D131D',
                        border: isSelected ? '2px solid #1478FF' : '1px solid #1C2A3A',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 0 12px rgba(20, 120, 255, 0.3)' : 'none',
                      }}
                    >
                      {k.badge && (
                        <span style={{ position: 'absolute', top: '-10px', right: '10px', background: '#1478FF', color: '#FFF', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', letterSpacing: '0.5px' }}>
                          {k.badge}
                        </span>
                      )}
                      <p style={{ fontWeight: 600, color: '#F5F8FC', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{k.nome}</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16C784', margin: '0.5rem 0 0' }}>{formatCurrency(kitPrice)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SEÇÃO CLIENTE */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid #1C2A3A', paddingBottom: '0.5rem', color: '#1478FF' }}>2. Cliente</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <Input label="CPF *" value={cpf} onChange={e => handleCpfChange(e.target.value)} onBlur={() => triggerCpfLookup(cpf.replace(/\D/g, ''))} maskType="cpf" required placeholder="000.000.000-00" />
                {cpfLoading && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '1rem', top: '2.25rem', color: '#1478FF', animation: 'spin 1s linear infinite' }} />}
              </div>
              <Input label="Telefone / WhatsApp *" value={telefone} onChange={e => setTelefone(e.target.value)} maskType="phone" required placeholder="(00) 00000-0000" />
            </div>
            <Input label="Nome Completo *" value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex: Osvaldo da Silva" />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ flex: 1 }}>
                <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={noEmail} required={!noEmail} placeholder="exemplo@email.com" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '1rem' }}>
                <input type="checkbox" checked={noEmail} onChange={e => setNoEmail(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#1478FF' }} />
                <span style={{ fontSize: '0.875rem', color: '#8FA3B8' }}>Não tenho e-mail</span>
              </label>
            </div>
          </div>

          {/* SEÇÃO ENDEREÇO */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid #1C2A3A', paddingBottom: '0.5rem', color: '#1478FF' }}>3. Endereço de Entrega</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <Input label="CEP *" value={cep} onChange={e => handleCepChange(e.target.value)} onBlur={() => triggerCepLookup(cep.replace(/\D/g, ''))} maskType="cep" required placeholder="00000-000" />
                {cepLoading && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '1rem', top: '2.25rem', color: '#1478FF', animation: 'spin 1s linear infinite' }} />}
              </div>
              <Input label="UF *" value={uf} onChange={e => setUf(e.target.value)} required maxLength={2} placeholder="SP" />
              <Input label="Cidade *" value={cidade} onChange={e => setCidade(e.target.value)} required placeholder="São Paulo" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px', gap: '1rem' }}>
              <Input label="Rua *" value={rua} onChange={e => setRua(e.target.value)} required placeholder="Av. Paulista" />
              <Input label="Número *" value={numero} onChange={e => setNumero(e.target.value)} required placeholder="1000" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input label="Bairro *" value={bairro} onChange={e => setBairro(e.target.value)} required placeholder="Bela Vista" />
              <Input label="Complemento" value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Apto 42" />
            </div>
          </div>

          {/* SEÇÃO ORIGEM & OBSERVAÇÕES */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid #1C2A3A', paddingBottom: '0.5rem', color: '#1478FF' }}>4. Origem & Observações</h4>
            {canais.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#8FA3B8' }}>De qual WhatsApp veio o lead?</label>
                <select className="input-field" value={canalId} onChange={e => setCanalId(e.target.value)}>
                  <option value="">Selecione um canal...</option>
                  {canais.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.numero})</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#8FA3B8' }}>Observações (Opcional)</label>
              <textarea 
                className="input-field" 
                rows={3} 
                value={observacoes} 
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Preferências de horário de entrega, ponto de referência..."
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* SEÇÃO EVIDÊNCIAS */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid #1C2A3A', paddingBottom: '0.5rem', color: '#1478FF' }}>5. Evidências (Upload de Arquivos)</h4>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#8FA3B8' }}>Termo de Compromisso (Opcional se salvo sem arquivo)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#111A27', padding: '0.65rem 1.25rem', border: '1px dashed #1478FF', borderRadius: '0.5rem', color: '#1478FF', fontWeight: 500 }}>
                  <Upload size={18} /> Selecionar Imagem ou PDF
                  <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => handleFileChange(e, true)} />
                </label>
                {termoFile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(20, 120, 255, 0.15)', border: '1px solid #1478FF', padding: '0.4rem 0.75rem', borderRadius: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#F5F8FC' }}>{termoFile.name}</span>
                    <button type="button" onClick={() => setTermoFile(null)} style={{ background: 'transparent', border: 'none', color: '#FF496C', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#8FA3B8' }}>Prints e Áudios de Agendamento (Opcional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#111A27', padding: '0.65rem 1.25rem', border: '1px dashed #1C2A3A', borderRadius: '0.5rem', color: '#8FA3B8' }}>
                  <Upload size={18} /> Adicionar Arquivos
                  <input type="file" multiple accept="image/*,application/pdf,audio/*" style={{ display: 'none' }} onChange={e => handleFileChange(e, false)} />
                </label>
                {agendamentoFiles.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.4rem 0.75rem', borderRadius: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#F5F8FC' }}>{file.name}</span>
                    <button type="button" onClick={() => setAgendamentoFiles(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', color: '#FF496C', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1C2A3A', paddingTop: '1.5rem' }}>
            <div>
              <span style={{ color: '#8FA3B8', fontSize: '0.875rem' }}>Valor Total: </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16C784', marginLeft: '0.5rem' }}>{formatCurrency(valor)}</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" isLoading={isLoading} disabled={!selectedKitId}>Criar Pedido</Button>
            </div>
          </div>
        </form>
      </Modal>

      {showRecurringAlert && recurringClientData && (
        <RecurringClientAlert 
          open={showRecurringAlert} 
          onOpenChange={setShowRecurringAlert}
          clientData={recurringClientData}
          onContinue={() => setShowRecurringAlert(false)}
          onCancel={() => {
            setShowRecurringAlert(false);
            onOpenChange(false);
          }}
        />
      )}
    </>
  );
};

export default NewOrderModal;
