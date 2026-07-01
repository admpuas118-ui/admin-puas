import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Coins,
  ShieldAlert,
  Calculator,
  Check,
  TrendingUp,
  Clock,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { LoanApplication } from "../types";
import { calculatePUASKredit } from "../lib/loanCalculator";

interface LoanChartsProps {
  applications: LoanApplication[];
  onUpdateACC?: (id: string, amount: number) => Promise<void>;
}

export default function LoanCharts({ applications, onUpdateACC }: LoanChartsProps) {
  // Analytics / Fast ACC Calculator State
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [accValue, setAccValue] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Set default selected application
  useEffect(() => {
    if (applications.length > 0 && !selectedAppId) {
      // Prefer pending, reviewed, or approved applications
      const candidate = applications.find(a => a.status === "Pending" || a.status === "Sedang Ditinjau") || applications[0];
      if (candidate) {
        setSelectedAppId(candidate.id);
        setAccValue(candidate.accAmount ? candidate.accAmount.toString() : candidate.amount.toString());
      }
    }
  }, [applications, selectedAppId]);

  const selectedApp = applications.find(a => a.id === selectedAppId);

  // Update ACC value when selected application changes
  useEffect(() => {
    if (selectedApp) {
      setAccValue(selectedApp.accAmount ? selectedApp.accAmount.toString() : selectedApp.amount.toString());
      setSuccessMsg(null);
    }
  }, [selectedAppId]);

  // If no data, show standard placeholder
  if (applications.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg flex items-center justify-center h-64 text-slate-300 text-xs text-center">
        Belum ada data visualisasi untuk ditampilkan. Masukkan permohonan kredit baru terlebih dahulu.
      </div>
    );
  }

  // 1. Prepare Status Chart Data
  const statusCounts = applications.reduce((acc: Record<string, number>, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.keys(statusCounts).map((key) => ({
    name: key,
    value: statusCounts[key],
  }));

  const STATUS_COLORS: Record<string, string> = {
    Pending: "#fbbf24", // Yellow-400
    Disetujui: "#34d399", // Emerald-400
    Ditolak: "#f87171", // Rose-400
    "Sedang Ditinjau": "#c084fc", // Purple-400
  };

  // 2. Prepare Purpose Chart Data
  const purposeAmounts = applications.reduce((acc: Record<string, number>, app) => {
    // Standardize purpose title capitalization
    const key = app.purpose.trim() || "Lainnya";
    acc[key] = (acc[key] || 0) + app.amount;
    return acc;
  }, {});

  const purposeData = Object.keys(purposeAmounts).map((key) => ({
    name: key,
    amount: purposeAmounts[key] / 1000000, // Show in Millions IDR for scaling
  }));

  // Format Millions helper
  const formatMillions = (value: number) => {
    return `Rp ${value.toLocaleString("id-ID")}jt`;
  };

  const formatTooltipCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleFastUpdate = async () => {
    if (!onUpdateACC || !selectedAppId) return;
    setIsUpdating(true);
    setSuccessMsg(null);
    try {
      const amount = parseFloat(accValue) || 0;
      await onUpdateACC(selectedAppId, amount);
      setSuccessMsg(`Plafond ACC untuk ${selectedApp?.customerName} berhasil diperbarui!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
      alert("Gagal memperbarui ACC dari Analitika.");
    } finally {
      setIsUpdating(false);
    }
  };

  const activeAmount = selectedApp ? (parseFloat(accValue) || selectedApp.amount) : 0;
  const termMonths = selectedApp ? selectedApp.termMonths : 12;
  const { monthlyInstallment, dailySavings, isBrochureMatch } = calculatePUASKredit(activeAmount, termMonths);
  const dsr = selectedApp && selectedApp.monthlyIncome > 0
    ? (monthlyInstallment / selectedApp.monthlyIncome) * 100
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {/* Status distribution Pie Chart */}
      <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl md:col-span-2 flex flex-col justify-between text-white">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Status Permohonan
          </h3>
          <p className="text-sm font-semibold text-white">
            Proporsi Status Kredit Aktif
          </p>
        </div>

        <div className="h-60 flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  color: "#fff",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)"
                }}
                formatter={(value) => [`${value} Permohonan`, "Jumlah"]}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Custom Center Total Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-white font-display leading-none">
              {applications.length}
            </span>
            <span className="text-[10px] text-slate-300 font-semibold mt-1">Total Pengajuan</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pt-3 border-t border-white/5">
          {statusData.map((entry) => (
            <div key={entry.name} className="flex items-center space-x-1.5 text-xs text-slate-300">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: STATUS_COLORS[entry.name] || "#94a3b8" }}
              />
              <span className="font-medium text-[11px]">
                {entry.name} ({entry.value})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Purpose distribution Bar Chart */}
      <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl md:col-span-3 flex flex-col justify-between text-white">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Alokasi Dana Kredit
          </h3>
          <p className="text-sm font-semibold text-white">
            Total Dana Pinjaman Berdasarkan Tujuan Penggunaan
          </p>
        </div>

        <div className="h-60 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={purposeData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#cbd5e1" }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={formatMillions}
                tick={{ fontSize: 10, fill: "#cbd5e1" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: any) => [formatTooltipCurrency(Number(value) * 1000000), "Total Dana"]}
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  color: "#fff",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)"
                }}
              />
              <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]}>
                {purposeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#6366f1" opacity={0.75 + (index % 3) * 0.12} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-[10px] text-slate-400 text-right italic pt-2">
          *Nilai ditunjukkan dalam satuan Juta Rupiah (IDR)
        </div>
      </div>

      {/* 📊 KALKULATOR KELAYAKAN & PENGATUR ACC CEPAT (ANALITIKA) */}
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl mt-6 text-white md:col-span-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/10">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">
                Kalkulator Kelayakan &amp; Evaluasi Limit ACC (Analitika)
              </h3>
              <p className="text-xs text-slate-300">
                Pilih berkas pengajuan, analisis kelayakan bayar secara instan, dan tetapkan jumlah ACC yang disetujui.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-300 font-semibold">Pilih Nasabah:</span>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="text-xs border border-white/10 rounded-xl px-3 py-2 bg-[#131d35] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer font-bold"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.customerName} (ID: {app.id} - {app.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedApp ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Summary Profile of selected candidate */}
            <div className="lg:col-span-5 bg-[#0f172a]/40 p-4 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profil Pemohon</span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  selectedApp.status === "Disetujui"
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                    : selectedApp.status === "Ditolak"
                    ? "bg-rose-500/10 border-rose-500/25 text-rose-400"
                    : "bg-yellow-500/10 border-yellow-500/25 text-yellow-400"
                }`}>
                  {selectedApp.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400">Nama Nasabah:</span>
                  <p className="font-bold text-white text-sm mt-0.5 truncate">{selectedApp.customerName}</p>
                </div>
                <div>
                  <span className="text-slate-400">Kantor Pengaju:</span>
                  <p className="font-semibold text-indigo-300 mt-0.5">Kantor {selectedApp.kantor || "210"}</p>
                </div>
                <div>
                  <span className="text-slate-400">Plafond Diajukan:</span>
                  <p className="font-extrabold text-white mt-0.5 font-display">{formatTooltipCurrency(selectedApp.amount)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Tenor Pengembalian:</span>
                  <p className="font-bold text-slate-200 mt-0.5">{selectedApp.termMonths} Bulan</p>
                </div>
                <div className="col-span-2 border-t border-white/5 pt-2 mt-1">
                  <span className="text-slate-400">Pendapatan Bulanan:</span>
                  <p className="font-extrabold text-amber-300 mt-0.5 font-display">{formatTooltipCurrency(selectedApp.monthlyIncome)}</p>
                </div>
              </div>
            </div>

            {/* Right: Simulation & ACC Editing */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Input proposed ACC */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Tetapkan Nilai ACC (Rupiah)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-400 font-bold text-xs">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={accValue}
                      onChange={(e) => setAccValue(e.target.value)}
                      placeholder="Masukkan limit ACC, misal: 10000000"
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-black/45 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white font-bold font-display"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Nilai Pengajuan: {formatTooltipCurrency(selectedApp.amount)}
                  </span>
                </div>

                {/* Risk Gauge */}
                <div className={`p-3 rounded-xl border ${riskLevel.bg} ${riskLevel.border} flex flex-col justify-between`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Rasio Kelayakan (DSR)</span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${riskLevel.bg} ${riskLevel.text} border`}>
                      {riskLevel.label}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className={`text-lg font-black font-display leading-none ${dsr > 50 ? "text-rose-400" : dsr > 30 ? "text-amber-400" : "text-emerald-400"}`}>
                      {dsr.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">{riskLevel.desc}</p>
                  </div>
                </div>

              </div>

              {/* Dynamic calculations list */}
              <div className="bg-black/25 p-3.5 rounded-xl border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Tabungan Harian:</span>
                  <p className="font-extrabold text-emerald-400 mt-0.5">{formatTooltipCurrency(dailySavings)} /hari</p>
                </div>
                <div>
                  <span className="text-slate-400">Cicilan Bulanan:</span>
                  <p className="font-extrabold text-white mt-0.5">{formatTooltipCurrency(monthlyInstallment)} /bulan</p>
                </div>
                <div>
                  <span className="text-slate-400">Kesesuaian Brosur:</span>
                  <p className="font-bold text-indigo-300 mt-0.5">
                    {isBrochureMatch ? "Sesuai Tabel Brosur" : "Bunga Flat 2%/Bulan"}
                  </p>
                </div>
              </div>

              {/* Success Message & Submit Button */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <div>
                  {successMsg ? (
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl animate-fade-in">
                      <Check className="w-4 h-4" />
                      <span>{successMsg}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span>Suku bunga 2% flat per bulan dihitung otomatis</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isUpdating || !onUpdateACC}
                  onClick={handleFastUpdate}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Perbarui Nilai ACC</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">
            Tidak ada pengajuan kredit yang tersedia untuk dianalisis.
          </div>
        )}
      </div>
    </div>
  );
}
