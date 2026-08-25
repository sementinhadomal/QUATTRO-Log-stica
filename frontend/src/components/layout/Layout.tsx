import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = () => {
  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content">
        <div className="main-scroll-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
