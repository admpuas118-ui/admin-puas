import React, { useState } from "react";
import { KODE_GS_CONTENT, INDEX_HTML_CONTENT } from "../appsScriptTemplate";
import { Copy, Check, X, HelpCircle, FileCode, Terminal } from "lucide-react";

interface AppsScriptGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppsScriptGuideModal({ isOpen, onClose }: AppsScriptGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"instructions" | "gs" | "html">("instructions");
  const [copiedGs, setCopiedGs] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  if (!isOpen) return null;

  const handleCopyGs = async () => {
    try {
      await navigator.clipboard.writeText(KODE_GS_CONTENT);
      setCopiedGs(true);
      setTimeout(() => setCopiedGs(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin teks", err);
    }
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(INDEX_HTML_CONTENT);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin teks", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-white/10 w-full max-w-3xl rounded-2xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-[#131d35]/50">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded-xl">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold font-display text-white tracking-tight uppercase">
                Integrasi Google Apps Script
              </h2>
              <p class="text-[10px] text-slate-400 font-mono tracking-wider mt-0.5">
                KODE EKSTENSI UNTUK SPREADSHEET PT BANK PUAS KLATEN
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

        {/* TABS CONTROLS */}
        <div className="bg-[#131d35]/25 border-b border-white/5 px-6 flex space-x-2">
          <button
            onClick={() => setActiveTab("instructions")}
            className={`py-3.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center space-x-2 ${
              activeTab === "instructions"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Instruksi Pemasangan</span>
          </button>
          <button
            onClick={() => setActiveTab("gs")}
            className={`py-3.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center space-x-2 ${
              activeTab === "gs"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>kode.gs</span>
          </button>
          <button
            onClick={() => setActiveTab("html")}
            className={`py-3.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center space-x-2 ${
              activeTab === "html"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>index.html</span>
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300 font-sans">
          
          {/* TAB: INSTRUCTIONS */}
          {activeTab === "instructions" && (
            <div className="space-y-4">
              <div className="bg-emerald-500/5 border border-emerald-500/15 p-4 rounded-xl space-y-2">
                <p className="font-bold text-emerald-300">💡 Mengapa memasang Apps Script ini?</p>
                <p className="text-[11px] text-slate-300">
                  Dengan memasang kode ini langsung di Spreadsheet Anda, Anda dapat mengelola, menambah, serta mengubah 
                  <strong> Status Kredit</strong> dan <strong>Status Pemrosesan Berkas (Termasuk Status DiACC / Ditolak)</strong> langsung dari bilah sisi (Sidebar) Google Sheets Anda tanpa perlu membuka portal luar.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-white text-[13px] uppercase tracking-wide">Langkah-Langkah Pemasangan:</h4>
                <ol className="space-y-3.5 list-decimal pl-4 text-slate-300">
                  <li>
                    Buka Spreadsheet Google Anda yang terhubung dengan mengklik tombol{" "}
                    <span className="text-indigo-400 font-semibold">"Buka Google Sheets"</span> di sub-bar sinkronisasi.
                  </li>
                  <li>
                    Pada menu bar atas Google Sheets, klik menu <strong className="text-white">Ekstensi</strong> &gt;{" "}
                    <strong className="text-white">Apps Script</strong> (Extension &gt; Apps Script).
                  </li>
                  <li>
                    Secara default akan ada satu berkas bernama <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300 font-mono">Code.gs</code>. Hapus semua isinya, pindah ke tab{" "}
                    <span className="text-emerald-400 font-bold">kode.gs</span> di atas modal ini, klik tombol salin, lalu tempelkan kodenya di sana. Ubah nama berkas menjadi <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300 font-mono">kode.gs</code>.
                  </li>
                  <li>
                    Di sebelah kiri editor Apps Script, klik tombol tambah berkas <strong className="text-white">(+)</strong> &gt;{" "}
                    <strong className="text-white">HTML</strong>, lalu beri nama berkas baru tersebut{" "}
                    <strong className="text-emerald-400 font-mono">index</strong> (tanpa ekstensi .html, otomatis menjadi index.html).
                  </li>
                  <li>
                    Pindah ke tab <span className="text-emerald-400 font-bold">index.html</span> di atas modal ini, salin kodenya, lalu tempelkan semuanya ke dalam berkas baru tersebut menggantikan kode bawaannya.
                  </li>
                  <li>
                    Klik tombol simpan berkas <strong className="text-white">(ikon disket)</strong> pada bilah atas editor Apps Script.
                  </li>
                  <li>
                    Muat ulang halaman Google Sheets Anda. Di menu bar atas, Anda akan melihat menu baru bernama{" "}
                    <strong className="text-indigo-300">PUAS KLATEN Portal</strong>. Klik menu tersebut lalu pilih{" "}
                    <strong className="text-white">"Buka Panel Pengaju"</strong> untuk menampilkan bilah sisi kelola kredit interaktif secara real-time!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB: KODE.GS */}
          {activeTab === "gs" && (
            <div className="space-y-3 relative">
              <div className="flex justify-between items-center">
                <p className="text-slate-400 text-[11px]">Salin dan tempel kode ini ke berkas <strong className="text-white">kode.gs</strong> di editor Google Apps Script.</p>
                <button
                  onClick={handleCopyGs}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1"
                >
                  {copiedGs ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="font-mono text-[10px] bg-slate-950 p-4 rounded-xl overflow-x-auto text-emerald-400 border border-white/5 max-h-[360px] leading-relaxed">
                {KODE_GS_CONTENT}
              </pre>
            </div>
          )}

          {/* TAB: INDEX.HTML */}
          {activeTab === "html" && (
            <div className="space-y-3 relative">
              <div className="flex justify-between items-center">
                <p className="text-slate-400 text-[11px]">Salin dan tempel kode ini ke berkas <strong className="text-white">index.html</strong> di editor Google Apps Script.</p>
                <button
                  onClick={handleCopyHtml}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1"
                >
                  {copiedHtml ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="font-mono text-[10px] bg-slate-950 p-4 rounded-xl overflow-x-auto text-emerald-400 border border-white/5 max-h-[360px] leading-relaxed">
                {INDEX_HTML_CONTENT}
              </pre>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#131d35]/30 flex justify-end">
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
          >
            Selesai &amp; Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
