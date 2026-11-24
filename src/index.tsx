import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './index.scss';
import './styles/design-system.scss';
import './styles/mobile.scss';
import './styles/spinbet-theme.scss';
import './styles/responsive-fix.scss';
import { AuthProvider } from './auth/AuthContext';
import { CurrencyProvider } from './currency';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import SupportChat from './components/SupportChat';
import { initAudio } from './sounds';

const HomePage = React.lazy(() => import('./pages/HomePage'));
const CasinoPage = React.lazy(() => import('./pages/CasinoPage'));
const AviatorPage = React.lazy(() => import('./pages/AviatorPage'));
const PromotionsPage = React.lazy(() => import('./pages/PromotionsPage'));
const DepositPage = React.lazy(() => import('./pages/DepositPage'));
const WithdrawPage = React.lazy(() => import('./pages/WithdrawPage'));
const CrashGamesPage = React.lazy(() => import('./pages/CrashGamesPage'));
const SportsPage = React.lazy(() => import('./pages/SportsPage'));
const MinesPage = React.lazy(() => import('./pages/MinesPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SecretMinesPage = React.lazy(() => import('./pages/SecretMinesPage'));
const PartnerPage = React.lazy(() => import('./pages/PartnerPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const OddsPage = React.lazy(() => import('./pages/OddsPage'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));

initAudio();
console.info("[SpinBet] odds-sync v3 (server-authoritative)");

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-layout">
      <Navbar />
      <main className="site-main">
        {children}
      </main>
      <Footer />
    </div>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <AuthProvider>
      <CurrencyProvider>
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/casino" element={<Layout><CasinoPage /></Layout>} />
        <Route path="/aviator" element={<AviatorPage />} />
        <Route path="/secret-odds" element={<OddsPage />} />
        <Route path="/promotions" element={<Layout><PromotionsPage /></Layout>} />
        <Route path="/deposit" element={<Layout><DepositPage /></Layout>} />
        <Route path="/withdraw" element={<Layout><WithdrawPage /></Layout>} />
        <Route path="/p2p" element={<Layout><DepositPage /></Layout>} />
        <Route path="/crash-games" element={<CrashGamesPage />} />
        <Route path="/sports" element={<SportsPage />} />
        <Route path="/mines" element={<MinesPage />} />
        <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
        <Route path="/secret-mines" element={<SecretMinesPage />} />
        <Route path="/partner" element={<PartnerPage />} />
        <Route path="/notifications" element={<Layout><NotificationsPage /></Layout>} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Layout><HomePage /></Layout>} />
      </Routes>
      </Suspense>
      <ToastContainer position="top-center" theme="dark" />
      <SupportChat />
      </CurrencyProvider>
    </AuthProvider>
  </BrowserRouter>
);
