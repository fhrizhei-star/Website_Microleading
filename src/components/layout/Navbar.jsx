import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Award, User, BookOpen, Newspaper, Images, Info,
  Home, ChevronRight, Sparkles, Shield, LogOut, Search
} from 'lucide-react';
import { playClick } from '../../utils/audio';
import { getCurrentUser, clearCurrentUser } from '../../store/dataStore';

const NAV_LINKS = [
  { to: '/', label: 'Beranda', icon: Home, exact: true },
  { to: '/presensi', label: 'Presensi & Sertifikat', icon: Award, highlight: true },
  { to: '/berita', label: 'Berita', icon: Newspaper },
  { to: '/galeri', label: 'Galeri', icon: Images },
  { to: '/tentang', label: 'Tentang Kami', icon: Info },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const user = getCurrentUser();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent background body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleNavClick = () => {
    playClick();
  };

  const handleLogout = () => {
    playClick();
    clearCurrentUser();
    window.location.href = '/';
  };

  return (
    <>
      {/* Top Header Navbar */}
      <motion.header
        className="sticky top-2 sm:top-3 z-50 w-full px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav
          className={`glass-nav rounded-2xl px-3.5 sm:px-5 py-2.5 flex items-center justify-between transition-all duration-300 w-full ${scrolled
              ? 'shadow-xl shadow-purple-900/10 border-purple-300/70 bg-white/95 backdrop-blur-xl'
              : 'border-purple-200/70 shadow-sm'
            }`}
        >
          {/* Brand Identity */}
          <NavLink
            to="/"
            className="flex items-center gap-2.5 sm:gap-3 group no-underline shrink-0"
            onClick={handleNavClick}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-white p-1 shadow-md border border-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <img src="/img/1.png" alt="Logo Lab Microleading" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-extrabold text-slate-900 font-display leading-tight">
                  LAB Microleading
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold tracking-wide">
                  FTK UINAM
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase leading-none hidden sm:block mt-0.5">
                Manajemen Pendidikan Islam
              </span>
            </div>
          </NavLink>

          {/* Desktop Horizontal Nav Links (large screen) */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1 rounded-full border border-purple-100/70 text-sm font-semibold text-slate-600">
            {NAV_LINKS.map(({ to, label, highlight, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `nav-pill-link px-3.5 py-1.5 text-xs xl:text-sm font-semibold no-underline transition-all flex items-center gap-1.5 ${isActive
                    ? 'bg-white text-purple-900 rounded-full shadow-sm border border-purple-100/80 font-bold'
                    : 'text-slate-600 hover:text-purple-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {highlight && <Award size={13} className="text-purple-600" />}
                    {label}
                    {highlight && isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Action Button for Tablets and Desktops */}
            <NavLink
              to="/presensi"
              onClick={handleNavClick}
              className="btn-shimmer hidden md:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-md shadow-purple-600/25 no-underline"
            >
              <Award size={13} />
              <span>Isi Presensi</span>
            </NavLink>

            {/* User / Admin Authentication State */}
            {user ? (
              <div className="flex items-center gap-1.5">
                {user.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    onClick={handleNavClick}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 no-underline transition-all"
                  >
                    <User size={13} />
                    <span className="hidden sm:inline">Admin</span>
                  </NavLink>
                )}
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 sm:py-2 rounded-full text-xs font-semibold text-slate-600 bg-white hover:bg-red-50 hover:text-red-600 border border-slate-200 transition-all"
                >
                  <LogOut size={12} />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                onClick={handleNavClick}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-bold text-slate-700 bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 shadow-xs no-underline transition-all"
              >
                <User size={13} />
                <span className="hidden sm:inline">Admin</span>
              </NavLink>
            )}

            {/* Mobile & Tablet Hamburger Toggle Button */}
            <button
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-purple-50 hover:text-purple-900 border border-purple-200/80 transition-colors flex items-center justify-center shrink-0"
              onClick={() => {
                playClick();
                setMobileOpen(!mobileOpen);
              }}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} className="text-purple-700" /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Backdrop Overlay for Mobile / Tablet Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 lg:hidden"
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Mobile & Tablet Full Slide-Down Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="lg:hidden mt-2.5 glass-panel rounded-3xl shadow-2xl p-5 border border-purple-200/90 text-sm font-semibold text-slate-700 z-50 relative max-h-[82vh] overflow-y-auto"
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Drawer Header Status */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-800">Portal Digital Lab Microleading</span>
                </div>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  UIN Alauddin
                </span>
              </div>

              {/* Navigation Links Grid/List */}
              <div className="space-y-1.5">
                {NAV_LINKS.map(({ to, label, icon: Icon, highlight, exact }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={exact}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-3 rounded-2xl no-underline transition-all ${isActive
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-600/25'
                        : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900 bg-white/60 border border-purple-100/60'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                            }`}
                        >
                          <Icon size={16} />
                        </div>
                        <span className="flex-1 font-semibold">{label}</span>
                        {highlight && !isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                            Utama
                          </span>
                        )}
                        <ChevronRight
                          size={15}
                          className={`shrink-0 transition-transform ${isActive ? 'text-white' : 'text-slate-400 opacity-60'
                            }`}
                        />
                      </>
                    )}
                  </NavLink>
                ))}
              </div>

              {/* Highlight Action Card */}
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-950 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 mb-1">
                    <Sparkles size={12} />
                    <span>Layanan Mandiri</span>
                  </div>
                  <p className="text-xs text-slate-200 mb-3 leading-relaxed">
                    Klaim dan cetak langsung E-Sertifikat resmi kegiatan praktikum & workshop Anda.
                  </p>
                  <div className="flex gap-2">
                    <NavLink
                      to="/presensi"
                      onClick={handleNavClick}
                      className="btn-shimmer flex-1 py-2 px-3 rounded-xl bg-white text-slate-900 text-xs font-bold text-center no-underline inline-flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Award size={13} className="text-purple-700" />
                      Presensi Sekarang
                    </NavLink>
                  </div>
                </div>
              </div>

              {/* Account Section / Admin */}
              <div className="pt-3 border-t border-purple-100 mt-4 flex items-center justify-between">
                {user ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-800 leading-none">{user.username}</p>
                        <p className="text-[10px] text-slate-500 leading-none mt-0.5 uppercase">{user.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <LogOut size={12} />
                      Keluar
                    </button>
                  </div>
                ) : (
                  <NavLink
                    to="/login"
                    onClick={handleNavClick}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 no-underline transition-colors"
                  >
                    <User size={13} />
                    <span>Masuk ke Dashboard Admin</span>
                  </NavLink>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Floating Bottom Navigation Bar for Mobile Handphones (<= 640px) */}
      <nav
        aria-label="Navigasi Bawah Seluler"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-1 pointer-events-none"
      >
        <div className="pointer-events-auto glass-nav rounded-2xl shadow-2xl border border-purple-200/90 px-2 py-1.5 flex items-center justify-around max-w-sm mx-auto backdrop-blur-2xl bg-white/92">
          <NavLink
            to="/"
            end
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all no-underline ${isActive ? 'text-purple-700 font-bold bg-purple-50' : 'text-slate-500 hover:text-purple-600'
              }`
            }
          >
            <Home size={18} />
            <span className="text-[10px] mt-0.5">Beranda</span>
          </NavLink>

          <NavLink
            to="/presensi"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all no-underline relative ${isActive ? 'text-purple-700 font-bold bg-purple-50' : 'text-slate-500 hover:text-purple-600'
              }`
            }
          >
            <Award size={18} className="text-purple-600" />
            <span className="text-[10px] mt-0.5">Presensi</span>
            <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" />
          </NavLink>

          <NavLink
            to="/berita"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all no-underline ${isActive ? 'text-purple-700 font-bold bg-purple-50' : 'text-slate-500 hover:text-purple-600'
              }`
            }
          >
            <Newspaper size={18} />
            <span className="text-[10px] mt-0.5">Berita</span>
          </NavLink>

          <button
            onClick={() => {
              playClick();
              setMobileOpen(!mobileOpen);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${mobileOpen ? 'text-purple-700 font-bold bg-purple-50' : 'text-slate-500 hover:text-purple-600'
              }`}
            aria-label="Buka menu lengkap"
          >
            {mobileOpen ? <X size={18} className="text-purple-700" /> : <Menu size={18} />}
            <span className="text-[10px] mt-0.5">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
