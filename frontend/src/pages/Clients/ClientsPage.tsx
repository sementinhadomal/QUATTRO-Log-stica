import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatCurrency, formatDate, formatPhone, maskCPF } from '../../utils/format';
import { Search, Users, UserCheck, CreditCard, Clock } from 'lucide-react';

interface ClientItem {
  id: string;
  cpf: string;
  nome: string;
  telefone: string;
  email: string | null;
  cidade: string | null;
  uf: string | null;
  total_pedidos: number;
  total_pago: number | string;
  total_em_aberto: number | string;
  ultima_compra: string | null;
}

const ClientsPage = () => {
  const [search, setSearch] = useState('');

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      const res = await api.get(`/clientes?q=${search}`);
      return (res.data.clientes || res.data || []) as ClientItem[];
    },
  });

  const totalClients = clients.length;
  const totalPagoSum = clients.reduce((acc, c) => acc + (typeof c.total_pago === 'string' ? parseFloat(c.total_pago) : c.total_pago || 0), 0);
  const totalAbertoSum = clients.reduce((acc, c) => acc + (typeof c.total_em_aberto === 'string' ? parseFloat(c.total_em_aberto) : c.total_em_aberto || 0), 0);

  return (
    <div style={{ padding: '2rem', color: '#F5F8FC' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Clientes</h2>
          <p style={{ color: '#8FA3B8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Base de clientes unificada por CPF — QUATTRO Logística
          </p>
        </div>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#8FA3B8' }} />
          <input 
            type="text" 
            placeholder="Buscar por nome, CPF ou fone..." 
            className="input-field" 
            style={{ paddingLeft: '2.5rem' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Indicadores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#0D131D', border: '1px solid #1C2A3A', borderRadius: '0.75rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1478FF', marginBottom: '0.5rem' }}>
            <Users size={20} />
            <span style={{ fontSize: '0.85rem', color: '#8FA3B8' }}>Total de Clientes</span>
          </div>
          <span style={{ fontSize: '1.75rem', fontWeight: 700 }}>{totalClients}</span>
        </div>
        <div style={{ background: '#0D131D', border: '1px solid #1C2A3A', borderRadius: '0.75rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#16C784', marginBottom: '0.5rem' }}>
            <CreditCard size={20} />
            <span style={{ fontSize: '0.85rem', color: '#8FA3B8' }}>Total Pago</span>
          </div>
          <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16C784' }}>{formatCurrency(totalPagoSum)}</span>
        </div>
        <div style={{ background: '#0D131D', border: '1px solid #1C2A3A', borderRadius: '0.75rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#FF9F43', marginBottom: '0.5rem' }}>
            <Clock size={20} />
            <span style={{ fontSize: '0.85rem', color: '#8FA3B8' }}>Em Aberto</span>
          </div>
          <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FF9F43' }}>{formatCurrency(totalAbertoSum)}</span>
        </div>
      </div>

      <div style={{ background: '#0D131D', border: '1px solid #1C2A3A', borderRadius: '0.75rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#070B12', borderBottom: '1px solid #1C2A3A', color: '#8FA3B8', fontSize: '0.85rem' }}>
              <th style={{ padding: '1rem 1.25rem' }}>Cliente</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>Cidade / UF</th>
              <th>Pedidos</th>
              <th>Total Pago</th>
              <th>Em Aberto</th>
              <th>Última Compra</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ padding: '3rem 0', textAlign: 'center', color: '#8FA3B8' }}>Carregando clientes...</td></tr>
            ) : clients.length > 0 ? (
              clients.map(c => {
                const pago = typeof c.total_pago === 'string' ? parseFloat(c.total_pago) : c.total_pago;
                const aberto = typeof c.total_em_aberto === 'string' ? parseFloat(c.total_em_aberto) : c.total_em_aberto;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #1C2A3A', transition: 'background 0.15s' }}>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>{c.nome}</td>
                    <td style={{ color: '#8FA3B8' }}>{maskCPF(c.cpf || '')}</td>
                    <td style={{ color: '#8FA3B8' }}>{formatPhone(c.telefone || '')}</td>
                    <td style={{ color: '#8FA3B8' }}>{c.cidade ? `${c.cidade}/${c.uf || ''}` : '—'}</td>
                    <td>
                      <span style={{ background: '#111A27', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600, color: '#1478FF' }}>
                        {c.total_pedidos || 1}x
                      </span>
                    </td>
                    <td style={{ color: '#16C784', fontWeight: 600 }}>{formatCurrency(pago || 0)}</td>
                    <td style={{ color: '#FF9F43', fontWeight: 600 }}>{formatCurrency(aberto || 0)}</td>
                    <td style={{ color: '#8FA3B8', fontSize: '0.85rem' }}>{formatDate(c.ultima_compra || '')}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} style={{ padding: '4rem 0', textAlign: 'center', color: '#8FA3B8' }}>
                  <UserCheck size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p>Nenhum cliente cadastrado ainda.</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Os clientes serão cadastrados automaticamente ao criar novos pedidos.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientsPage;
