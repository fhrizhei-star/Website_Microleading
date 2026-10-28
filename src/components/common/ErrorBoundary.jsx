import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle size={28} />
            </div>
            <h2 className="font-display font-extrabold text-xl text-slate-900">
              Terjadi Kendala Memuat Halaman
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sistem mendeteksi kendala pada antarmuka. Anda dapat menyegarkan halaman atau kembali ke beranda.
            </p>
            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-slate-100 text-left font-mono text-[11px] text-rose-700 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-shimmer flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Segarkan Halaman</span>
              </button>
              <a
                href="/"
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 no-underline cursor-pointer"
              >
                <Home size={13} />
                <span>Beranda</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

