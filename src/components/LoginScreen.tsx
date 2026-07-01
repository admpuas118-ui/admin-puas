import React, { useState } from "react";
import { ShieldCheck, Lock, LogIn } from "lucide-react";
import { signInWithGoogleSheets } from "../firebase";

interface LoginScreenProps {
  isLoggingIn: boolean;
  error: string | null;
  onGoogleLogin: () => void;
}

export default function LoginScreen({ isLoggingIn, error, onGoogleLogin }: LoginScreenProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand/Logo Header */}
        <div className="flex justify-center items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="text-2xl font-extrabold font-display text-white tracking-tight">
            PUAS <span className="text-indigo-400">KLATEN</span>
          </span>
        </div>
        
        <h2 className="text-center text-3xl font-extrabold font-display text-white tracking-tight">
          Portal Administrasi Kredit
        </h2>
        <p className="mt-2 text-center text-sm text-slate-300">
          Sistem Pengelolaan Permohonan Pinjaman Nasabah Terintegrasi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/10 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-white/15 sm:px-10 text-white text-center">
          
          <div className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-xs leading-relaxed text-left">
                <strong>Gagal masuk:</strong> {error}
              </div>
            )}

            <button
              type="button"
              onClick={onGoogleLogin}
              disabled={isLoggingIn}
              className={`w-full flex justify-center items-center py-3.5 px-4 border border-white/20 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-xl transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer ${
                isLoggingIn ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {isLoggingIn ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Memverifikasi akun...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    <path fill="none" d="M1 1h22v22H1z" />
                  </svg>
                  <span>Masuk dengan Google (Gmail)</span>
                </div>
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 border-t border-white/10 mt-8 pt-5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Koneksi terenkripsi aman via Google</span>
          </div>
        </div>
      </div>
    </div>
  );
}
