/**
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
 * Membaca data pengajuan dari spreadsheet
 */
function fetchApplicationsGS() {
  try {
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return [];
    }
    
    const values = sheet.getRange(2, 1, lastRow - 1, 13).getValues();
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
        statusPemrosesan: row[12] || "Lengkap & Siap Diperiksa"
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
      app.statusPemrosesan || "Lengkap & Siap Diperiksa"
    ]);
    
    return { success: true, id: id };
  } catch (err) {
    throw new Error("Gagal menambah data: " + err.message);
  }
}

/**
 * Memperbarui status keputusan kredit & status pemrosesan berkas secara instan
 */
function updateApplicationGS(rowIndex, status, notes, statusPemrosesan) {
  try {
    const sheet = getSheet();
    rowIndex = Number(rowIndex);
    
    if (status) {
      sheet.getRange(rowIndex, 9).setValue(status); // Column I
    }
    if (notes !== undefined) {
      sheet.getRange(rowIndex, 11).setValue(notes); // Column K
    }
    if (statusPemrosesan) {
      sheet.getRange(rowIndex, 13).setValue(statusPemrosesan); // Column M
    }
    return { success: true };
  } catch (err) {
    throw new Error("Gagal memperbarui data: " + err.message);
  }
}
