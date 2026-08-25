import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, CreditCard, DollarSign, Target, TrendingUp, Package, Truck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../stores/auth.store';
import { formatCurrency } from '../../utils/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../../services/api';
import './HomePage.css';

const MOTIVATIONAL_PHRASES = [
  "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "Faça hoje o que os outros não querem, faça amanhã o que os outros não podem.",
  "A persistência é o caminho do êxito.",
  "Logística eficiente é a alma do negócio Afterpay.",
];

const HomePage = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [phrase, setPhrase] = useState('');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
    
    setPhrase(MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)]);
  }, []);

  // Fetch real statistics from database
  const { data: homeData, isLoading } = useQuery({
    queryKey: ['homeStats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/home');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const stats = homeData?.indicadores || {
    agendamentosHoje: 0,
    pagamentosHoje: 0,
    gastoTrafego: 0,
    cpa: 0,
    ticketMedio: 0,
    totalPedidos: 0
  };

  const situations = homeData?.situacaoAtual || {
    aCaminho: 0,
    aguardandoPagamento: 0,
    aguardandoRetirada: 0,
    inadimplentes: 0
  };

  const chartData = homeData?.grafico7Dias || [];
  const ranking = homeData?.rankingVendedores || [];

  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="home-container">
      {/* Header Greeting */}
      <div className="home-header">
        <div>
          <h2>{greeting}, {user?.nome || 'Usuário'}!</h2>
          <p className="home-date">{todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1)}</p>
        </div>
        <div className="motivational-card">
          <p className="phrase">"{phrase}"</p>
        </div>
      </div>

      {/* Indicadores Principais */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(20, 120, 255, 0.15)', color: '#1478FF' }}>
            <Calendar size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Agendamentos de Hoje</span>
            <span className="stat-value">{stats.agendamentosHoje}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(22, 199, 132, 0.15)', color: '#16C784' }}>
            <CreditCard size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pagamentos de Hoje</span>
            <span className="stat-value">{formatCurrency(stats.pagamentosHoje)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 159, 67, 0.15)', color: '#FF9F43' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Gasto em Tráfego</span>
            <span className="stat-value">{formatCurrency(stats.gastoTrafego)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(123, 95, 245, 0.15)', color: '#7B5FF5' }}>
            <Target size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">CPA Médio</span>
            <span className="stat-value">{formatCurrency(stats.cpa)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(50, 167, 255, 0.15)', color: '#32A7FF' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Ticket Médio</span>
            <span className="stat-value">{formatCurrency(stats.ticketMedio)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0, 212, 224, 0.15)', color: '#00D4E0' }}>
            <Package size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total de Pedidos</span>
            <span className="stat-value">{stats.totalPedidos}</span>
          </div>
        </div>
      </div>

      {/* Situação Atual */}
      <h3 className="section-title">Situação Atual dos Pedidos</h3>
      <div className="situations-grid">
        <div className="situation-card">
          <Truck size={20} color="#7B5FF5" />
          <span>A Caminho: <strong>{situations.aCaminho}</strong></span>
        </div>
        <div className="situation-card">
          <CreditCard size={20} color="#1A6B7A" />
          <span>Aguardando Pagamento: <strong>{situations.aguardandoPagamento}</strong></span>
        </div>
        <div className="situation-card">
          <Package size={20} color="#9B59B6" />
          <span>Aguardando Retirada: <strong>{situations.aguardandoRetirada}</strong></span>
        </div>
        <div className="situation-card">
          <AlertTriangle size={20} color="#FF496C" />
          <span>Inadimplentes: <strong>{situations.inadimplentes}</strong></span>
        </div>
      </div>

      {/* Gráfico 7 Dias & Ranking */}
      <div className="home-dashboard-grid">
        <div className="chart-card">
          <h4>Desempenho dos Últimos 7 Dias</h4>
          <div style={{ width: '100%', height: 300 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C2A3A" />
                  <XAxis dataKey="date" stroke="#8FA3B8" />
                  <YAxis stroke="#8FA3B8" />
                  <Tooltip contentStyle={{ background: '#0D131D', border: '1px solid #1C2A3A', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="agendados" name="Agendados" stroke="#1478FF" strokeWidth={3} />
                  <Line type="monotone" dataKey="recebidos" name="Recebidos (R$)" stroke="#16C784" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8FA3B8', fontSize: '0.875rem' }}>
                Nenhum dado de movimentação nos últimos 7 dias.
              </div>
            )}
          </div>
        </div>

        <div className="ranking-card">
          <h4>Ranking dos Vendedores</h4>
          <div className="ranking-list">
            {ranking.length > 0 ? (
              ranking.map((seller: any, idx: number) => (
                <div key={seller.id || idx} className="ranking-item">
                  <span className="ranking-pos">#{idx + 1}</span>
                  <div className="ranking-details">
                    <span className="ranking-name">{seller.nome || seller.name}</span>
                    <span className="ranking-sales">{seller.vendas || seller.total_pedidos || 0} vendas</span>
                  </div>
                  <span className="ranking-value">{formatCurrency(seller.valor || seller.total_valor || 0)}</span>
                </div>
              ))
            ) : (
              <p style={{ color: '#8FA3B8', fontSize: '0.875rem', padding: '1.5rem 0', textAlign: 'center' }}>
                Nenhum vendedor com vendas registradas ainda.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
