import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, LogIn, Eye, EyeOff, AlertCircle, Zap } from 'lucide-react';
import { loginUser, setCurrentUser } from '../store/dataStore';
import { playClick, playSuccess, playError } from '../utils/audio';
import PageTransition from '../components/transitions/PageTransition';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await loginUser(form.username, form.password);
      setCurrentUser(user);
      playSuccess();
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      playError();
      setError(err.message || 'Login gagal. Periksa username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-violet-50 to-brand-100 pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="glass-panel rounded-3xl p-5 sm:p-8 border border-purple-200 shadow-2xl shadow-purple-500/10">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-white border border-purple-200 shadow-lg flex items-center justify-center mb-3 sm:mb-4">
              <img src="/img/1.png" alt="Logo Lab Microleading" className="w-10 h-10 sm:w-11 sm:h-11 object-contain" />
            </div>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 mb-1">Portal Administrator</h1>
            <p className="text-xs sm:text-sm text-slate-500">Laboratorium MPI — FTK UIN Alauddin Makassar</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-5"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={form.username}
                  onChange={e => set('username', e.target.value)}
                  placeholder="Masukkan username"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-purple-200 bg-white text-sm text-slate-800 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-purple-200 bg-white text-sm text-slate-800 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => { playClick(); setShowPw(!showPw); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-shimmer w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={15} />
              )}
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
            </button>
          </form>
        </div>
      </motion.div>
    </div>
    </PageTransition>
  );
}
