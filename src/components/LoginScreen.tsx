import React from "react";
import { ShieldCheck, FileSpreadsheet, Lock, Sparkles } from "lucide-react";

interface LoginScreenProps {
  onLogin: () => void;
  isLoggingIn: boolean;
  error: string | null;
}

export default function LoginScreen({ onLogin, isLoggingIn, error }: LoginScreenProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand/Logo Header */}
        <div className="flex justify-center items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="text-2xl font-extrabold font-display text-white tracking-tight">
            MITRA<span className="text-indigo-400">BANGSA</span>
          </span>
        </div>
        
        <h2 className="text-center text-3xl font-extrabold font-display text-white tracking-tight">
          Portal Administrasi Kredit
        </h2>
        <p className="mt-2 text-center text-sm text-slate-300">
          Sistem Pengelolaan Permohonan Pinjaman Nasabah Terintegrasi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white/10 backdrop-blur-xl py-10 px-6 shadow-2xl rounded-2xl border border-white/15 sm:px-10 text-white">
          
          <div className="space-y-6">
            {/* Explanatory Cards */}
            <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-indigo-200 text-sm flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <span>Database Terpusat Google Sheets</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aplikasi ini dirancang untuk membaca, menulis, dan mengelola data permohonan pinjaman secara real-time langsung dari lembar kerja Google Sheets di akun Google Anda. Tidak ada database pihak ketiga eksternal; data Anda tetap 100% aman dalam kendali organisasi Anda.
              </p>
            </div>

            <div className="space-y-3 text-sm text-slate-200">
              <div className="flex items-start space-x-2.5">
                <div className="mt-0.5 w-5 h-5 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">1</div>
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Akses Aman:</strong> Masuk menggunakan akun Google kerja/pribadi Anda untuk mengotorisasi akses database.
                </p>
              </div>
              <div className="flex items-start space-x-2.5">
                <div className="mt-0.5 w-5 h-5 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">2</div>
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Manajemen Otomatis:</strong> Aplikasi akan membantu Anda membuat spreadsheet baru atau memilih spreadsheet yang sudah ada di Google Drive Anda.
                </p>
              </div>
              <div className="flex items-start space-x-2.5">
                <div className="mt-0.5 w-5 h-5 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">3</div>
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Evaluasi Akurat:</strong> Lakukan peninjauan, analisis rasio utang (DSR), dan perbarui status permohonan kredit nasabah secara instan.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-200 rounded-lg text-xs leading-relaxed">
                <strong>Gagal masuk:</strong> {error}
              </div>
            )}

            {/* Google GSI-compliant Sign-in Button */}
            <div className="pt-4 flex flex-col items-center">
              <button
                id="google-signin-btn"
                onClick={onLogin}
                disabled={isLoggingIn}
                className={`relative w-full flex items-center justify-center py-3 px-4 border border-white/20 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer ${
                  isLoggingIn ? "opacity-65 cursor-not-allowed" : ""
                }`}
              >
                {isLoggingIn ? (
                  <div className="flex items-center space-x-3">
                    <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-slate-700">Menghubungkan ke Google...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" viewBox="0 0 48 48" style={{ display: "block" }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>Masuk dengan Google</span>
                  </div>
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 border-t border-white/10 pt-5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Koneksi aman langsung via Google OAuth 2.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
