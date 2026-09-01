import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';

const Layout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0B0F19] font-sans antialiased" data-role={user?.role}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        <main className="relative flex-1">
          {/* Premium ambient backdrop */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            {/* Gradient orbs */}
            <div className="absolute -right-32 -top-40 h-[40rem] w-[40rem] rounded-full bg-amber-500/[0.03] blur-[100px] ambient-blob" />
            <div className="absolute -bottom-40 left-1/4 h-[30rem] w-[30rem] rounded-full bg-blue-500/[0.02] blur-[80px] ambient-blob" style={{ animationDelay: '-6s' }} />
            <div className="absolute top-1/2 -left-20 h-[20rem] w-[20rem] rounded-full bg-amber-600/[0.02] blur-[60px] ambient-blob" style={{ animationDelay: '-12s' }} />
            
            {/* Subtle grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.015]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '60px 60px'
              }}
            />
            
            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
            }} />
          </div>

          <div
            key={location.pathname}
            className="page-enter mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8"
          >
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Layout;
