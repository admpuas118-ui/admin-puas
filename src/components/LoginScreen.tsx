import React, { useState } from "react";
import { ShieldCheck, Lock, User, Key, Eye, EyeOff } from "lucide-react";

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
  isLoggingIn: boolean;
  error: string | null;
}

export default function LoginScreen({ onLogin, isLoggingIn, error }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!username.trim() || !password.trim()) {
      setValidationError("Nama akun dan kata sandi wajib diisi.");
      return;
    }

    try {
      await onLogin(username.trim(), password);
    } catch (err: any) {
      // Error handled by parent
    }
  };

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
        <div className="bg-white/10 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-white/15 sm:px-10 text-white">
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Nama Akun (Username)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  name="username"
                  id="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoggingIn}
                  className="block w-full pl-10 pr-3 py-3 bg-black/25 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition"
                  placeholder="Masukkan nama akun..."
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Kata Sandi (Password)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  className="block w-full pl-10 pr-10 py-3 bg-black/25 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition"
                  placeholder="Masukkan kata sandi..."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {(error || validationError) && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-xs leading-relaxed">
                <strong>Gagal masuk:</strong> {error || validationError}
              </div>
            )}

            {/* Admin Credentials Helper Alert */}
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-200 leading-relaxed">
              <span className="font-bold text-indigo-300">💡 Petunjuk Akses Mandiri:</span>
              <p className="mt-1">
                Gunakan Nama Akun <strong className="text-white">admin</strong> dan Kata Sandi <strong className="text-white">puasklaten</strong> untuk masuk langsung ke dasbor.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full flex justify-center py-3 px-4 border border-indigo-500/30 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer ${
                isLoggingIn ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {isLoggingIn ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Memverifikasi akun...</span>
                </div>
              ) : (
                <span>Masuk Ke Dasbor</span>
              )}
            </button>
          </form>
          
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 border-t border-white/10 mt-6 pt-4">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Koneksi terenkripsi aman</span>
          </div>
        </div>
      </div>
    </div>
  );
}
