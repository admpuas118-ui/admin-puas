import React, { useState, useEffect } from "react";
import {
  initAuth,
  loginWithCredentials,
  logout,
  getCachedGoogleToken,
  setCachedGoogleToken,
  signInWithGoogleSheets,
} from "./firebase";
import {
  fetchApplicationsFirestore,
  addApplicationFirestore,
  updateApplicationFirestore,
  deleteApplicationFirestore,
} from "./firestoreService";
import {
  extractSpreadsheetId,
  syncFirestoreToSheets,
  addApplication,
  updateApplicationStatusAndNotes,
} from "./sheetsService";
import { LoanApplication, BankStats } from "./types";
import LoginScreen from "./components/LoginScreen";
import LoanStatsCards from "./components/LoanStatsCards";
import LoanCharts from "./components/LoanCharts";
import NewApplicationForm from "./components/NewApplicationForm";
import ApplicationDetailsModal from "./components/ApplicationDetailsModal";
import AppsScriptGuideModal from "./components/AppsScriptGuideModal";
import CreateSheetModal from "./components/CreateSheetModal";

import {
  ShieldCheck,
  LogOut,
  RefreshCw,
  Search,
  ExternalLink,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  Database,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Code,
  Copy,
  Check,
  X,
  Edit2,
  Trash2,
} from "lucide-react";

export default function App() {
  // 1. Auth States
  const [user, setUser] = useState<any>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 2. Google Sheet Links (Optional Integration)
  const [spreadsheetLink, setSpreadsheetLink] = useState<string>(
    localStorage.getItem("bank_loan_spreadsheet_link") || ""
  );
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [tempLink, setTempLink] = useState(spreadsheetLink);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    status: "idle" | "success" | "error";
    message?: string;
    details?: { added: number; updated: number; failed: number; pulled: number };
  }>({ status: "idle" });
  
  // 3. Application Data States
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [isAppsLoading, setIsAppsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 4. Navigation & Filtering States
  const [activeTab, setActiveTab] = useState<"dashboard" | "input">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [kantorFilter, setKantorFilter] = useState<string>("Semua");
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [showAppsScriptGuide, setShowAppsScriptGuide] = useState(false);
  const [showCreateSheetModal, setShowCreateSheetModal] = useState(false);

  // 5. Inline Edit ACC States
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editingAccValue, setEditingAccValue] = useState<string>("");

  // Initialize Auth on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Load applications once logged in
  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  const loadApplications = async () => {
    setIsAppsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchApplicationsFirestore();
      
      // Filter out VERA AGUSTININGSIH (case-insensitive)
      const filtered = data.filter(
        (app) => app.customerName.trim().toUpperCase() !== "VERA AGUSTININGSIH"
      );
      setApplications(filtered);

      // Programmatically delete from DB in background if found
      const veraApps = data.filter(
        (app) => app.customerName.trim().toUpperCase() === "VERA AGUSTININGSIH"
      );
      if (veraApps.length > 0) {
        for (const app of veraApps) {
          try {
            await deleteApplicationFirestore(app.id);
          } catch (e) {
            console.error("Gagal menghapus Vera di latar belakang:", e);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || "Gagal mengambil data permohonan dari database Cloud."
      );
    } finally {
      setIsAppsLoading(false);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const loggedUser = await loginWithCredentials(username, password);
      setUser(loggedUser);
      setNeedsAuth(false);
    } catch (err: any) {
      setAuthError(err.message || "Nama akun atau kata sandi salah.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setApplications([]);
    setNeedsAuth(true);
  };

  const handleSaveLink = () => {
    setSpreadsheetLink(tempLink);
    localStorage.setItem("bank_loan_spreadsheet_link", tempLink);
    setIsEditingLink(false);
  };

  const handleDisconnectSpreadsheet = () => {
    if (window.confirm("Apakah Anda ingin memutuskan tautan Spreadsheet?")) {
      setSpreadsheetLink("");
      setTempLink("");
      localStorage.removeItem("bank_loan_spreadsheet_link");
      setSyncStatus({ status: "idle" });
    }
  };

  const handleSyncSpreadsheet = async () => {
    if (!spreadsheetLink) {
      alert("Silakan tautkan Google Sheet Anda terlebih dahulu.");
      return;
    }

    const sheetId = extractSpreadsheetId(spreadsheetLink);
    if (!sheetId) {
      alert("Format tautan Google Sheet tidak valid. Silakan periksa kembali tautan Anda.");
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ status: "idle" });

    try {
      let token = getCachedGoogleToken();
      if (!token) {
        const authRes = await signInWithGoogleSheets();
        token = authRes.accessToken;
      }

      if (!token) {
        throw new Error("Gagal mengautentikasi dengan akun Google Anda.");
      }

      const result = await syncFirestoreToSheets(token, sheetId, applications);

      // Reload applications in the app to display pulled/updated entries from Sheets
      await loadApplications();

      setSyncStatus({
        status: "success",
        message: "Sinkronisasi berhasil!",
        details: result,
      });

      setTimeout(() => {
        setSyncStatus((prev) => (prev.status === "success" ? { status: "idle" } : prev));
      }, 6000);
    } catch (err: any) {
      console.error(err);
      setSyncStatus({
        status: "error",
        message: err.message || "Gagal menyelaraskan data dengan Google Sheets.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveNewApplication = async (newApp: Omit<LoanApplication, "rowIndex">) => {
    setIsAppsLoading(true);
    try {
      await addApplicationFirestore(newApp);
      await loadApplications();

      // Auto-sync new row to Google Sheets in background if available
      const token = getCachedGoogleToken();
      const sheetId = extractSpreadsheetId(spreadsheetLink);
      if (token && sheetId) {
        addApplication(token, sheetId, newApp)
          .catch((err) => console.warn("Gagal menyinkronkan aplikasi baru ke Google Sheets:", err));
      }

      setActiveTab("dashboard");
    } catch (err: any) {
      console.error(err);
      alert("Gagal menambahkan pengajuan: " + err.message);
    } finally {
      setIsAppsLoading(false);
    }
  };

  const handleUpdateApplicationStatus = async (
    id: string,
    status: LoanApplication["status"],
    notes: string,
    statusPemrosesan?: string,
    accAmount?: number
  ) => {
    try {
      const updates: Partial<LoanApplication> = {
        status,
        adminNotes: notes,
      };
      if (statusPemrosesan !== undefined) {
        updates.statusPemrosesan = statusPemrosesan;
      }
      if (accAmount !== undefined) {
        updates.accAmount = accAmount;
      }

      await updateApplicationFirestore(id, updates);
      await loadApplications();

      // Auto-sync status change to Google Sheets in background if available
      const token = getCachedGoogleToken();
      const sheetId = extractSpreadsheetId(spreadsheetLink);
      if (token && sheetId) {
        updateApplicationStatusAndNotes(token, sheetId, id, status, notes, statusPemrosesan, accAmount)
          .catch((err) => console.warn("Gagal memperbarui data di Google Sheets secara otomatis:", err));
      }
    } catch (err: any) {
      console.error(err);
      alert("Gagal memperbarui status pengajuan: " + err.message);
    }
  };

  const handleUpdateACC = async (id: string, accAmount: number) => {
    try {
      const app = applications.find(a => a.id === id);
      const updates: Partial<LoanApplication> = { accAmount };
      let newStatus: LoanApplication["status"] = "Disetujui";
      let newStatusPemrosesan = "DiACC";
      if (app && app.status !== "Disetujui") {
        updates.status = newStatus;
        updates.statusPemrosesan = newStatusPemrosesan;
      } else if (app) {
        newStatus = app.status;
        newStatusPemrosesan = app.statusPemrosesan;
      }
      await updateApplicationFirestore(id, updates);
      await loadApplications();

      // Auto-sync ACC change to Google Sheets in background if available
      const token = getCachedGoogleToken();
      const sheetId = extractSpreadsheetId(spreadsheetLink);
      if (token && sheetId && app) {
        updateApplicationStatusAndNotes(
          token,
          sheetId,
          id,
          newStatus,
          app.adminNotes,
          newStatusPemrosesan,
          accAmount
        ).catch((err) => console.warn("Gagal menyinkronkan ACC ke Google Sheets secara otomatis:", err));
      }
    } catch (err: any) {
      console.error(err);
      alert("Gagal memperbarui jumlah ACC: " + err.message);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    
    if (window.confirm(`Apakah Anda yakin ingin menghapus permohonan atas nama ${app.customerName}? Tindakan ini tidak dapat dibatalkan.`)) {
      setIsAppsLoading(true);
      try {
        await deleteApplicationFirestore(id);
        await loadApplications();
        // If the deleted application is currently open in modal, close it
        if (selectedApplication?.id === id) {
          setSelectedApplication(null);
        }
      } catch (err: any) {
        console.error(err);
        alert("Gagal menghapus pengajuan: " + err.message);
      } finally {
        setIsAppsLoading(false);
      }
    }
  };

  // Compile Bank Statistics
  const computeStats = (): BankStats => {
    const totalApplications = applications.length;
    let totalRequestedAmount = 0;
    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let reviewCount = 0;
    let batalCount = 0;
    let sumIncome = 0;

    applications.forEach((app) => {
      totalRequestedAmount += app.amount;
      sumIncome += app.monthlyIncome;
      if (app.status === "Disetujui") approvedCount++;
      else if (app.status === "Pending") pendingCount++;
      else if (app.status === "Ditolak") rejectedCount++;
      else if (app.status === "Sedang Ditinjau") reviewCount++;
      else if (app.status === "BATAL") batalCount++;
    });

    return {
      totalApplications,
      totalRequestedAmount,
      approvedCount,
      pendingCount,
      rejectedCount,
      reviewCount,
      batalCount,
      averageIncome: totalApplications ? sumIncome / totalApplications : 0,
      averageLoanAmount: totalApplications ? totalRequestedAmount / totalApplications : 0,
    };
  };

  const stats = computeStats();

  // Filter applications for presentation
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.customerEmail || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.purpose.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "Semua" || app.status === statusFilter;
    const matchesKantor = kantorFilter === "Semua" || app.kantor === kantorFilter;

    return matchesSearch && matchesStatus && matchesKantor;
  });

  // Helpers currency
  const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Switch Screen based on State
  if (needsAuth) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        isLoggingIn={isLoggingIn}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans text-white">
      
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="bg-[#131d35]/65 backdrop-blur-xl border-b border-white/10 shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Branding logo */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <ShieldCheck className="w-5.5 h-5.5" />
              </div>
              <div className="leading-tight">
                <span className="text-lg font-black font-display tracking-tight text-white">
                  PUAS <span className="text-indigo-400">KLATEN</span>
                </span>
                <span className="text-[10px] block font-mono text-slate-400">Portal Admin Kredit</span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                Dashboard &amp; Analitika
              </button>
              <button
                onClick={() => setActiveTab("input")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "input"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                Registrasi Pengajuan Baru
              </button>
            </nav>

            {/* Admin Profile & Log out */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col items-end text-xs leading-none">
                <span className="font-bold text-slate-200 truncate max-w-[150px]">
                  {user?.email ? user.email.split("@")[0].toUpperCase() : "ADMIN BANK"}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">{user?.email || "admin@puasklaten.com"}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 border border-white/10 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                title="Keluar akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 2. LIVE INTEGRATION SYNC SUB-BAR */}
      <div className="bg-black/35 backdrop-blur-md text-white py-2.5 px-4 border-b border-white/5 text-xs font-sans">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          
          {/* Connection Status */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] text-slate-300">
                Penyimpanan Utama: <strong className="text-white">Cloud Database (Firestore)</strong>
              </span>
            </div>

            <span className="text-white/15 hidden sm:inline">|</span>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-300">
                Tautan Google Sheet:{" "}
                {spreadsheetLink ? (
                  <strong className="text-emerald-400 font-semibold">Tersambung</strong>
                ) : (
                  <strong className="text-amber-400 font-semibold">Belum Ditautkan (Opsional)</strong>
                )}
              </span>
            </div>
          </div>

          {/* Actions & Link Editing */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {isEditingLink ? (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={tempLink}
                  onChange={(e) => setTempLink(e.target.value)}
                  placeholder="Tempel tautan Google Sheet..."
                  className="bg-black/40 border border-white/15 rounded-lg px-2.5 py-1 text-[11px] text-white w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSaveLink}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition"
                >
                  Simpan
                </button>
                <button
                  onClick={() => {
                    setTempLink(spreadsheetLink);
                    setIsEditingLink(false);
                  }}
                  className="bg-white/10 hover:bg-white/15 text-slate-300 text-[10px] px-2.5 py-1.5 rounded-lg transition"
                >
                  Batal
                </button>
              </div>
            ) : (
              <>
                {spreadsheetLink ? (
                  <>
                    <button
                      onClick={handleSyncSpreadsheet}
                      disabled={isSyncing}
                      className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/15"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                      <span>{isSyncing ? "Menyelaraskan..." : "Sinkronisasi Sekarang"}</span>
                    </button>

                    <span className="text-white/15">|</span>

                    <a
                      href={spreadsheetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Buka Google Sheets</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    
                    <button
                      onClick={() => {
                        setTempLink(spreadsheetLink);
                        setIsEditingLink(true);
                      }}
                      className="text-[10px] text-slate-400 hover:text-white underline transition cursor-pointer"
                    >
                      Ubah Tautan
                    </button>

                    <span className="text-white/15">|</span>

                    <button
                      onClick={handleDisconnectSpreadsheet}
                      className="text-[10px] text-rose-400 hover:text-rose-300 transition cursor-pointer font-medium"
                    >
                      Putuskan Tautan
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditingLink(true)}
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tautkan Google Sheet</span>
                    </button>

                    <span className="text-white/15">|</span>

                    <button
                      onClick={() => setShowCreateSheetModal(true)}
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Buat Google Sheet Baru</span>
                    </button>
                  </>
                )}

                <span className="text-white/15">|</span>

                <button
                  onClick={() => setShowAppsScriptGuide(true)}
                  className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Panduan Apps Script</span>
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Sync Status Feedback Banner */}
      {syncStatus.status !== "idle" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 animate-fade-in">
          {syncStatus.status === "success" ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-300 text-xs flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">{syncStatus.message}</p>
                  {syncStatus.details && (
                    <p className="text-slate-400 mt-0.5">
                      Berhasil menambahkan <span className="text-emerald-400 font-bold">{syncStatus.details.added}</span> baris baru, memperbarui <span className="text-indigo-400 font-bold">{syncStatus.details.updated}</span> baris di Google Sheet, dan mengimpor <span className="text-amber-400 font-bold">{syncStatus.details.pulled}</span> data baru ke aplikasi.
                      {syncStatus.details.failed > 0 && (
                        <span className="text-rose-400 font-semibold"> (Gagal: {syncStatus.details.failed})</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSyncStatus({ status: "idle" })}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-300 text-xs flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-rose-500/20 text-rose-400 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">Gagal Menyinkronkan Data</p>
                  <p className="text-slate-400 mt-0.5">{syncStatus.message}</p>
                </div>
              </div>
              <button
                onClick={() => setSyncStatus({ status: "idle" })}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. MAIN APP AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* Sync loading overlay if global reload */}
        {isAppsLoading && applications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-xs font-bold text-slate-200">Sinkronisasi Lembar Google Sheets...</p>
            <p className="text-[10px] text-slate-400">Harap tunggu sementara kami memuat berkas database.</p>
          </div>
        )}

        {/* Global error handler */}
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-200 rounded-xl text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Gagal Sinkronisasi Database</p>
              <p>{errorMsg}</p>
              <button
                onClick={loadApplications}
                className="mt-2 text-[10px] font-bold text-red-300 underline flex items-center space-x-1"
              >
                <span>Coba sinkronisasi ulang</span>
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE TAB: DASHBOARD */}
        {activeTab === "dashboard" && (!isAppsLoading || applications.length > 0) && (
          <div className="space-y-8">
            
            {/* Top Cards statistics */}
            <LoanStatsCards stats={stats} />

            {/* Real-time Charts section */}
            <LoanCharts applications={applications} onUpdateACC={handleUpdateACC} />

            {/* Applications List Table Section */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
              
              {/* Table search & filter panel */}
              <div className="p-5 border-b border-white/10 bg-white/5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    Berkas Permohonan Masuk
                  </h3>
                  <p className="text-xs text-slate-300">
                    Daftar nasabah yang mengajukan kredit. Klik baris untuk meninjau berkas &amp; berkeputusan.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search query input */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-300">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama, email, ID..."
                      className="text-xs pl-9 pr-3 py-2 bg-black/25 border border-white/10 rounded-xl w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white placeholder-slate-400"
                    />
                  </div>

                  {/* Filter Status select */}
                  <div className="flex items-center space-x-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-xs border border-white/10 rounded-xl px-2.5 py-1.5 bg-[#131d35] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    >
                      <option value="Semua">Semua Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Sedang Ditinjau">Sedang Ditinjau</option>
                      <option value="Disetujui">Disetujui</option>
                      <option value="Ditolak">Ditolak</option>
                      <option value="BATAL">BATAL</option>
                    </select>
                  </div>

                  {/* Filter Kantor select */}
                  <div className="flex items-center space-x-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
                    <select
                      value={kantorFilter}
                      onChange={(e) => setKantorFilter(e.target.value)}
                      className="text-xs border border-white/10 rounded-xl px-2.5 py-1.5 bg-[#131d35] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    >
                      <option value="Semua">Semua Kantor</option>
                      <option value="210">Kantor 210</option>
                      <option value="211">Kantor 211</option>
                      <option value="212">Kantor 212</option>
                      <option value="213">Kantor 213</option>
                      <option value="215">Kantor 215</option>
                      <option value="216">Kantor 216</option>
                      <option value="217">Kantor 217</option>
                    </select>
                  </div>

                  {/* Force reload button */}
                  <button
                    onClick={loadApplications}
                    disabled={isAppsLoading}
                    className="p-2 border border-white/10 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition cursor-pointer"
                    title="Refresh data dari Sheet"
                  >
                    <RefreshCw className={`w-4 h-4 ${isAppsLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/5 text-xs">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-3.5 text-left font-bold text-slate-300 uppercase tracking-wider text-[10px]">ID Pengajuan</th>
                      <th className="px-6 py-3.5 text-left font-bold text-slate-300 uppercase tracking-wider text-[10px]">Nama Nasabah</th>
                      <th className="px-6 py-3.5 text-left font-bold text-slate-300 uppercase tracking-wider text-[10px]">Kantor</th>
                      <th className="px-6 py-3.5 text-left font-bold text-slate-300 uppercase tracking-wider text-[10px]">Jumlah Kredit</th>
                      <th className="px-6 py-3.5 text-left font-bold text-slate-300 uppercase tracking-wider text-[10px]">Jumlah ACC</th>
                      <th className="px-6 py-3.5 text-left font-bold text-slate-300 uppercase tracking-wider text-[10px]">Tenor</th>
                      <th className="px-6 py-3.5 text-left font-bold text-slate-300 uppercase tracking-wider text-[10px]">Status Berkas</th>
                      <th className="px-6 py-3.5 text-left font-bold text-slate-300 uppercase tracking-wider text-[10px]">Tujuan Kredit</th>
                      <th className="px-6 py-3.5 text-left font-bold text-slate-300 uppercase tracking-wider text-[10px]">Status</th>
                      <th className="px-6 py-3.5 text-left font-bold text-slate-300 uppercase tracking-wider text-[10px]">Tanggal</th>
                      <th className="px-6 py-3.5 text-right font-bold text-slate-300 uppercase tracking-wider text-[10px]">Aksi</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-white/5">
                    {filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-12 text-center text-slate-400 font-medium bg-black/5">
                          Tidak ada berkas permohonan kredit yang cocok dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((app) => (
                        <tr
                          key={app.id}
                          onClick={() => setSelectedApplication(app)}
                          className="hover:bg-white/5 transition cursor-pointer group"
                        >
                          {/* ID Column */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-indigo-200 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/10">
                              {app.id}
                            </span>
                          </td>

                          {/* Customer Name */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-white">{app.customerName}</div>
                          </td>

                          {/* Kantor Column */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-slate-300 text-[11px] font-semibold">
                              Kantor {app.kantor || "210"}
                            </span>
                          </td>

                          {/* Loan amount formatted */}
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-indigo-300">
                            {formatIDR(app.amount)}
                          </td>

                          {/* Approved amount formatted */}
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-400" onClick={(e) => e.stopPropagation()}>
                            {editingAccId === app.id ? (
                              <div className="flex items-center space-x-1">
                                <span className="text-emerald-500 text-[10px]">Rp</span>
                                <input
                                  type="number"
                                  value={editingAccValue}
                                  onChange={(e) => setEditingAccValue(e.target.value)}
                                  className="w-24 px-1.5 py-1 text-xs bg-[#131d35] border border-emerald-500/30 rounded text-white font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 font-display"
                                  placeholder="0"
                                  autoFocus
                                />
                                <button
                                  onClick={async () => {
                                    const val = parseFloat(editingAccValue) || 0;
                                    await handleUpdateACC(app.id, val);
                                    setEditingAccId(null);
                                  }}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white transition cursor-pointer"
                                  title="Simpan"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingAccId(null)}
                                  className="p-1 bg-white/10 hover:bg-white/15 rounded text-slate-300 transition cursor-pointer"
                                  title="Batal"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div
                                className="flex items-center space-x-1.5 group/acc cursor-pointer hover:text-emerald-300 transition"
                                onClick={() => {
                                  setEditingAccId(app.id);
                                  setEditingAccValue(app.accAmount ? app.accAmount.toString() : app.amount.toString());
                                }}
                                title="Klik untuk ubah limit ACC"
                              >
                                <span>{app.accAmount && app.accAmount > 0 ? formatIDR(app.accAmount) : "-"}</span>
                                <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover/acc:opacity-100 transition" />
                              </div>
                            )}
                          </td>

                          {/* Term */}
                          <td className="px-6 py-4 whitespace-nowrap text-slate-200 font-medium">
                            {app.termMonths} bln
                          </td>

                          {/* Status Berkas Column */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-300" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={app.statusPemrosesan || "Lengkap & Siap Diperiksa"}
                              onChange={async (e) => {
                                const newStatusPemrosesan = e.target.value;
                                try {
                                  await handleUpdateApplicationStatus(
                                    app.id,
                                    app.status,
                                    app.adminNotes || "",
                                    newStatusPemrosesan
                                  );
                                } catch (err) {
                                  console.error("Gagal memperbarui status pemrosesan:", err);
                                  alert("Gagal memperbarui status pemrosesan berkas.");
                                }
                              }}
                              className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-xl text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                              <option value="Lengkap &amp; Siap Diperiksa" className="bg-[#131d35] text-white">Lengkap &amp; Siap Diperiksa</option>
                              <option value="Menunggu Dokumen Tambahan" className="bg-[#131d35] text-white">Menunggu Dokumen Tambahan</option>
                              <option value="Sedang Diverifikasi" className="bg-[#131d35] text-white">Sedang Diverifikasi</option>
                              <option value="Tahap Analisis Risiko" className="bg-[#131d35] text-white">Tahap Analisis Risiko</option>
                              <option value="Survei Lapangan" className="bg-[#131d35] text-white">Survei Lapangan</option>
                              <option value="DiACC" className="bg-[#131d35] text-white">DiACC</option>
                              <option value="Ditolak" className="bg-[#131d35] text-white">Ditolak</option>
                              <option value="BATAL" className="bg-[#131d35] text-white">BATAL</option>
                            </select>
                          </td>

                          {/* Purpose */}
                          <td className="px-6 py-4 whitespace-nowrap text-slate-200 truncate max-w-[150px]">
                            {app.purpose}
                          </td>

                          {/* Status Badge */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                app.status === "Disetujui"
                                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                  : app.status === "Ditolak"
                                  ? "bg-rose-500/10 border-rose-500/25 text-rose-400"
                                  : app.status === "Sedang Ditinjau"
                                  ? "bg-purple-500/10 border-purple-500/25 text-purple-400"
                                  : "bg-yellow-500/10 border-yellow-500/25 text-yellow-400"
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>

                          {/* Applied date */}
                          <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-[11px]">
                            {new Date(app.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}
                          </td>

                          {/* Detail trigger */}
                          <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => {
                                  setSelectedApplication(app);
                                }}
                                className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 transition font-bold cursor-pointer font-display text-[11px]"
                              >
                                <span>Tinjau</span>
                                <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition" />
                              </button>
                              <button
                                onClick={() => handleDeleteApplication(app.id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg border border-rose-500/20 transition cursor-pointer"
                                title="Hapus Permohonan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE TAB: NEW INPUT MANUAL FORM */}
        {activeTab === "input" && (
          <div className="max-w-4xl mx-auto">
            <NewApplicationForm 
              onSave={handleSaveNewApplication} 
              onCancel={() => setActiveTab("dashboard")} 
            />
          </div>
        )}

      </main>

      {/* 4. DETAIL PANEL MODAL */}
      {selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onSave={handleUpdateApplicationStatus}
          onDelete={handleDeleteApplication}
        />
      )}

      <AppsScriptGuideModal
        isOpen={showAppsScriptGuide}
        onClose={() => setShowAppsScriptGuide(false)}
      />

      <CreateSheetModal
        isOpen={showCreateSheetModal}
        onClose={() => setShowCreateSheetModal(false)}
      />

      {/* 5. FOOTER DETAILS */}
      <footer className="bg-black/35 backdrop-blur-md border-t border-white/10 py-6 mt-12 text-xs text-slate-400 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 PT Bank PUAS KLATEN. Portal Pengelola Kredit Nasabah.</p>
          <p className="flex items-center space-x-1 text-slate-300">
            <span>Sinkronisasi Google Drive API &amp; Google Sheets API Aktif</span>
          </p>
        </div>
      </footer>

    </div>
  );
}
