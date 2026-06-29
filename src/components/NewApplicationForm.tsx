import React, { useState } from "react";
import { Plus, User, Mail, Phone, Coins, Calendar, Sparkles, Calculator, HelpCircle, FileText } from "lucide-react";
import { LoanApplication } from "../types";

interface NewApplicationFormProps {
  onSave: (app: Omit<LoanApplication, "rowIndex">) => Promise<void>;
}

export default function NewApplicationForm({ onSave }: NewApplicationFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [termMonths, setTermMonths] = useState("12");
  const [purpose, setPurpose] = useState("Modal Usaha");
  const [customPurpose, setCustomPurpose] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [kantor, setKantor] = useState("210");
  const [statusPemrosesan, setStatusPemrosesan] = useState("Lengkap & Siap Diperiksa");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate estimated installment in real-time
  const parsedAmount = parseFloat(amount) || 0;
  const parsedIncome = parseFloat(monthlyIncome) || 0;
  const parsedTerm = parseInt(termMonths) || 12;

  const monthlyPrincipal = parsedAmount / parsedTerm;
  const monthlyInterest = parsedAmount * 0.02; // 2% flat per month estimate (24% per year)
  const estimatedInstallment = parsedAmount > 0 ? (monthlyPrincipal + monthlyInterest) : 0;
  const dsr = parsedIncome > 0 ? (estimatedInstallment / parsedIncome) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (parsedAmount <= 0) {
      setError("Jumlah pinjaman harus lebih besar dari Rp 0.");
      return;
    }

    if (parsedIncome <= 0) {
      setError("Pendapatan bulanan nasabah harus lebih besar dari Rp 0.");
      return;
    }

    setIsSaving(true);

    const finalPurpose = purpose === "Lainnya" ? customPurpose.trim() : purpose;
    if (!finalPurpose) {
      setError("Mohon isi tujuan penggunaan kredit.");
      setIsSaving(false);
      return;
    }

    // Generate unique ID with Bank prefix: e.g. "KRD-2026-XXXXXX"
    const randomId = "KRD-" + Math.floor(100000 + Math.random() * 900000);
    const currentDate = new Date().toISOString();

    const newApp: Omit<LoanApplication, "rowIndex"> = {
      id: randomId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      amount: parsedAmount,
      termMonths: parsedTerm,
      purpose: finalPurpose,
      monthlyIncome: parsedIncome,
      status: "Pending",
      createdAt: currentDate,
      adminNotes: "",
      kantor: kantor,
      statusPemrosesan: statusPemrosesan,
    };

      try {
        await onSave(newApp);
        
        // Reset form on success
        setCustomerName("");
        setCustomerEmail("");
        setPhoneNumber("");
        setAmount("");
        setMonthlyIncome("");
        setPurpose("Modal Usaha");
        setCustomPurpose("");
        setKantor("210");
        setStatusPemrosesan("Lengkap & Siap Diperiksa");
      
      setSuccess(`Berhasil meregistrasikan permohonan kredit baru untuk ${newApp.customerName} dengan ID: ${newApp.id}! Data telah disinkronisasikan ke Google Sheets.`);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan permohonan kredit.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper currency formatting
  const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-6 font-sans text-white">
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
          Form Input Manual Admin
        </h3>
        <p className="text-lg font-bold text-white font-display">
          Registrasi Permohonan Kredit Baru
        </p>
        <p className="text-xs text-slate-300">
          Gunakan form ini jika nasabah mengajukan pinjaman di loket bank/desk admin secara langsung.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-200 rounded-xl text-xs leading-relaxed">
          <strong>Kesalahan:</strong> {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 rounded-xl text-xs leading-relaxed">
          <strong>Sukses:</strong> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Customer Profile */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center space-x-2">
            <span>1. Profil Informasi Nasabah</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Nama Lengkap Nasabah
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-300">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Alamat Email Nasabah
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-300">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="budi@example.com"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Nomor Telepon (WhatsApp)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-300">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white placeholder-slate-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Credit File Details */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center space-x-2">
            <span>2. Rincian Pengajuan Kredit &amp; Keuangan</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Jumlah Pinjaman (Plafond IDR)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-300 font-bold text-xs">
                  Rp
                </span>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Contoh: 50000000"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Tenor Pinjaman (Bulan)
              </label>
              <select
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white"
              >
                <option value="6">6 Bulan</option>
                <option value="12">12 Bulan (1 Tahun)</option>
                <option value="18">18 Bulan</option>
                <option value="24">24 Bulan (2 Tahun)</option>
                <option value="36">36 Bulan (3 Tahun)</option>
                <option value="48">48 Bulan (4 Tahun)</option>
                <option value="60">60 Bulan (5 Tahun)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Pendapatan Bulanan Bersih (IDR)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-300 font-bold text-xs">
                  Rp
                </span>
                <input
                  type="number"
                  required
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="Contoh: 15000000"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Tujuan Penggunaan Pinjaman
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white"
              >
                <option value="Modal Usaha">Modal Usaha / UMKM</option>
                <option value="Renovasi Rumah">Renovasi Rumah</option>
                <option value="Pembelian Kendaraan">Pembelian Kendaraan</option>
                <option value="Pendidikan">Pendidikan</option>
                <option value="Konsumsi Pribadi">Konsumsi Pribadi</option>
                <option value="Lainnya">Lainnya (Tulis Manual)</option>
              </select>
            </div>
          </div>

          {/* Conditional purpose box */}
          {purpose === "Lainnya" && (
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Sebutkan Tujuan Penggunaan Lainnya
              </label>
              <input
                type="text"
                required
                value={customPurpose}
                onChange={(e) => setCustomPurpose(e.target.value)}
                placeholder="Misal: Biaya Rumah Sakit, Pembelian Kebun, dll."
                className="w-full text-xs px-3.5 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white placeholder-slate-500"
              />
            </div>
          )}
        </div>

        {/* Section 3: Administrasi & Kantor */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center space-x-2">
            <span>3. Administrasi &amp; Distribusi Kantor</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Kantor / Cabang Pengaju
              </label>
              <select
                value={kantor}
                onChange={(e) => setKantor(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white"
              >
                <option value="210">Kantor 210</option>
                <option value="211">Kantor 211</option>
                <option value="212">Kantor 212</option>
                <option value="213">Kantor 213</option>
                <option value="215">Kantor 215</option>
                <option value="216">Kantor 216</option>
                <option value="217">Kantor 217</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Status Pemrosesan Berkas
              </label>
              <select
                value={statusPemrosesan}
                onChange={(e) => setStatusPemrosesan(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white"
              >
                <option value="Lengkap &amp; Siap Diperiksa">Lengkap &amp; Siap Diperiksa</option>
                <option value="Menunggu Dokumen Tambahan">Menunggu Dokumen Tambahan</option>
                <option value="Sedang Diverifikasi">Sedang Diverifikasi</option>
                <option value="Tahap Analisis Risiko">Tahap Analisis Risiko</option>
                <option value="Survei Lapangan">Survei Lapangan</option>
                <option value="DiACC">DiACC</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Live credit estimation advisory box */}
        {parsedAmount > 0 && parsedIncome > 0 && (
          <div className="p-4 rounded-xl border border-indigo-500/25 bg-indigo-500/10 space-y-2">
            <h5 className="text-[11px] font-bold text-indigo-200 uppercase tracking-widest flex items-center space-x-1.5">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <span>Simulasi Keputusan Pra-Analisis Admin</span>
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-200">
              <div>
                <span className="text-slate-400">Jumlah Pinjaman:</span>
                <p className="font-bold text-white">{formatIDR(parsedAmount)}</p>
              </div>
              <div>
                <span className="text-slate-400">Estimasi Cicilan Bulanan:</span>
                <p className="font-bold text-white">{formatIDR(estimatedInstallment)} <span className="text-[10px] font-normal text-slate-400">(2% flat/bln, atau 24%/tahun)</span></p>
              </div>
              <div>
                <span className="text-slate-400">Rasio Cicilan Pendapatan (DSR):</span>
                <p className={`font-bold ${dsr > 50 ? "text-rose-400" : dsr > 30 ? "text-amber-400" : "text-emerald-400"}`}>
                  {dsr.toFixed(1)}% {dsr > 50 ? "⚠️ Berisiko" : dsr > 30 ? "⚡ Wajar" : "✓ Sangat Sehat"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/40 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Menyimpan ke Google Sheets...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Simpan Permohonan Baru</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
