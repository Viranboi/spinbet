import React from 'react';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './index.scss';
import './styles/mobile.scss';
import './styles/spinbet-theme.scss';
import { AuthProvider } from './auth/AuthContext';
import HomePage from './pages/HomePage';
import CasinoPage from './pages/CasinoPage';
import AviatorPage from './pages/AviatorPage';
import PromotionsPage from './pages/PromotionsPage';
import DepositPage from './pages/DepositPage';
import CrashGamesPage from './pages/CrashGamesPage';
import MinesPage from './pages/MinesPage';
import SecretMinesPage from './pages/SecretMinesPage';
import PartnerPage from './pages/PartnerPage';
import AdminPage from './pages/AdminPage';
import OddsPage from './pages/OddsPage';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { initAudio } from './sounds';

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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/casino" element={<Layout><CasinoPage /></Layout>} />
        <Route path="/aviator" element={<AviatorPage />} />
        <Route path="/secret-odds" element={<OddsPage />} />
        <Route path="/promotions" element={<Layout><PromotionsPage /></Layout>} />
        <Route path="/deposit" element={<Layout><DepositPage /></Layout>} />
        <Route path="/p2p" element={<Layout><DepositPage /></Layout>} />
        <Route path="/crash-games" element={<CrashGamesPage />} />
        <Route path="/mines" element={<MinesPage />} />
        <Route path="/secret-mines" element={<SecretMinesPage />} />
        <Route path="/partner" element={<PartnerPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Layout><HomePage /></Layout>} />
      </Routes>
      <ToastContainer position="top-center" theme="dark" />
    </AuthProvider>
  </BrowserRouter>
);
