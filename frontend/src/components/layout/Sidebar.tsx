import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../stores/auth.store';
import { 
  Home, LayoutDashboard, XCircle, Users, Users2, 
  Building2, UserCheck, BarChart3, TrendingUp, 
  Webhook, Link2, Package, LogOut 
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const navGroups = [
    {
      title: 'OPERAÇÃO',
      items: [
        { label: 'Início', icon: Home, to: '/' },
        { label: 'Kanban', icon: LayoutDashboard, to: '/kanban' },
        { label: 'Frustrados', icon: XCircle, to: '/frustrados' },
      ]
    },
    {
      title: 'RELACIONAMENTO',
      items: [
        { label: 'Clientes', icon: Users, to: '/clientes' },
      ]
    },
    {
      title: 'EQUIPE',
      items: [
        { label: 'Equipe', icon: Users2, to: '/equipe', exact: true },
        { label: 'Departamentos', icon: Building2, to: '/equipe/departamentos' },
        { label: 'Colaboradores', icon: UserCheck, to: '/equipe/colaboradores' },
      ]
    },
    {
      title: 'ANÁLISE',
      items: [
        { label: 'Dashboard', icon: BarChart3, to: '/dashboard' },
        { label: 'Tráfego', icon: TrendingUp, to: '/trafego' },
      ]
    },
    {
      title: 'CONFIGURAÇÕES',
      items: [
        { label: 'Postback', icon: Webhook, to: '/ferramentas/postback' },
        { label: 'Integrações', icon: Link2, to: '/ferramentas/integracoes' },
        { label: 'Produtos e Kits', icon: Package, to: '/ferramentas/produtos' },
      ]
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/assets/logo-quattro.png" alt="QUATTRO" />
      </div>
      
      <nav className="sidebar-nav">
        {navGroups.map((group, idx) => (
          <div key={idx} className="nav-group">
            <h4 className="nav-title">{group.title}</h4>
            {group.items.map(item => (
              <NavLink 
                key={item.to} 
                to={item.to} 
                end={item.exact}
                className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <NavLink to="/perfil" className="user-info">
          <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div className="user-details">
            <span className="user-name">{user?.name || 'Usuário'}</span>
            <span className="user-role">{user?.role || 'Membro'}</span>
          </div>
        </NavLink>
        <button className="logout-btn" onClick={logout} title="Sair">
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
