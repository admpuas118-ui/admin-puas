import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  Coins,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  FileText,
  Calculator,
  ShieldAlert,
  Building,
} from "lucide-react";
import { LoanApplication } from "../types";
import { calculatePUASKredit } from "../lib/loanCalculator";

interface ApplicationDetailsModalProps {
  application: LoanApplication | null;
  onClose: () => void;
  onSave: (
    id: string,
    status: LoanApplication["status"],
    notes: string,
    statusPemrosesan: string,
    accAmount?: number
  ) => Promise<void>;
}

export default function ApplicationDetailsModal({
  application,
  onClose,
  onSave,
}: ApplicationDetailsModalProps) {
  const [status, setStatus] = useState<LoanApplication["status"]>("Pending");
  const [notes, setNotes] = useState("");
  const [statusPemrosesan, setStatusPemrosesan] = useState("");
  const [accAmount, setAccAmount] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Custom Confirmation Modal state
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (application) {
      setStatus(application.status);
      setNotes(application.adminNotes || "");
      setStatusPemrosesan(application.statusPemrosesan || "Lengkap & Siap Diperiksa");
      // Set default approved amount to requested amount if not already set, or load it
      setAccAmount(application.accAmount ? application.accAmount.toString() : application.amount.toString());
    }
  }, [application]);

  if (!application) return null;

  // Currency Formatter Helper
  const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // 1. Calculate PUAS brochure-aligned daily savings and monthly installments
  const activeAmount = status === "Disetujui" ? (parseFloat(accAmount) || application.amount) : application.amount;
  const { monthlyInstallment, dailySavings, isBrochureMatch } = calculatePUASKredit(activeAmount, application.termMonths);
  
  // DSR = Installment / Income
  const dsr = application.monthlyIncome > 0 
    ? (monthlyInstallment / application.monthlyIncome) * 100 
    : 0;

  // Risk Classification
  let riskLevel = {
    label: "Aman (Rendah)",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/25",
    desc: "Cicilan di bawah 30% pendapatan bulanan nasabah. Tingkat kemampuan bayar sangat baik.",
  };

  if (dsr > 30 && dsr <= 50) {
    riskLevel = {
      label: "Waspada (Sedang)",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/25",
      desc: "Cicilan berada di rentang 30% - 50% pendapatan bulanan nasabah. Memerlukan analisis jaminan tambahan.",
    };
  } else if (dsr > 50) {
    riskLevel = {
      label: "Berisiko Tinggi (Tinggi)",
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "border-rose-500/25",
      desc: "Cicilan melebihi 50% pendapatan bulanan nasabah. Potensi gagal bayar tinggi.",
    };
  }

  const handleTriggerSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    setIsSaving(true);
    try {
      const finalAccAmount = status === "Disetujui" ? (parseFloat(accAmount) || application.amount) : 0;
      await onSave(application.id, status, notes, statusPemrosesan, finalAccAmount);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Gagal memperbarui data ke Google Sheets.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      {/* Background backdrop */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-[#131d35]/95 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-white/15 text-white">
          
          {/* Main Modal Form */}
          <form onSubmit={handleTriggerSave} className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                  ID: {application.id}
                </span>
                <span className="text-sm text-slate-300">• Tinjau Permohonan Kredit</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Primary Info Row (Applicant profile & details) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section Left: Applicant Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Profil Nasabah
                  </h3>
                  
                  <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center space-x-3 text-slate-300">
                      <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">Nama Lengkap</p>
                        <p className="text-sm font-bold text-white truncate">{application.customerName}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-slate-300">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">No Telepon WhatsApp</p>
                        <p className="text-sm font-semibold text-slate-200">{application.phoneNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Tanggal Pengajuan</p>
                        <p className="text-sm font-semibold text-slate-200">
                          {new Date(application.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Right: Loan Amount Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Detail Pinjaman
                  </h3>

                  <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center space-x-3 text-slate-300">
                      <Coins className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Plafond Pengajuan</p>
                        <p className="text-sm font-bold text-indigo-300 font-display">
                          {formatIDR(application.amount)}
                        </p>
                      </div>
                    </div>

                    {application.accAmount && application.accAmount > 0 && (
                      <div className="flex items-center space-x-3 text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-emerald-400 font-semibold">Jumlah Disetujui (ACC)</p>
                          <p className="text-sm font-bold text-emerald-300 font-display">
                            {formatIDR(application.accAmount)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3 text-slate-300">
                      <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Tenor Pengembalian</p>
                        <p className="text-sm font-bold text-white">{application.termMonths} Bulan</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-slate-300">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Tujuan Pinjaman</p>
                        <p className="text-sm font-semibold text-slate-200">{application.purpose}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-slate-300">
                      <Calculator className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Pendapatan Bulanan Nasabah</p>
                        <p className="text-sm font-bold text-slate-200">
                          {formatIDR(application.monthlyIncome)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-slate-300">
                      <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Kantor / Cabang Pengaju</p>
                        <p className="text-sm font-bold text-indigo-300">
                          Kantor {application.kantor || "210"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-slate-300">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Status Pemrosesan Berkas</p>
                        <p className="text-sm font-semibold text-slate-200">
                          {application.statusPemrosesan || "Lengkap & Siap Diperiksa"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automatic Financial & Credit Risk Assessment (DSR Calculator) */}
              <div className={`p-4 rounded-xl border ${riskLevel.bg} ${riskLevel.border} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-5 h-5 text-slate-300" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                      Analisis Kelayakan &amp; Simulasi Angsuran PUAS
                    </span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${riskLevel.bg} ${riskLevel.text} border`}>
                    {riskLevel.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-slate-400">Tabungan Harian:</span>
                    <p className="text-sm font-extrabold text-amber-300 mt-0.5">
                      {formatIDR(dailySavings)} <span className="text-[10px] text-slate-400 font-normal">/hari</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Angsuran Bulanan:</span>
                    <p className="text-sm font-extrabold text-white mt-0.5">
                      {formatIDR(monthlyInstallment)} <span className="text-[10px] text-slate-400 font-normal">/bulan</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Rasio Cicilan (DSR):</span>
                    <p className={`text-sm font-bold mt-0.5 ${dsr > 50 ? "text-rose-400" : dsr > 30 ? "text-amber-400" : "text-emerald-400"}`}>
                      {dsr.toFixed(1)}% <span className="text-[10px] text-slate-400 font-normal">dari pendapatan</span>
                    </p>
                  </div>
                </div>
                
                <p className="text-[11px] text-slate-200 leading-relaxed border-t border-white/10 pt-2.5">
                  <strong className="text-white">Keterangan:</strong> {riskLevel.desc} {isBrochureMatch ? "(Sesuai dengan brosur resmi PUAS KLATEN)" : "(Perhitungan estimasi suku bunga 24% efektif/tahun)"}
                </p>
              </div>

              {/* Status Update & Admin Notes Input */}
              <div className="border-t border-white/10 pt-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Change Status */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Keputusan Kredit
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { id: "Pending", label: "Pending (Menunggu)", color: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20" },
                        { id: "Sedang Ditinjau", label: "Sedang Ditinjau", color: "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20" },
                        { id: "Disetujui", label: "Setujui Permohonan", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" },
                        { id: "Ditolak", label: "Tolak Permohonan", color: "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20" },
                        { id: "BATAL", label: "Batal (Nasabah Batal)", color: "border-slate-500/30 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setStatus(opt.id as any)}
                          className={`w-full text-left px-3.5 py-2 border rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                            status === opt.id
                              ? `${opt.color.split(" ")[1]} ${opt.color.split(" ")[0]} ${opt.color.split(" ")[2]} ring-1 ring-white/15`
                              : "border-white/10 hover:bg-white/5 text-slate-300"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {status === opt.id && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Status Pemrosesan Berkas
                    </label>
                    <select
                      value={statusPemrosesan}
                      onChange={(e) => setStatusPemrosesan(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-black/25 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white font-semibold cursor-pointer"
                    >
                      <option value="Lengkap &amp; Siap Diperiksa">Lengkap &amp; Siap Diperiksa</option>
                      <option value="Menunggu Dokumen Tambahan">Menunggu Dokumen Tambahan</option>
                      <option value="Sedang Diverifikasi">Sedang Diverifikasi</option>
                      <option value="Tahap Analisis Risiko">Tahap Analisis Risiko</option>
                      <option value="Survei Lapangan">Survei Lapangan</option>
                      <option value="DiACC">DiACC</option>
                      <option value="Ditolak">Ditolak</option>
                      <option value="BATAL">BATAL</option>
                    </select>
                  </div>
                </div>

                {/* Admin notes remarks & Approved Amount */}
                <div className="md:col-span-2 space-y-4">
                  {status === "Disetujui" && (
                    <div className="space-y-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider">
                        ACC Berapa (Jumlah Disetujui)?
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-400 font-bold text-xs">
                          Rp
                        </span>
                        <input
                          type="number"
                          required
                          value={accAmount}
                          onChange={(e) => setAccAmount(e.target.value)}
                          placeholder="Masukkan nilai ACC, misal: 10000000"
                          className="w-full text-xs pl-9 pr-3 py-2.5 bg-black/45 border border-emerald-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 text-white font-bold"
                        />
                      </div>
                      <p className="text-[10px] text-emerald-400">
                        Default: {formatIDR(application.amount)} (plafond pengajuan). Suku bunga 2% flat per bulan akan dihitung otomatis berdasarkan jumlah ACC ini.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Catatan Penilaian Kredit (Admin Remarks)
                    </label>
                    <textarea
                      rows={status === "Disetujui" ? 4 : 8}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Masukkan alasan persetujuan/penolakan, catatan jaminan nasabah, riwayat BI checking, atau persyaratan dokumen tambahan..."
                      className="w-full text-xs px-3.5 py-2.5 bg-black/25 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white leading-relaxed placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end space-x-3 border-t border-white/10 bg-white/5 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-white/10 hover:bg-white/10 rounded-xl text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Keputusan</span>
                )}
              </button>
            </div>
          </form>

          {/* ⚠️ BEAUTIFUL ONSCREEN CONFIRMATION MODAL (Required for mutative operations) */}
          {showConfirm && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#131d35] rounded-2xl p-6 max-w-sm w-full border border-white/15 shadow-2xl flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-md font-bold text-white font-display">
                    Konfirmasi Perubahan Data
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Apakah Anda yakin ingin memperbarui berkas permohonan kredit nasabah <strong className="text-white">{application.customerName}</strong> ke Google Sheets?
                  </p>
                </div>

                <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-left w-full space-y-1">
                  <p className="text-[11px] text-slate-300">
                    - Status Baru: <strong className={`font-semibold ${status === "Disetujui" ? "text-emerald-400" : status === "Ditolak" ? "text-rose-400" : "text-yellow-400"}`}>{status}</strong>
                  </p>
                  {status === "Disetujui" && (
                    <p className="text-[11px] text-slate-300">
                      - Plafond ACC: <strong className="text-emerald-400">{formatIDR(parseFloat(accAmount) || application.amount)}</strong>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-300 truncate">
                    - Catatan Admin: <span className="italic">"{notes || "tanpa catatan"}"</span>
                  </p>
                </div>

                <div className="flex space-x-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSave}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                  >
                    Ya, Perbarui Sheet
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
