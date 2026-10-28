import { NavLink } from 'react-router-dom';
import { Award, MapPin, Phone, Mail, Globe } from 'lucide-react';

const FOOTER_LINKS = [
  { to: '/', label: 'Beranda' },
  { to: '/pendaftaran', label: 'Pendaftaran Workshop' },
  { to: '/presensi', label: 'Presensi & Sertifikat' },
  { to: '/berita', label: 'Berita Terkini' },
  { to: '/galeri', label: 'Galeri' },
  { to: '/tentang', label: 'Tentang Kami' },
];

function InstagramIcon({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function YoutubeIcon({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
      <polygon points="10 15 15 12 10 9 10 15"/>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-24 sm:pb-12 border-t border-purple-900/30 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-purple-900/25 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Identity */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
                <img src="/img/1.png" alt="Logo Lab Microleading" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <p className="text-lg font-bold text-white font-display leading-none">Laboratorium MPI</p>
                <p className="text-xs text-slate-400 leading-none mt-0.5">Manajemen Pendidikan Islam</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-5">
              Laboratorium Manajemen Pendidikan Islam Fakultas Tarbiyah dan Keguruan UIN Alauddin Makassar. 
              Pusat pengembangan kompetensi calon pendidik profesional berbasis teknologi digital.
            </p>
            <div className="flex gap-3">
              {[
                { icon: InstagramIcon, href: '#', label: 'Instagram' },
                { icon: FacebookIcon, href: '#', label: 'Facebook' },
                { icon: YoutubeIcon, href: '#', label: 'YouTube' },
                { icon: Globe, href: 'https://mpi.ftk.uin-alauddin.ac.id', label: 'Website' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 hover:bg-purple-900/60 hover:border-purple-700 text-slate-400 hover:text-purple-300 flex items-center justify-center transition-all"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Navigasi Cepat</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className="text-sm text-slate-400 hover:text-purple-300 transition-colors no-underline flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-purple-600 group-hover:w-2 transition-all" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Kontak</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-slate-400">
                <MapPin size={14} className="text-purple-400 mt-0.5 shrink-0" />
                <span>Kampus II UIN Alauddin Makassar, Jl. H. M. Yasin Limpo No.36, Romangpolong, Gowa, Sulsel 92119</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-400">
                <Mail size={14} className="text-purple-400 shrink-0" />
                <a href="mailto:lab.mpi@uin-alauddin.ac.id" className="hover:text-purple-300 transition-colors no-underline">lab.mpi@uin-alauddin.ac.id</a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-400">
                <Phone size={14} className="text-purple-400 shrink-0" />
                <span>(0411) 841 879</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © 2026 Laboratorium MPI FTK UIN Alauddin Makassar. Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-purple-400">
            <Award size={12} />
            <span>Portal Presensi & E-Sertifikat Digital</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
