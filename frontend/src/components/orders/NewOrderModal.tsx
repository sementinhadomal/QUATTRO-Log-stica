import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import RecurringClientAlert from './RecurringClientAlert';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { Upload, X, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface NewOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [cpfLoading, setCpfLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  // Form State
  const [produto, setProduto] = useState('');
  const [kit, setKit] = useState('');
  const [valor, setValor] = useState(0);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [noEmail, setNoEmail] = useState(false);

  const [cep, setCep] = useState('');
  const [uf, setUf] = useState('');
  const [cidade, setCidade] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [complemento, setComplemento] = useState('');

  const [origem, setOrigem] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  const [termoFile, setTermoFile] = useState<File | null>(null);
  const [agendamentoFiles, setAgendamentoFiles] = useState<File[]>([]);

  // Recurring Client Alert State
  const [showRecurringAlert, setShowRecurringAlert] = useState(false);
  const [recurringClientData, setRecurringClientData] = useState<any>(null);

  // Mocks
  const produtos = ['QUATTRO 4-em-1'];
  const kits = [
    { nome: '1 Pote', preco: 147 },
    { nome: '2 Potes', preco: 247 },
    { nome: '3 Potes', preco: 347 },
  ];
  const origens = ['WhatsApp 1', 'WhatsApp 2', 'Instagram', 'Indicação'];

  const handleKitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setKit(selected);
    const found = kits.find(k => k.nome === selected);
    if (found) setValor(found.preco);
  };

  const handleCpfBlur = async () => {
    if (cpf.replace(/\D/g, '').length === 11) {
      setCpfLoading(true);
      try {
        const response = await api.post('/integracoes/cpf', { cpf: cpf.replace(/\D/g, '') });
        if (response.data.nome) setNome(response.data.nome);
        
        // Mocking check if client exists in DB
        if (response.data.existsInDb) {
          setRecurringClientData(response.data.clientData);
          setShowRecurringAlert(true);
        }
      } catch (err) {
        console.error('Erro ao buscar CPF', err);
      } finally {
        setCpfLoading(false);
      }
    }
  };

  const handleCepBlur = async () => {
    if (cep.replace(/\D/g, '').length === 8) {
      setCepLoading(true);
      try {
        const response = await api.get(`/integracoes/cep?cep=${cep.replace(/\D/g, '')}`);
        if (response.data) {
          setUf(response.data.uf || '');
          setCidade(response.data.localidade || '');
          setBairro(response.data.bairro || '');
          setRua(response.data.logradouro || '');
        }
      } catch (err) {
        console.error('Erro ao buscar CEP', err);
      } finally {
        setCepLoading(false);
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Mocking submission
      const payload = {
        produto, kit, valor,
        cliente: { nome, telefone, cpf, email: noEmail ? null : email },
        endereco: { cep, uf, cidade, rua, numero, bairro, complemento },
        origem, observacoes
      };
      
      const { data } = await api.post('/pedidos', payload);
      
      // Uploading files - mocked
      if (termoFile || agendamentoFiles.length > 0) {
        const formData = new FormData();
        if (termoFile) formData.append('termo', termoFile);
        agendamentoFiles.forEach((file, index) => formData.append(`agendamento_${index}`, file));
        await api.post(`/pedidos/${data.id}/files`, formData);
      }

      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onOpenChange(false);
      
    } catch (err) {
      console.error('Erro ao criar pedido', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange} title="Novo Pedido" maxWidth="800px">
        <form onSubmit={handleSubmit}>
          
          {/* SEÇÃO PRODUTO */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid #1C2A3A', paddingBottom: '0.5rem' }}>1. Produto</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#8FA3B8' }}>Produto</label>
                <select className="input-field" value={produto} onChange={e => setProduto(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {produtos.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#8FA3B8' }}>Kit</label>
                <select className="input-field" value={kit} onChange={handleKitChange} required>
                  <option value="">Selecione...</option>
                  {kits.map(k => <option key={k.nome} value={k.nome}>{k.nome}</option>)}
                </select>
              </div>
            </div>
            {valor > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#8FA3B8' }}>Valor do Kit:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#16C784' }}>{formatCurrency(valor)}</span>
              </div>
            )}
          </div>

          {/* SEÇÃO CLIENTE */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid #1C2A3A', paddingBottom: '0.5rem' }}>2. Cliente</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <Input label="CPF" value={cpf} onChange={e => setCpf(e.target.value)} onBlur={handleCpfBlur} maskType="cpf" required placeholder="000.000.000-00" />
                {cpfLoading && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '1rem', top: '2.25rem', color: '#1478FF', animation: 'spin 1s linear infinite' }} />}
              </div>
              <Input label="Telefone / WhatsApp" value={telefone} onChange={e => setTelefone(e.target.value)} maskType="phone" required placeholder="(00) 00000-0000" />
            </div>
            <Input label="Nome Completo" value={nome} onChange={e => setNome(e.target.value)} required />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ flex: 1 }}>
                <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={noEmail} required={!noEmail} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                <input type="checkbox" checked={noEmail} onChange={e => setNoEmail(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <span style={{ fontSize: '0.875rem' }}>Não tenho e-mail</span>
              </label>
            </div>
          </div>

          {/* SEÇÃO ENDEREÇO */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid #1C2A3A', paddingBottom: '0.5rem' }}>3. Endereço</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <Input label="CEP" value={cep} onChange={e => setCep(e.target.value)} onBlur={handleCepBlur} maskType="cep" required placeholder="00000-000" />
                {cepLoading && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '1rem', top: '2.25rem', color: '#1478FF', animation: 'spin 1s linear infinite' }} />}
              </div>
              <Input label="UF" value={uf} onChange={e => setUf(e.target.value)} required maxLength={2} />
              <Input label="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px', gap: '1rem' }}>
              <Input label="Rua" value={rua} onChange={e => setRua(e.target.value)} required />
              <Input label="Número" value={numero} onChange={e => setNumero(e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input label="Bairro" value={bairro} onChange={e => setBairro(e.target.value)} required />
              <Input label="Complemento" value={complemento} onChange={e => setComplemento(e.target.value)} />
            </div>
          </div>

          {/* SEÇÃO ORIGEM & OBSERVAÇÕES */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid #1C2A3A', paddingBottom: '0.5rem' }}>4. Outros</h4>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#8FA3B8' }}>De qual WhatsApp veio o lead?</label>
              <select className="input-field" value={origem} onChange={e => setOrigem(e.target.value)} required>
                <option value="">Selecione...</option>
                {origens.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#8FA3B8' }}>Observações (Opcional)</label>
              <textarea 
                className="input-field" 
                rows={3} 
                value={observacoes} 
                onChange={e => setObservacoes(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* SEÇÃO ARQUIVOS */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid #1C2A3A', paddingBottom: '0.5rem' }}>5. Evidências</h4>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#8FA3B8' }}>Termo de Compromisso (Obrigatório)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#111A27', padding: '0.5rem 1rem', border: '1px dashed #1C2A3A', borderRadius: '0.5rem', color: '#1478FF' }}>
                  <Upload size={18} /> Selecionar Arquivo
                  <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => handleFileChange(e, true)} />
                </label>
                {termoFile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(20, 120, 255, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#F5F8FC' }}>{termoFile.name}</span>
                    <button type="button" onClick={() => setTermoFile(null)} style={{ background: 'transparent', border: 'none', color: '#FF496C', cursor: 'pointer', display: 'flex' }}><X size={14} /></button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#8FA3B8' }}>Prints e Áudios (Opcional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#111A27', padding: '0.5rem 1rem', border: '1px dashed #1C2A3A', borderRadius: '0.5rem', color: '#1478FF' }}>
                  <Upload size={18} /> Adicionar Arquivos
                  <input type="file" multiple accept="image/*,application/pdf,audio/*" style={{ display: 'none' }} onChange={e => handleFileChange(e, false)} />
                </label>
                {agendamentoFiles.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#F5F8FC' }}>{file.name}</span>
                    <button type="button" onClick={() => setAgendamentoFiles(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', color: '#FF496C', cursor: 'pointer', display: 'flex' }}><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #1C2A3A', paddingTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" isLoading={isLoading} disabled={!termoFile || valor === 0}>Criar Pedido</Button>
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
            onOpenChange(false); // Close main modal as well
          }}
        />
      )}
    </>
  );
};

export default NewOrderModal;
