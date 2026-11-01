import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition with sleek non-blocking Laser Line & Safe Content Reveal.
 * 
 * NOTE (Blank Screen Fix):
 * Sebelumnya terdapat curtain full-screen z-[9999] dengan `scaleY: 1` dan children `opacity: 0`.
 * Pada HP dengan RAM terbatas, mode hemat baterai (Battery Saver), atau fitur "Hapus Animasi"
 * (Reduce Motion) aktif di Android, animasi GPU sering kali terhenti/diabaikan,
 * sehingga curtain gelap tersebut macet menutupi seluruh layar (layar blank hitam).
 * 
 * Solusi:
 * 1. Curtain gelap full-screen dihilangkan sepenuhnya.
 * 2. Menggunakan Top Glowing Laser Shimmer bar tipis (h-1) yang non-blocking dan elegan.
 * 3. Halaman utama selalu terlihat secara default (failsafe) dengan transisi fade yang halus.
 */
export default function PageTransition({ children }) {
  const location = useLocation();

  return (
    <div className="relative w-full">
      {/* 1. Top Glowing Shimmer Laser Line (Non-blocking, slim indicator) */}
      <motion.div
        key={`laser-${location.pathname}`}
        className="fixed inset-x-0 top-0 h-1 z-50 pointer-events-none bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 shadow-[0_0_12px_rgba(168,85,247,0.7)]"
        initial={{ scaleX: 1, opacity: 0.9 }}
        animate={{ scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ transformOrigin: 'right' }}
      />

      {/* 2. Main Page Content with safe reveal (never hides completely if animation stalls) */}
      <motion.div
        key={`page-${location.pathname}`}
        initial={{ opacity: 0.7, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Section fade-in wrapper for individual sections
 */
export function SectionReveal({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0.5, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px' }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container — animates children with sequential delays
 */
export function StaggerContainer({ children, className = '', staggerDelay = 0.08 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger item — use inside StaggerContainer
 */
export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0.6, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Purple fade-in for important elements
 */
export function PurpleFadeIn({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0.6, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px' }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
