import React, { useState } from "react";
import { FileSpreadsheet, Plus, RefreshCw, Calendar, ChevronRight, AlertCircle, Database, LogOut } from "lucide-react";
import { SpreadsheetFile } from "../types";

interface SpreadsheetSelectorProps {
  spreadsheets: SpreadsheetFile[];
  onSelect: (id: string) => void;
  onCreateNew: (title: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  userEmail?: string;
}

export default function SpreadsheetSelector({
  spreadsheets,
  onSelect,
  onCreateNew,
  isLoading,
  onRefresh,
  onLogout,
  userEmail,
}: SpreadsheetSelectorProps) {
  const [newTitle, setNewTitle] = useState("Database Permohonan Pinjaman Bank");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      await onCreateNew(newTitle);
    } catch (err: any) {
      setError(err.message || "Gagal membuat spreadsheet");
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15 shadow-2xl text-white gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-300 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-white leading-tight">
                Hubungkan Spreadsheet Database
              </h1>
              <p className="text-xs text-slate-300">
                Masuk sebagai: <strong className="text-indigo-200">{userEmail}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 border border-white/15 hover:bg-white/10 rounded-lg text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sesi</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-200 rounded-xl text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create New Spreadsheet Card */}
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15 shadow-2xl text-white flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-300 rounded-xl flex items-center justify-center mb-4">
                <Plus className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold font-display text-white mb-2">
                Buat Database Baru
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Kami akan membuat spreadsheet kosong dengan format kolom dan tab yang sudah disesuaikan secara otomatis di Google Drive Anda.
              </p>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Nama Spreadsheet Baru
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Contoh: Database Pinjaman Bank 2026"
                    className="w-full text-sm px-3.5 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white placeholder-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang Membuat Lembar...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Buat & Gunakan Spreadsheet Ini</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* List Existing Spreadsheets */}
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15 shadow-2xl text-white flex flex-col justify-between">
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-300 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                  title="Refresh spreadsheet list"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
              <h2 className="text-lg font-bold font-display text-white mb-2">
                Pilih Spreadsheet yang Ada
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Pilih spreadsheet dari Google Drive Anda yang berisi data permohonan pinjaman bank atau yang ingin Anda gunakan sebagai database.
              </p>

              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                  <span className="text-xs text-slate-400">Memuat berkas dari Drive...</span>
                </div>
              ) : spreadsheets.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-black/10 rounded-xl border border-dashed border-white/10">
                  <AlertCircle className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-300">Tidak ada spreadsheet ditemukan</span>
                  <span className="text-[10px] text-slate-400 mt-1">Gunakan form di sebelah kiri untuk membuat baru.</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 space-y-2 divide-y divide-white/5">
                  {spreadsheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      onClick={() => onSelect(sheet.id)}
                      className="w-full text-left p-3 hover:bg-white/10 rounded-xl border border-transparent hover:border-white/10 flex items-center justify-between transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-8 h-8 bg-emerald-500/20 text-emerald-300 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition">
                            {sheet.name}
                          </p>
                          <p className="text-[10px] text-slate-300 flex items-center space-x-1 mt-0.5">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>Modifikasi terakhir: {sheet.modifiedTime ? new Date(sheet.modifiedTime).toLocaleDateString("id-ID") : "-"}</span>
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-300 transition flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
