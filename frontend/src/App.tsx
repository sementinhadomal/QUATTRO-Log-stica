import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './stores/auth.store';
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/Login/LoginPage';
import HomePage from './pages/Home/HomePage';
import KanbanPage from './pages/Kanban/KanbanPage';
import FrustratedPage from './pages/Frustrated/FrustratedPage';
import ClientsPage from './pages/Clients/ClientsPage';
import TeamPage from './pages/Team/TeamPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import TrafficPage from './pages/Traffic/TrafficPage';
import PostbackPage from './pages/Tools/PostbackPage';
import IntegrationsPage from './pages/Tools/IntegrationsPage';
import ProductsPage from './pages/Tools/ProductsPage';
import ProfilePage from './pages/Profile/ProfilePage';
import OrderDetailPage from './pages/Orders/OrderDetailPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div style={{ 
        background: '#05070A', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#1478FF',
        fontFamily: 'sans-serif' 
      }}>
        Carregando...
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<HomePage />} />
        <Route path="kanban" element={<KanbanPage />} />
        <Route path="frustrados" element={<FrustratedPage />} />
        
        <Route path="clientes" element={<ClientsPage />} />
        
        <Route path="equipe" element={<TeamPage />} />
        <Route path="equipe/departamentos" element={<TeamPage />} />
        <Route path="equipe/colaboradores" element={<TeamPage />} />
        
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="trafego" element={<TrafficPage />} />
        
        <Route path="ferramentas/postback" element={<PostbackPage />} />
        <Route path="ferramentas/integracoes" element={<IntegrationsPage />} />
        <Route path="ferramentas/produtos" element={<ProductsPage />} />
        
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="pedidos/:id" element={<OrderDetailPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
