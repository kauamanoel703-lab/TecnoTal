import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import MobileMenu from '../components/layout/MobileMenu';

export function IntranetLayout() {
  const [menuAberto, setMenuAberto] = useState(false);
  return (
    <div className="intranet">
      <Sidebar />
      {menuAberto && <MobileMenu onClose={() => setMenuAberto(false)} />}
      <div className="main-area">
        <Header onMenu={() => setMenuAberto((v) => !v)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
