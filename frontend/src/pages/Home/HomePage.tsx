import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, CreditCard, DollarSign, Target, TrendingUp, Package } from 'lucide-react';
import { useAuth } from '../../stores/auth.store';
import { formatCurrency } from '../../utils/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './HomePage.css';

const MOCK_DATA = {
  stats: {
    agendamentosHoje: 24,
    pagamentosHoje: 18,
    gastoTrafego: 1200,
    cpa: 45.5,
    ticketMedio: 347,
    totalPedidos: 156
  },
  situations: {
    aCaminho: 12,
    aguardandoPagamento: 8,
    aguardandoRetirada: 5,
    inadimplentes: 3
  },
  chartData: [
    { date: '18/10', agendados: 10, recebidos: 8 },
    { date: '19/10', agendados: 15, recebidos: 12 },
    { date: '20/10', agendados: 12, recebidos: 10 },
    { date: '21/10', agendados: 20, recebidos: 15 },
    { date: '22/10', agendados: 18, recebidos: 16 },
    { date: '23/10', agendados: 25, recebidos: 20 },
    { date: '24/10', agendados: 22, recebidos: 19 },
  ],
  ranking: [
    { id: 1, name: 'Carlos Silva', vendas: 45, valor: 15615 },
    { id: 2, name: 'Ana Souza', vendas: 38, valor: 13186 },
    { id: 3, name: 'João Pedro', vendas: 32, valor: 11104 },
  ]
};

const MOTIVATIONAL_PHRASES = [
  "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "Faça hoje o que os outros não querem, faça amanhã o que os outros não podem.",
  "A persistência é o caminho do êxito."
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

  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="home-container">
      <header className="home-header">
        <div>
          <h1>{greeting}, {user?.name?.split(' ')[0] || 'Usuário'}!</h1>
          <p className="home-date">{today}</p>
        </div>
        <div className="home-phrase">
          <p>"{phrase}"</p>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Calendar size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Agendamentos hoje</span>
            <span className="stat-value">{MOCK_DATA.stats.agendamentosHoje}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><CreditCard size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Pagamentos hoje</span>
            <span className="stat-value">{MOCK_DATA.stats.pagamentosHoje}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Gasto Tráfego</span>
            <span className="stat-value">{formatCurrency(MOCK_DATA.stats.gastoTrafego)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon error"><Target size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">CPA</span>
            <span className="stat-value">{formatCurrency(MOCK_DATA.stats.cpa)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><DollarSign size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Ticket Médio</span>
            <span className="stat-value">{formatCurrency(MOCK_DATA.stats.ticketMedio)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Package size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Pedidos</span>
            <span className="stat-value">{MOCK_DATA.stats.totalPedidos}</span>
          </div>
        </div>
      </section>

      <div className="home-main-grid">
        <div className="chart-section">
          <h3>Desempenho (Últimos 7 dias)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={MOCK_DATA.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2A3A" />
                <XAxis dataKey="date" stroke="#8FA3B8" />
                <YAxis stroke="#8FA3B8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D131D', border: '1px solid #1C2A3A' }}
                  itemStyle={{ color: '#F5F8FC' }}
                />
                <Line type="monotone" dataKey="agendados" stroke="#1478FF" strokeWidth={2} name="Agendados" />
                <Line type="monotone" dataKey="recebidos" stroke="#16C784" strokeWidth={2} name="Recebidos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="situations-card">
            <h3>Atenção</h3>
            <ul className="situation-list">
              <li>
                <span className="sit-dot bg-blue"></span>
                <span className="sit-label">A caminho</span>
                <span className="sit-value">{MOCK_DATA.situations.aCaminho}</span>
              </li>
              <li>
                <span className="sit-dot bg-warning"></span>
                <span className="sit-label">Aguardando Pagamento</span>
                <span className="sit-value">{MOCK_DATA.situations.aguardandoPagamento}</span>
              </li>
              <li>
                <span className="sit-dot bg-purple"></span>
                <span className="sit-label">Aguardando Retirada</span>
                <span className="sit-value">{MOCK_DATA.situations.aguardandoRetirada}</span>
              </li>
              <li>
                <span className="sit-dot bg-error"></span>
                <span className="sit-label">Inadimplentes</span>
                <span className="sit-value">{MOCK_DATA.situations.inadimplentes}</span>
              </li>
            </ul>
          </div>

          <div className="ranking-card">
            <h3>Ranking de Vendedores</h3>
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th>Vendas</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_DATA.ranking.map((seller, idx) => (
                  <tr key={seller.id}>
                    <td>
                      <span className="rank-pos">{idx + 1}º</span>
                      {seller.name}
                    </td>
                    <td>{seller.vendas}</td>
                    <td>{formatCurrency(seller.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
