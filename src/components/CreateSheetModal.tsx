import React, { useState } from "react";
import { X, FileSpreadsheet, Copy, Check, ExternalLink, HelpCircle, LayoutGrid, Info } from "lucide-react";

interface CreateSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHEET_COLUMNS = [
  "ID",
  "Nama Nasabah",
  "Email Nasabah",
  "No Telepon",
  "Jumlah Pinjaman (IDR)",
  "Tenor (Bulan)",
  "Tujuan Pinjaman",
  "Pendapatan Bulanan (IDR)",
  "Status",
  "Tanggal Pengajuan",
  "Catatan Admin",
  "Kantor",
  "Status Pemrosesan Berkas",
  "Jumlah Disetujui (ACC)",
];

export default function CreateSheetModal({ isOpen, onClose }: CreateSheetModalProps) {
  const [copiedHeaders, setCopiedHeaders] = useState(false);

  if (!isOpen) return null;

  const handleCopyHeaders = async () => {
    try {
      const headerString = SHEET_COLUMNS.join("\t");
      await navigator.clipboard.writeText(headerString);
      setCopiedHeaders(true);
      setTimeout(() => setCopiedHeaders(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin tajuk kolom", err);
    }
  };

  const templateCopyUrl = "https://docs.google.com/spreadsheets/d/11QvUo-i6e_fR6D3nZ08P7qM5f0C2M9J5O4tD-R8eE5Gk/copy";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-white/10 w-full max-w-2xl rounded-2xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden font-sans text-slate-200">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-[#131d35]/50">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold font-display text-white tracking-tight uppercase">
                Pembuatan Google Sheet Baru
              </h2>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider mt-0.5">
                OPSI INTEGRASI DAN TEMPLATE DATABASE PT BANK PUAS KLATEN
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-2 hover:bg-white/5 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs leading-relaxed">
          
          <div className="bg-emerald-500/5 border border-emerald-500/15 p-4 rounded-xl flex items-start space-x-3">
            <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-300">
              Integrasi Google Sheet memudahkan Anda untuk menyinkronkan data permohonan kredit secara real-time. Anda dapat memilih salah satu opsi pembuatan di bawah ini.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* OPTION A: COPY FROM TEMPLATE */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                  Rekomendasi Utama
                </span>
                <h3 className="text-sm font-bold text-white font-display pt-1">Opsi A: Gunakan Template Resmi</h3>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Buat salinan instan dari spreadsheet master kami yang sudah terformat rapi dengan nama kolom, pewarnaan sel, rumus rasio, dan layout ideal.
                </p>
              </div>
              
              <div className="pt-2">
                <a
                  href={templateCopyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Salin Template Resmi</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-[10px] text-slate-500 text-center mt-2">
                  *Memerlukan akun Google Drive aktif
                </p>
              </div>
            </div>

            {/* OPTION B: CREATE FROM SCRATCH */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                  Fleksibel / Kustom
                </span>
                <h3 className="text-sm font-bold text-white font-display pt-1">Opsi B: Buat dari Nol</h3>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Buka Google Spreadsheet baru yang kosong, lalu salin tajuk kolom yang dibutuhkan dengan satu tombol praktis di bawah ini.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyHeaders}
                  className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-xl text-xs font-bold border border-indigo-500/25 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {copiedHeaders ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Header Kolom Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Judul Kolom (Row 1)</span>
                    </>
                  )}
                </button>

                <a
                  href="https://docs.google.com/spreadsheets/u/0/create"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Buat Lembar Kosong Baru</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>

          {/* HEADERS REFERENCE */}
          <div className="border border-white/5 rounded-xl bg-black/25 overflow-hidden">
            <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="font-bold text-white flex items-center space-x-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Urutan Kolom Database (A s/d N)</span>
              </span>
              <span className="text-[10px] text-slate-400">Total: 14 Kolom</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <div className="flex space-x-2 pb-2 min-w-[600px]">
                {SHEET_COLUMNS.map((col, idx) => (
                  <div key={idx} className="flex-shrink-0 text-center">
                    <div className="bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded text-[10px] font-bold font-mono">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium mt-1 select-all">
                      {col}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-2 italic">
                *Tip: Setelah mengklik "Salin Judul Kolom", buka Google Spreadsheet lalu pilih sel <strong>A1</strong> dan tekan <strong>Ctrl+V</strong> (atau Cmd+V di Mac) untuk menempelkannya langsung.
              </p>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#131d35]/30 flex justify-end">
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
