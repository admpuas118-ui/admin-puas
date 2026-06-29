import React from "react";
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
import { LoanApplication } from "../types";

interface LoanChartsProps {
  applications: LoanApplication[];
}

export default function LoanCharts({ applications }: LoanChartsProps) {
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
    </div>
  );
}
