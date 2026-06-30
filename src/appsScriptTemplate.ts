export const KODE_GS_CONTENT = `/**
 * PT Bank PUAS KLATEN
 * Google Apps Script - Portal Pengelola Kredit Nasabah
 * 
 * Unggah berkas ini ke Google Apps Script editor (https://script.google.com) 
 * pada Spreadsheet yang terhubung.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('PUAS KLATEN Portal')
    .addItem('Buka Panel Pengaju', 'showSidebar')
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('PUAS KLATEN - Portal Kredit')
    .setWidth(480);
  SpreadsheetApp.getUi().showSidebar(html);
}

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('PUAS KLATEN - Portal Kredit')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Permohonan Pinjaman");
  if (!sheet) {
    sheet = ss.getSheets()[0];
  }
  return sheet;
}

/**
 * Membaca data pengajuan dari spreadsheet (Kolom A s/d Kolom N)
 */
function fetchApplicationsGS() {
  try {
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return [];
    }
    
    const values = sheet.getRange(2, 1, lastRow - 1, 14).getValues();
    return values.map((row, index) => {
      return {
        rowIndex: index + 2,
        id: row[0] || "",
        customerName: row[1] || "",
        customerEmail: row[2] || "",
        phoneNumber: row[3] || "",
        amount: Number(row[4]) || 0,
        termMonths: Number(row[5]) || 0,
        purpose: row[6] || "",
        monthlyIncome: Number(row[7]) || 0,
        status: row[8] || "Pending",
        createdAt: row[9] || "",
        adminNotes: row[10] || "",
        kantor: row[11] || "210",
        statusPemrosesan: row[12] || "Lengkap & Siap Diperiksa",
        accAmount: Number(row[13]) || 0
      };
    });
  } catch (err) {
    throw new Error("Gagal mengambil data: " + err.message);
  }
}

/**
 * Menambahkan registrasi pengajuan permohonan baru
 */
function addApplicationGS(app) {
  try {
    const sheet = getSheet();
    
    // Auto-generate ID if empty
    const id = app.id || "KRD-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000);
    const createdAt = app.createdAt || new Date().toISOString();
    
    sheet.appendRow([
      id,
      app.customerName || "",
      app.customerEmail || "",
      app.phoneNumber || "",
      Number(app.amount) || 0,
      Number(app.termMonths) || 12,
      app.purpose || "",
      Number(app.monthlyIncome) || 0,
      app.status || "Pending",
      createdAt,
      app.adminNotes || "",
      app.kantor || "210",
      app.statusPemrosesan || "Lengkap & Siap Diperiksa",
      Number(app.accAmount) || 0
    ]);
    
    return { success: true, id: id };
  } catch (err) {
    throw new Error("Gagal menambah data: " + err.message);
  }
}

/**
 * Memperbarui status keputusan kredit & status pemrosesan berkas secara instan
 */
function updateApplicationGS(rowIndex, status, notes, statusPemrosesan, accAmount) {
  try {
    const sheet = getSheet();
    rowIndex = Number(rowIndex);
    
    if (status) {
      sheet.getRange(rowIndex, 9).setValue(status); // Column I
    }
    if (notes !== undefined && notes !== null) {
      sheet.getRange(rowIndex, 11).setValue(notes); // Column K
    }
    if (statusPemrosesan) {
      sheet.getRange(rowIndex, 13).setValue(statusPemrosesan); // Column M
    }
    if (accAmount !== undefined && accAmount !== null) {
      sheet.getRange(rowIndex, 14).setValue(Number(accAmount) || 0); // Column N
    }
    return { success: true };
  } catch (err) {
    throw new Error("Gagal memperbarui data: " + err.message);
  }
}`;

export const INDEX_HTML_CONTENT = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>PUAS KLATEN - Portal Kredit</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #0b1120;
    }
    .font-display {
      font-family: 'Space Grotesk', sans-serif;
    }
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  </style>
</head>
<body class="text-slate-100 min-h-screen flex flex-col">

  <!-- HEADER -->
  <header class="bg-[#0f172a] border-b border-white/10 px-5 py-4 flex items-center justify-between shadow-lg">
    <div class="flex items-center space-x-3">
      <div class="bg-indigo-600 text-white p-2 rounded-xl flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <div>
        <h1 class="text-sm font-extrabold font-display tracking-tight text-white uppercase">
          PUAS <span class="text-indigo-400">KLATEN</span>
        </h1>
        <p class="text-[9px] text-slate-400 font-mono tracking-wider">PORTAL SINKRONISASI SPREADSHEET</p>
      </div>
    </div>
    <div class="text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg text-indigo-300 font-semibold font-mono">
      APPS SCRIPT v2.5
    </div>
  </header>

  <!-- NAVIGATION TABS -->
  <div class="bg-black/20 border-b border-white/5 flex">
    <button onclick="switchTab('tab-list')" id="btn-list" class="flex-1 py-3 text-center text-xs font-bold border-b-2 border-indigo-500 text-indigo-400 transition">
      Daftar Pengajuan
    </button>
    <button onclick="switchTab('tab-register')" id="btn-register" class="flex-1 py-3 text-center text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-white transition">
      Registrasi Pengajuan Baru
    </button>
  </div>

  <!-- MAIN CONTENT CONTAINER -->
  <main class="flex-1 p-5 max-w-5xl mx-auto w-full space-y-6">
    
    <div id="notif-banner" class="hidden p-4 rounded-xl border text-xs font-medium flex items-start space-x-3 transition">
      <div id="notif-icon" class="flex-shrink-0 mt-0.5"></div>
      <div id="notif-message" class="flex-1 leading-relaxed"></div>
      <button onclick="hideNotif()" class="text-slate-400 hover:text-white">&times;</button>
    </div>

    <!-- TAB 1: LIST PENGAJUAN -->
    <div id="tab-list" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="relative md:col-span-1">
          <input type="text" id="search-input" oninput="filterData()" placeholder="Cari Nama / ID Pengajuan..." 
                 class="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white">
        </div>
        <div>
          <select id="filter-kantor" onchange="filterData()" 
                  class="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white font-medium cursor-pointer">
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
        <div>
          <select id="filter-status" onchange="filterData()" 
                  class="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white font-medium cursor-pointer">
            <option value="Semua">Semua Keputusan</option>
            <option value="Pending">Pending</option>
            <option value="Sedang Ditinjau">Sedang Ditinjau</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
            <option value="BATAL">BATAL</option>
          </select>
        </div>
      </div>

      <div id="list-loader" class="py-12 text-center space-y-3">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
        <p class="text-xs text-slate-400 font-medium">Memuat data dari Spreadsheet...</p>
      </div>

      <div id="table-container" class="hidden overflow-x-auto rounded-xl border border-white/10 bg-[#0f172a] shadow-xl">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr class="bg-white/5 border-b border-white/10 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              <th class="px-4 py-3">Nama Nasabah</th>
              <th class="px-4 py-3">Kantor</th>
              <th class="px-4 py-3">Jumlah Kredit</th>
              <th class="px-4 py-3">Jumlah ACC</th>
              <th class="px-4 py-3">Tenor (Bunga)</th>
              <th class="px-4 py-3">Status Keputusan</th>
              <th class="px-4 py-3">Status Pemrosesan</th>
              <th class="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody id="application-rows" class="divide-y divide-white/5 text-xs text-slate-200"></tbody>
        </table>
        <div id="empty-state" class="hidden py-12 text-center text-slate-400 text-xs font-medium bg-black/10">
          Tidak ada berkas permohonan kredit yang cocok dengan filter.
        </div>
      </div>
    </div>

    <!-- TAB 2: REGISTRASI -->
    <div id="tab-register" class="hidden">
      <form id="new-app-form" onsubmit="submitForm(event)" class="bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
        <div class="border-b border-white/5 pb-4">
          <h2 class="text-sm font-extrabold font-display text-white tracking-tight uppercase">REGISTRASI PERMOHONAN PINJAMAN</h2>
          <p class="text-xs text-slate-400">Pastikan informasi diisi lengkap dan valid.</p>
        </div>

        <div class="space-y-4">
          <h3 class="text-xs font-bold text-indigo-400 uppercase tracking-widest">1. Data Diri Pemohon</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1.5">Nama Lengkap</label>
              <input type="text" id="form-name" required placeholder="Contoh: Budi Santoso" class="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1.5">Nomor Handphone (WhatsApp)</label>
              <input type="tel" id="form-phone" required placeholder="08XXXXXXXXXX" class="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white">
            </div>
            <div class="md:col-span-2">
              <label class="block text-[11px] font-semibold text-slate-300 mb-1.5">Pendapatan Bersih Bulanan (IDR)</label>
              <input type="number" id="form-income" required oninput="calculateEstimates()" placeholder="Contoh: 7500000" class="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white">
            </div>
          </div>
        </div>

        <div class="space-y-4 pt-4 border-t border-white/5">
          <h3 class="text-xs font-bold text-indigo-400 uppercase tracking-widest">2. Detail Kredit &amp; Rencana Keuangan</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1.5">Jumlah Kredit (IDR)</label>
              <input type="number" id="form-amount" required oninput="calculateEstimates()" placeholder="Contoh: 50000000" class="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1.5">Tenor Angsuran (Bulan)</label>
              <select id="form-term" onchange="calculateEstimates()" class="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white font-medium cursor-pointer">
                <option value="6">6 Bulan</option>
                <option value="12" selected>12 Bulan</option>
                <option value="18">18 Bulan</option>
                <option value="24">24 Bulan</option>
                <option value="36">36 Bulan</option>
                <option value="48">48 Bulan</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1.5">Tujuan Penggunaan Kredit</label>
              <select id="form-purpose" onchange="checkPurposeCustom()" class="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white font-medium cursor-pointer">
                <option value="Modal Usaha">Modal Usaha / Produktif</option>
                <option value="Renovasi Rumah">Renovasi Rumah</option>
                <option value="Pembelian Kendaraan">Pembelian Kendaraan</option>
                <option value="Pendidikan">Biaya Pendidikan</option>
                <option value="Kebutuhan Konsumtif">Kebutuhan Konsumtif Lainnya</option>
                <option value="Lainnya">Lainnya (Sebutkan secara manual)</option>
              </select>
            </div>
            <div id="custom-purpose-container" class="hidden">
              <label class="block text-[11px] font-semibold text-slate-300 mb-1.5">Sebutkan Tujuan Lainnya</label>
              <input type="text" id="form-custom-purpose" placeholder="Tuliskan tujuan spesifik" class="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white">
            </div>
          </div>
        </div>

        <div class="space-y-4 pt-4 border-t border-white/5">
          <h3 class="text-xs font-bold text-indigo-400 uppercase tracking-widest">3. Distribusi Kantor &amp; Dokumen</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1.5">Kantor / Cabang Pengaju</label>
              <select id="form-kantor" class="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white font-medium cursor-pointer">
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
              <label class="block text-[11px] font-semibold text-slate-300 mb-1.5">Status Pemrosesan Berkas Awal</label>
              <select id="form-status-berkas" class="w-full text-xs px-3.5 py-2.5 bg-[#131d35] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white font-medium cursor-pointer">
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
        </div>

        <div id="advisory-box" class="hidden p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 space-y-2 text-xs">
          <div class="flex items-center space-x-2 font-bold text-indigo-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Perhitungan Estimasi Kredit &amp; Kemampuan Bayar PUAS KLATEN</span>
          </div>
          <div class="grid grid-cols-2 gap-4 text-slate-300 pt-1">
            <div>
              <p class="text-[10px] text-slate-400 uppercase">Cicilan Pokok Bulanan</p>
              <p class="font-semibold text-white" id="adv-principal">Rp0</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 uppercase">Cicilan Bunga Bulanan</p>
              <p class="font-semibold text-white" id="adv-interest">Rp0 <span class="text-[9px] font-normal text-indigo-400">(24% flat/tahun)</span></p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 uppercase">Total Estimasi Cicilan</p>
              <p class="font-bold text-indigo-300 text-sm" id="adv-total-installment">Rp0</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 uppercase">Rasio Cicilan-Pendapatan (DSR)</p>
              <p class="font-bold text-white text-sm" id="adv-dsr">0%</p>
            </div>
          </div>
          <div id="dsr-alert" class="p-2.5 rounded-lg text-[11px] font-medium mt-2 hidden font-sans"></div>
        </div>

        <div class="flex justify-end pt-4 border-t border-white/5">
          <button type="submit" id="submit-btn" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition cursor-pointer">
            Daftarkan Permohonan
          </button>
        </div>
      </form>
    </div>
  </main>

  <footer class="bg-[#0f172a] border-t border-white/10 py-5 text-center text-[11px] text-slate-500 font-medium">
    <p>© 2026 PT Bank PUAS KLATEN. Sistem Ekstensi Google Apps Script Terintegrasi.</p>
  </footer>

  <script>
    let allApplications = [];

    window.onload = function() {
      loadSpreadsheetData();
    };

    function showNotif(message, type = "success") {
      const banner = document.getElementById("notif-banner");
      const text = document.getElementById("notif-message");
      const icon = document.getElementById("notif-icon");

      text.innerHTML = message;
      banner.className = "p-4 rounded-xl border text-xs font-medium flex items-start space-x-3 transition ";

      if (type === "success") {
        banner.className += "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
        icon.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>\`;
      } else {
        banner.className += "bg-rose-500/10 border-rose-500/20 text-rose-300";
        icon.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>\`;
      }

      banner.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function hideNotif() {
      document.getElementById("notif-banner").classList.add("hidden");
    }

    // Tab switcher
    function switchTab(tabId) {
      document.getElementById("tab-list").classList.add("hidden");
      document.getElementById("tab-register").classList.add("hidden");
      document.getElementById("btn-list").className = "flex-1 py-3 text-center text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-white transition";
      document.getElementById("btn-register").className = "flex-1 py-3 text-center text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-white transition";

      document.getElementById(tabId).classList.remove("hidden");
      if (tabId === "tab-list") {
        document.getElementById("btn-list").className = "flex-1 py-3 text-center text-xs font-bold border-b-2 border-indigo-500 text-indigo-400 transition";
        loadSpreadsheetData();
      } else {
        document.getElementById("btn-register").className = "flex-1 py-3 text-center text-xs font-bold border-b-2 border-indigo-500 text-indigo-400 transition";
      }
    }

    function loadSpreadsheetData() {
      document.getElementById("list-loader").classList.remove("hidden");
      document.getElementById("table-container").classList.add("hidden");
      document.getElementById("empty-state").classList.add("hidden");

      if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(data) {
            allApplications = data || [];
            renderTable(allApplications);
            document.getElementById("list-loader").classList.add("hidden");
            document.getElementById("table-container").classList.remove("hidden");
          })
          .withFailureHandler(function(err) {
            console.error(err);
            showNotif("Gagal terhubung dengan Spreadsheet: " + err.message, "error");
            document.getElementById("list-loader").classList.add("hidden");
          })
          .fetchApplicationsGS();
      } else {
        setTimeout(() => {
          allApplications = [
            { rowIndex: 2, id: "KRD-2026-910243", customerName: "Andi Wijaya", customerEmail: "", phoneNumber: "081234567890", amount: 25000000, termMonths: 12, purpose: "Modal Usaha", monthlyIncome: 8000000, status: "Pending", createdAt: "2026-06-29T10:00:00Z", adminNotes: "Menunggu survei", kantor: "210", statusPemrosesan: "Lengkap & Siap Diperiksa", accAmount: 0 },
            { rowIndex: 3, id: "KRD-2026-124950", customerName: "Siti Rahma", customerEmail: "", phoneNumber: "085712345678", amount: 75000000, termMonths: 24, purpose: "Renovasi Rumah", monthlyIncome: 12000000, status: "Sedang Ditinjau", createdAt: "2026-06-28T14:30:00Z", adminNotes: "DSR aman", kantor: "212", statusPemrosesan: "Survei Lapangan", accAmount: 50000000 }
          ];
          renderTable(allApplications);
          document.getElementById("list-loader").classList.add("hidden");
          document.getElementById("table-container").classList.remove("hidden");
        }, 1000);
      }
    }

    function formatIDR(num) {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(num);
    }

    function renderTable(apps) {
      const tbody = document.getElementById("application-rows");
      tbody.innerHTML = "";

      if (apps.length === 0) {
        document.getElementById("empty-state").classList.remove("hidden");
        return;
      }
      document.getElementById("empty-state").classList.add("hidden");

      apps.forEach(app => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-white/5 transition border-b border-white/5 align-middle";

        const statusOptions = \`
          <select onchange="updateApplication(\${app.rowIndex}, this.value, null, null, null)" class="bg-[#131d35] border border-white/10 rounded-xl text-[11px] font-semibold p-1 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer">
            <option value="Pending" \${app.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Sedang Ditinjau" \${app.status === 'Sedang Ditinjau' ? 'selected' : ''}>Ditinjau</option>
            <option value="Disetujui" \${app.status === 'Disetujui' ? 'selected' : ''}>Disetujui</option>
            <option value="Ditolak" \${app.status === 'Ditolak' ? 'selected' : ''}>Ditolak</option>
            <option value="BATAL" \${app.status === 'BATAL' ? 'selected' : ''}>BATAL</option>
          </select>
        \`;

        const statusPemrosesanOptions = \`
          <select onchange="updateApplication(\${app.rowIndex}, null, null, this.value, null)" class="bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 rounded-xl text-[11px] font-semibold p-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer">
            <option value="Lengkap & Siap Diperiksa" \${app.statusPemrosesan === 'Lengkap & Siap Diperiksa' ? 'selected' : ''}>Lengkap</option>
            <option value="Menunggu Dokumen Tambahan" \${app.statusPemrosesan === 'Menunggu Dokumen Tambahan' ? 'selected' : ''}>Menunggu Dokumen</option>
            <option value="Sedang Diverifikasi" \${app.statusPemrosesan === 'Sedang Diverifikasi' ? 'selected' : ''}>Verifikasi</option>
            <option value="Tahap Analisis Risiko" \${app.statusPemrosesan === 'Tahap Analisis Risiko' ? 'selected' : ''}>Analisis Risiko</option>
            <option value="Survei Lapangan" \${app.statusPemrosesan === 'Survei Lapangan' ? 'selected' : ''}>Survei Lapangan</option>
            <option value="DiACC" \${app.statusPemrosesan === 'DiACC' ? 'selected' : ''}>DiACC</option>
            <option value="Ditolak" \${app.statusPemrosesan === 'Ditolak' ? 'selected' : ''}>Ditolak</option>
            <option value="BATAL" \${app.statusPemrosesan === 'BATAL' ? 'selected' : ''}>BATAL</option>
          </select>
        \`;

        const accText = app.accAmount && app.accAmount > 0 ? formatIDR(app.accAmount) : "-";

        tr.innerHTML = \`
          <td class="px-4 py-3.5">
            <div class="font-bold text-white text-[13px]">\${app.customerName}</div>
            <div class="text-[10px] text-slate-400 font-mono mt-0.5">\${app.id}</div>
          </td>
          <td class="px-4 py-3.5">
            <span class="bg-white/5 border border-white/10 px-2 py-1 rounded text-slate-300 text-[10px] font-semibold">
              Kntr \${app.kantor || '210'}
            </span>
          </td>
          <td class="px-4 py-3.5 font-bold text-indigo-300">\${formatIDR(app.amount)}</td>
          <td class="px-4 py-3.5 font-bold text-emerald-400">\${accText}</td>
          <td class="px-4 py-3.5">
            <div class="text-white">\${app.termMonths} bln</div>
            <div class="text-[9px] text-slate-400 font-medium">Bunga 24%/thn</div>
          </td>
          <td class="px-4 py-3.5">\${statusOptions}</td>
          <td class="px-4 py-3.5">\${statusPemrosesanOptions}</td>
          <td class="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
            <button onclick="editNotesPrompt(\${app.rowIndex}, '\${app.adminNotes.replace(/'/g, "\\\\'")}')" class="bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold px-2.5 py-1.5 rounded-lg text-slate-300 transition cursor-pointer">Catatan</button>
            <button onclick="editAccPrompt(\${app.rowIndex}, \${app.accAmount || 0})" class="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-[10px] font-bold px-2.5 py-1.5 rounded-lg text-emerald-300 transition cursor-pointer">ACC</button>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function filterData() {
      const q = document.getElementById("search-input").value.toLowerCase();
      const kantor = document.getElementById("filter-kantor").value;
      const status = document.getElementById("filter-status").value;

      const filtered = allApplications.filter(app => {
        const matchesSearch = app.customerName.toLowerCase().includes(q) || 
                              app.id.toLowerCase().includes(q);
        const matchesKantor = kantor === "Semua" || app.kantor === kantor;
        const matchesStatus = status === "Semua" || app.status === status;

        return matchesSearch && matchesKantor && matchesStatus;
      });

      renderTable(filtered);
    }

    function updateApplication(rowIndex, status, notes, statusPemrosesan, accAmount) {
      if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function() {
            showNotif("Berhasil sinkronisasi pembaruan berkas ke Google Sheets!");
            loadSpreadsheetData();
          })
          .withFailureHandler(function(err) {
            console.error(err);
            showNotif("Gagal memperbarui berkas: " + err.message, "error");
          })
          .updateApplicationGS(rowIndex, status, notes, statusPemrosesan, accAmount);
      } else {
        const idx = allApplications.findIndex(a => a.rowIndex === rowIndex);
        if (idx > -1) {
          if (status) allApplications[idx].status = status;
          if (notes !== null) allApplications[idx].adminNotes = notes;
          if (statusPemrosesan) allApplications[idx].statusPemrosesan = statusPemrosesan;
          if (accAmount !== null) allApplications[idx].accAmount = accAmount;
          showNotif("MOCK: Berhasil memperbarui data di baris " + rowIndex);
          filterData();
        }
      }
    }

    function editNotesPrompt(rowIndex, currentNotes) {
      const newNotes = prompt("Masukkan Catatan Keputusan / Administrasi Baru:", currentNotes || "");
      if (newNotes !== null) {
        updateApplication(rowIndex, null, newNotes, null, null);
      }
    }

    function editAccPrompt(rowIndex, currentAcc) {
      const newAcc = prompt("Masukkan Jumlah ACC Baru (Angka saja):", currentAcc || "0");
      if (newAcc !== null) {
        const val = parseFloat(newAcc);
        if (!isNaN(val)) {
          updateApplication(rowIndex, "Disetujui", null, "DiACC", val);
        }
      }
    }

    function checkPurposeCustom() {
      const val = document.getElementById("form-purpose").value;
      const container = document.getElementById("custom-purpose-container");
      if (val === "Lainnya") {
        container.classList.remove("hidden");
        document.getElementById("form-custom-purpose").required = true;
      } else {
        container.classList.add("hidden");
        document.getElementById("form-custom-purpose").required = false;
      }
    }

    function calculateEstimates() {
      const amount = parseFloat(document.getElementById("form-amount").value) || 0;
      const term = parseInt(document.getElementById("form-term").value) || 12;
      const income = parseFloat(document.getElementById("form-income").value) || 0;

      const advisoryBox = document.getElementById("advisory-box");

      if (amount <= 0 || income <= 0) {
        advisoryBox.classList.add("hidden");
        return;
      }

      advisoryBox.classList.remove("hidden");

      const monthlyRate = 0.02;
      const principal = amount / term;
      const interest = amount * monthlyRate;
      const totalInstallment = principal + interest;
      const dsr = (totalInstallment / income) * 100;

      document.getElementById("adv-principal").innerText = formatIDR(principal);
      document.getElementById("adv-interest").innerText = formatIDR(interest);
      document.getElementById("adv-total-installment").innerText = formatIDR(totalInstallment);
      document.getElementById("adv-dsr").innerText = dsr.toFixed(1) + "%";

      const alertDiv = document.getElementById("dsr-alert");
      alertDiv.classList.remove("hidden");

      if (dsr > 40) {
        alertDiv.className = "p-2.5 rounded-lg text-[11px] font-semibold mt-2 bg-rose-500/10 border border-rose-500/20 text-rose-300";
        alertDiv.innerText = "RISIKO TINGGI: Rasio angsuran melebihi batas aman 40% dari pendapatan bulanan. Permohonan kemungkinan membutuhkan jaminan atau evaluasi manual.";
      } else if (dsr > 30) {
        alertDiv.className = "p-2.5 rounded-lg text-[11px] font-semibold mt-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300";
        alertDiv.innerText = "RISIKO SEDANG: Rasio angsuran mendekati batas aman (30-40%). Direkomendasikan evaluasi pendapatan tambahan.";
      } else {
        alertDiv.className = "p-2.5 rounded-lg text-[11px] font-semibold mt-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300";
        alertDiv.innerText = "RISIKO AMAN: Angsuran berada di bawah 30% dari total pendapatan bulanan.";
      }
    }

    function submitForm(event) {
      event.preventDefault();
      
      const submitBtn = document.getElementById("submit-btn");
      submitBtn.disabled = true;
      submitBtn.innerHTML = \`<span>Menyimpan...</span>\`;

      const amount = parseFloat(document.getElementById("form-amount").value);
      const income = parseFloat(document.getElementById("form-income").value);
      const term = parseInt(document.getElementById("form-term").value);
      const purposeSelect = document.getElementById("form-purpose").value;
      const purpose = purposeSelect === "Lainnya" ? document.getElementById("form-custom-purpose").value : purposeSelect;
      
      const appData = {
        customerName: document.getElementById("form-name").value,
        customerEmail: "",
        phoneNumber: document.getElementById("form-phone").value,
        amount: amount,
        termMonths: term,
        purpose: purpose,
        monthlyIncome: income,
        status: "Pending",
        createdAt: new Date().toISOString(),
        adminNotes: "",
        kantor: document.getElementById("form-kantor").value,
        statusPemrosesan: document.getElementById("form-status-berkas").value,
        accAmount: 0
      };

      if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            showNotif(\`Berhasil meregistrasikan pengajuan kredit baru dengan ID: \s\${res.id}!\`);
            document.getElementById("new-app-form").reset();
            document.getElementById("advisory-box").classList.add("hidden");
            submitBtn.disabled = false;
            submitBtn.innerHTML = \`<span>Daftarkan Permohonan</span>\`;
            switchTab("tab-list");
          })
          .withFailureHandler(function(err) {
            console.error(err);
            showNotif("Gagal mendaftarkan pengajuan: " + err.message, "error");
            submitBtn.disabled = false;
            submitBtn.innerHTML = \`<span>Daftarkan Permohonan</span>\`;
          })
          .addApplicationGS(appData);
      } else {
        setTimeout(() => {
          const mockId = "KRD-2026-" + Math.floor(100000 + Math.random() * 900000);
          showNotif(\`[MOCK] Berhasil meregistrasikan permohonan baru untuk \${appData.customerName} (ID: \${mockId})!\`);
          document.getElementById("new-app-form").reset();
          document.getElementById("advisory-box").classList.add("hidden");
          submitBtn.disabled = false;
          submitBtn.innerHTML = \`<span>Daftarkan Permohonan</span>\`;
          
          allApplications.unshift({
            ...appData,
            id: mockId,
            rowIndex: allApplications.length + 2
          });
          switchTab("tab-list");
        }, 1200);
      }
    }
  </script>
</body>
</html>`;
