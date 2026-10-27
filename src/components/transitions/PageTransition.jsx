import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition with rich Purple Color Curtain & Smooth Fade.
 * Every time a user changes pages, a modern purple gradient curtain
 * sweeps across the screen to create a stunning color transition effect.
 */
export default function PageTransition({ children }) {
  const location = useLocation();

  return (
    <div className="relative w-full">
      {/* 1. Purple Color Transition Curtain */}
      <motion.div
        key={`curtain-${location.pathname}`}
        className="fixed inset-0 z-[9999] pointer-events-none bg-gradient-to-br from-purple-800 via-violet-900 to-indigo-950 shadow-2xl flex items-center justify-center"
        initial={{ scaleY: 1, transformOrigin: 'top' }}
        animate={{ scaleY: 0, transformOrigin: 'top' }}
        exit={{ scaleY: 1, transformOrigin: 'bottom' }}
        transition={{ duration: 0.42, ease: [0.76, 0, 0.24, 1] }}
      >
        {/* Subtle center crest indicator */}
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl"
        >
          <img src="/img/1.png" alt="" className="w-6 h-6 object-contain" />
          <span className="text-white font-display font-bold text-xs tracking-wide">
            Laboratorium MPI
          </span>
        </motion.div>
      </motion.div>

      {/* 2. Top Glowing Shimmer Laser Line */}
      <motion.div
        key={`laser-${location.pathname}`}
        className="fixed inset-x-0 top-0 h-1 z-[10000] pointer-events-none bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 shadow-[0_0_20px_rgba(192,132,252,0.9)]"
        initial={{ scaleX: 1, opacity: 1 }}
        animate={{ scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{ transformOrigin: 'right' }}
      />

      {/* 3. Main Page Content with smooth upward reveal */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
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
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
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
      viewport={{ once: true, margin: '-40px' }}
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
        hidden: { opacity: 0, y: 20, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
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
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
