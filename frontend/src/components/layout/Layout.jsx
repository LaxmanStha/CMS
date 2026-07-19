import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  const handleMenuClick = () => setMobileSidebarOpen(true);
  const handleCloseMobile = () => setMobileSidebarOpen(false);

  const expanded = !sidebarCollapsed || sidebarHovered;

  return (
      <div className="min-h-screen bg-background dark:bg-[#0B1220] font-sans antialiased">
      <Sidebar
        collapsed={!expanded}
        onHover={setSidebarHovered}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={handleCloseMobile}
      />
      
      <Navbar
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={handleMenuClick}
      />
      
      <main 
        className="pt-18 transition-all duration-300 min-h-screen"
        style={{ marginLeft: expanded ? '280px' : '72px' }}
      >
        <div className="p-4 sm:p-6 lg:p-8 animate-page-transition">
          <Outlet />
        </div>
        <Footer />
      </main>

      <style>{`
        @media (max-width: 1023px) {
          main {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;