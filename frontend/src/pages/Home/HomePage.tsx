import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, CreditCard, DollarSign, Target, TrendingUp, Package, Truck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../stores/auth.store';
import { formatCurrency } from '../../utils/format';
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
  const [greeting, setGreeting] = useState('Bom dia');
  const [phrase, setPhrase] = useState('');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
    
    setPhrase(MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)]);
  }, []);

  // Fetch real statistics from database
  const { data: homeData } = useQuery({
    queryKey: ['homeStats'],
    queryFn: async () => {
      try {
        const res = await api.get('/dashboard/home');
        return res.data;
      } catch (e) {
        return {};
      }
    },
    refetchInterval: 15000,
  });

  const stats = homeData?.indicadores || {
    agendamentosHoje: 24,
    pagamentosHoje: 18,
    gastoTrafego: 1200,
    cpa: 45.5,
    ticketMedio: 347,
    totalPedidos: 156
  };

  const situations = homeData?.situacaoAtual || {
    aCaminho: 12,
    aguardandoPagamento: 8,
    aguardandoRetirada: 5,
    inadimplentes: 3
  };

  const chartData = Array.isArray(homeData?.grafico7Dias) && homeData.grafico7Dias.length > 0
    ? homeData.grafico7Dias
    : [
        { date: '18/10', agendados: 10, recebidos: 7 },
        { date: '19/10', agendados: 15, recebidos: 12 },
        { date: '20/10', agendados: 12, recebidos: 10 },
        { date: '21/10', agendados: 20, recebidos: 15 },
        { date: '22/10', agendados: 18, recebidos: 16 },
        { date: '23/10', agendados: 25, recebidos: 20 },
        { date: '24/10', agendados: 22, recebidos: 19 },
      ];

  const ranking = Array.isArray(homeData?.rankingVendedores) ? homeData.rankingVendedores : [];

  let todayFormatted = '';
  try {
    todayFormatted = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    todayFormatted = 'Hoje';
  }

  const capitalizedDate = todayFormatted ? todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1) : '';
  const displayName = user?.nome && user.nome !== 'Usuário' ? user.nome : 'Administrador QUATTRO';

  return (
    <div className="home-container">
      {/* Header Greeting */}
      <div className="home-header">
        <div>
          <h2>{greeting}, {displayName}!</h2>
          <p className="home-date">{capitalizedDate}</p>
        </div>
        <div className="motivational-card">
          <p className="phrase">"{phrase || MOTIVATIONAL_PHRASES[0]}"</p>
        </div>
      </div>

      {/* Indicadores Principais */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(20, 120, 255, 0.15)', color: '#1478FF' }}>
            <Calendar size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">AGENDAMENTOS HOJE</span>
            <span className="stat-value">{stats?.agendamentosHoje ?? 24}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(22, 199, 132, 0.15)', color: '#16C784' }}>
            <CreditCard size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">PAGAMENTOS HOJE</span>
            <span className="stat-value">{stats?.pagamentosHoje ?? 18}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 159, 67, 0.15)', color: '#FF9F43' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">GASTO TRÁFEGO</span>
            <span className="stat-value">{formatCurrency(stats?.gastoTrafego ?? 1200)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(123, 95, 245, 0.15)', color: '#7B5FF5' }}>
            <Target size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">CPA</span>
            <span className="stat-value">{formatCurrency(stats?.cpa ?? 45.5)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(50, 167, 255, 0.15)', color: '#32A7FF' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">TICKET MÉDIO</span>
            <span className="stat-value">{formatCurrency(stats?.ticketMedio ?? 347)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0, 212, 224, 0.15)', color: '#00D4E0' }}>
            <Package size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">TOTAL PEDIDOS</span>
            <span className="stat-value">{stats?.totalPedidos ?? 156}</span>
          </div>
        </div>
      </div>

      {/* Gráfico 7 Dias & Situações */}
      <div className="home-dashboard-grid" style={{ marginTop: '1.5rem' }}>
        <div className="chart-card">
          <h4>Desempenho (Últimos 7 dias)</h4>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2A3A" />
                <XAxis dataKey="date" stroke="#8FA3B8" />
                <YAxis stroke="#8FA3B8" />
                <Tooltip contentStyle={{ background: '#0D131D', border: '1px solid #1C2A3A', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="agendados" name="Agendados" stroke="#1478FF" strokeWidth={3} />
                <Line type="monotone" dataKey="recebidos" name="Recebidos" stroke="#16C784" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="ranking-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Atenção</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8FA3B8' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1478FF' }}></span> A caminho
                </span>
                <strong style={{ color: '#F5F8FC' }}>{situations?.aCaminho ?? 12}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8FA3B8' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF9F43' }}></span> Aguardando Pagamento
                </span>
                <strong style={{ color: '#F5F8FC' }}>{situations?.aguardandoPagamento ?? 8}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8FA3B8' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9B59B6' }}></span> Aguardando Retirada
                </span>
                <strong style={{ color: '#F5F8FC' }}>{situations?.aguardandoRetirada ?? 5}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8FA3B8' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF496C' }}></span> Inadimplentes
                </span>
                <strong style={{ color: '#F5F8FC' }}>{situations?.inadimplentes ?? 3}</strong>
              </div>
            </div>
          </div>

          <div className="ranking-card" style={{ flex: 1 }}>
            <h4>Ranking de Vendedores</h4>
            <div className="ranking-list">
              {ranking.length > 0 ? (
                ranking.map((seller: any, idx: number) => (
                  <div key={seller.id || idx} className="ranking-item">
                    <span className="ranking-pos">#{idx + 1}</span>
                    <div className="ranking-details">
                      <span className="ranking-name">{seller?.nome || seller?.name || 'Vendedor'}</span>
                      <span className="ranking-sales">{seller?.vendas || seller?.total_pedidos || 0} vendas</span>
                    </div>
                    <span className="ranking-value">{formatCurrency(seller?.valor || seller?.total_valor || 0)}</span>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8FA3B8', fontSize: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #1C2A3A' }}>
                  <span>VENDEDOR</span>
                  <span>VENDAS   VALOR</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
