import React from "react";
import { FileText, Coins, CheckCircle, Clock, XCircle, SlidersHorizontal } from "lucide-react";
import { BankStats } from "../types";

interface LoanStatsCardsProps {
  stats: BankStats;
}

export default function LoanStatsCards({ stats }: LoanStatsCardsProps) {
  // Format to IDR Currency helper
  const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const approvalRate = stats.totalApplications
    ? Math.round((stats.approvedCount / stats.totalApplications) * 100)
    : 0;

  const cards = [
    {
      id: "stat-total",
      title: "Total Permohonan",
      value: stats.totalApplications.toString(),
      sub: "Semua pengajuan kredit",
      icon: <FileText className="w-5 h-5 text-indigo-400" />,
      bg: "bg-white/5 border-white/10",
    },
    {
      id: "stat-amount",
      title: "Total Portofolio Pinjaman",
      value: formatIDR(stats.totalRequestedAmount),
      sub: "Jumlah total dana diajukan",
      icon: <Coins className="w-5 h-5 text-amber-400" />,
      bg: "bg-white/5 border-white/10",
    },
    {
      id: "stat-approved",
      title: "Disetujui",
      value: `${stats.approvedCount} (${approvalRate}%)`,
      sub: "Kredit disetujui & aktif",
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      bg: "bg-white/5 border-white/10",
    },
    {
      id: "stat-pending",
      title: "Menunggu Peninjauan",
      value: stats.pendingCount.toString(),
      sub: "Perlu dievaluasi admin",
      icon: <Clock className="w-5 h-5 text-yellow-400" />,
      bg: "bg-white/5 border-white/10",
    },
    {
      id: "stat-review",
      title: "Sedang Ditinjau",
      value: stats.reviewCount.toString(),
      sub: "Dalam proses analisis lanjut",
      icon: <SlidersHorizontal className="w-5 h-5 text-purple-400" />,
      bg: "bg-white/5 border-white/10",
    },
    {
      id: "stat-rejected",
      title: "Ditolak",
      value: stats.rejectedCount.toString(),
      sub: "Kredit tidak memenuhi syarat",
      icon: <XCircle className="w-5 h-5 text-rose-400" />,
      bg: "bg-white/5 border-white/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          id={card.id}
          className={`p-4 rounded-xl border backdrop-blur-md flex flex-col justify-between shadow-lg shadow-black/10 hover:bg-white/10 transition-all duration-200 ${card.bg}`}
        >
          <div className="flex justify-between items-start mb-2 gap-2">
            <span className="text-xs font-semibold text-slate-300 tracking-tight leading-none">
              {card.title}
            </span>
            <div className="p-1 rounded-lg bg-white/10 shadow-md flex-shrink-0">
              {card.icon}
            </div>
          </div>
          <div>
            <p className="text-lg font-extrabold text-white tracking-tight leading-none mb-1 font-display">
              {card.value}
            </p>
            <p className="text-[10px] text-slate-400 truncate leading-none">
              {card.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
