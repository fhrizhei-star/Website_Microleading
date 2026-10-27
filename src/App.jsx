import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  AmbientBackground,
  ScrollProgressBar
} from './components/ambient/AmbientEffects';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import PresensiPage from './pages/PresensiPage';
import BeritaPage from './pages/BeritaPage';
import GaleriPage from './pages/GaleriPage';
import TentangPage from './pages/TentangPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import { initializeStore } from './store/dataStore';
import CoolAlertContainer from './components/common/CoolAlert';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function MainLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-purple-200 selection:text-purple-900">
      {/* Scroll Progress Bar */}
      <ScrollProgressBar />

      {/* Ambient background glowing orbs */}
      <AmbientBackground />

      {/* Top Navigation Bar - Hidden in Admin workspace */}
      {!isAdminRoute && <Navbar />}

      {/* Main Content Area with AnimatePresence for Page Color Transitions */}
      <main className="flex-1 z-10 relative">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/presensi" element={<PresensiPage />} />
            <Route path="/berita" element={<BeritaPage />} />
            <Route path="/galeri" element={<GaleriPage />} />
            <Route path="/tentang" element={<TentangPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            {/* Redirect /layanan to /tentang */}
            <Route path="/layanan" element={<Navigate to="/tentang" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Footer - Hidden in Admin workspace */}
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    initializeStore();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <MainLayout />
      <CoolAlertContainer />
    </BrowserRouter>
  );
}
