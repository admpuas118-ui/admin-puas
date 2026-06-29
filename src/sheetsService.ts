// Google Sheets and Drive API Service

import { LoanApplication } from "./types";

const DEFAULT_SHEET_NAME = "Permohonan Pinjaman";

// Column headers layout
export const SHEET_COLUMNS = [
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
];

/**
 * Fetch files from Google Drive with MIME type spreadsheet.
 */
export async function listSpreadsheets(accessToken: string): Promise<any[]> {
  try {
    const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed = false");
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime desc&fields=files(id,name,webViewLink,modifiedTime)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Gagal memuat daftar Google Sheets");
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error("Error in listSpreadsheets:", error);
    throw error;
  }
}

/**
 * Create a new structured spreadsheet in Google Drive.
 */
export async function createLoanSpreadsheet(accessToken: string, title: string): Promise<{ id: string; webViewLink: string }> {
  try {
    // 1. Create Spreadsheet
    const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          title: title,
        },
        sheets: [
          {
            properties: {
              title: DEFAULT_SHEET_NAME,
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Gagal membuat spreadsheet baru");
    }

    const spreadsheet = await res.json();
    const spreadsheetId = spreadsheet.spreadsheetId;

    // 2. Add header columns & format them
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${DEFAULT_SHEET_NAME}!A1:M1?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [SHEET_COLUMNS],
        }),
      }
    );

    // Get spreadsheet webViewLink via Drive API
    const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?fields=webViewLink`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    let webViewLink = "";
    if (driveRes.ok) {
      const fileMeta = await driveRes.json();
      webViewLink = fileMeta.webViewLink;
    }

    return { id: spreadsheetId, webViewLink };
  } catch (error) {
    console.error("Error in createLoanSpreadsheet:", error);
    throw error;
  }
}

/**
 * Fetch all applications from a spreadsheet.
 */
export async function fetchApplications(accessToken: string, spreadsheetId: string): Promise<LoanApplication[]> {
  try {
    // We try to fetch from DEFAULT_SHEET_NAME, if fails we fall back to first sheet or values A:M
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(DEFAULT_SHEET_NAME)}!A:M`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      // If our custom sheet tab does not exist, let's look at spreadsheet metadata and try first sheet name
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const firstSheetName = meta.sheets?.[0]?.properties?.title;
        if (firstSheetName && firstSheetName !== DEFAULT_SHEET_NAME) {
          return fetchFromSheetTab(accessToken, spreadsheetId, firstSheetName);
        }
      }
      throw new Error("Gagal membaca spreadsheet. Pastikan lembar tidak kosong atau terhapus.");
    }

    const data = await res.json();
    return parseRowsToApplications(data.values || []);
  } catch (error) {
    console.error("Error in fetchApplications:", error);
    throw error;
  }
}

async function fetchFromSheetTab(accessToken: string, spreadsheetId: string, sheetTabName: string): Promise<LoanApplication[]> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTabName)}!A:M`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    throw new Error("Gagal membaca tab lembar alternatif.");
  }
  const data = await res.json();
  return parseRowsToApplications(data.values || []);
}

function parseRowsToApplications(rows: any[][]): LoanApplication[] {
  if (rows.length <= 1) return []; // Empty or only headers

  // Map each row (skip row 0 as header)
  return rows.slice(1).map((row, index) => {
    // Row in Google Sheets is index + 2 (since slice(1) starts at row 2, which is index 0 in slice)
    const absoluteRowIndex = index + 2;

    return {
      id: row[0] || "",
      customerName: row[1] || "",
      customerEmail: row[2] || "",
      phoneNumber: row[3] || "",
      amount: parseFloat(row[4]) || 0,
      termMonths: parseInt(row[5]) || 0,
      purpose: row[6] || "",
      monthlyIncome: parseFloat(row[7]) || 0,
      status: (row[8] || "Pending") as any,
      createdAt: row[9] || "",
      adminNotes: row[10] || "",
      kantor: row[11] || "210",
      statusPemrosesan: row[12] || "Lengkap",
      rowIndex: absoluteRowIndex,
    };
  });
}

/**
 * Add a new loan application row.
 */
export async function addApplication(accessToken: string, spreadsheetId: string, app: Omit<LoanApplication, "rowIndex">): Promise<void> {
  try {
    const rowValues = [
      app.id,
      app.customerName,
      app.customerEmail,
      app.phoneNumber,
      app.amount,
      app.termMonths,
      app.purpose,
      app.monthlyIncome,
      app.status,
      app.createdAt,
      app.adminNotes,
      app.kantor,
      app.statusPemrosesan,
    ];

    // Try DEFAULT_SHEET_NAME first
    let targetRange = `${DEFAULT_SHEET_NAME}!A:M`;
    
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetRange)}:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      }
    );

    if (!res.ok) {
      // Fallback: fetch metadata to append to first sheet
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const firstSheetName = meta.sheets?.[0]?.properties?.title;
        if (firstSheetName) {
          const fallbackRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetName)}!A:M:append?valueInputOption=USER_ENTERED`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                values: [rowValues],
              }),
            }
          );
          if (!fallbackRes.ok) {
            throw new Error("Gagal menambahkan permohonan ke spreadsheet");
          }
          return;
        }
      }
      throw new Error("Gagal menyisipkan baris permohonan baru.");
    }
  } catch (error) {
    console.error("Error in addApplication:", error);
    throw error;
  }
}

/**
 * Update status and admin notes for a specific loan application in Google Sheets.
 * We fetch all applications to locate the correct row, then update.
 */
export async function updateApplicationStatusAndNotes(
  accessToken: string,
  spreadsheetId: string,
  applicationId: string,
  newStatus: LoanApplication["status"],
  adminNotes: string,
  statusPemrosesan?: string
): Promise<void> {
  try {
    // 1. Fetch current applications to make sure we find the exact row
    const apps = await fetchApplications(accessToken, spreadsheetId);
    const matchedApp = apps.find((a) => a.id === applicationId);

    if (!matchedApp || !matchedApp.rowIndex) {
      throw new Error(`Permohonan dengan ID ${applicationId} tidak ditemukan di Google Sheets.`);
    }

    const rowIndex = matchedApp.rowIndex;

    // Get the sheet tab name used
    let sheetName = DEFAULT_SHEET_NAME;
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (metaRes.ok) {
      const meta = await metaRes.json();
      const firstSheetName = meta.sheets?.[0]?.properties?.title;
      if (firstSheetName) {
        sheetName = firstSheetName;
      }
    }

    // Status is in Column I (column 9) -> range: I{rowIndex}
    // Admin Notes is in Column K (column 11) -> range: K{rowIndex}
    
    // We can do two updates, or update the range I{row}:K{row}
    // Row slice I to K has length 3: Status (I), Tanggal Pengajuan (J), Catatan Admin (K)
    // To preserve "Tanggal Pengajuan" (J), we can perform a batch update values or update I and K separately.
    // Let's do two separate standard PUT requests for simplicity and safety.

    // 1. Update Status (I)
    const statusRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!I${rowIndex}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [[newStatus]],
        }),
      }
    );

    if (!statusRes.ok) {
      throw new Error("Gagal memperbarui status permohonan");
    }

    // 2. Update Admin Notes (K)
    const notesRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!K${rowIndex}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [[adminNotes]],
        }),
      }
    );

    if (!notesRes.ok) {
      throw new Error("Gagal memperbarui catatan admin");
    }

    // 3. Update Status Pemrosesan Berkas (M)
    if (statusPemrosesan) {
      const pemrosesanRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!M${rowIndex}?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [[statusPemrosesan]],
          }),
        }
      );

      if (!pemrosesanRes.ok) {
        throw new Error("Gagal memperbarui status pemrosesan berkas");
      }
    }
  } catch (error) {
    console.error("Error in updateApplicationStatusAndNotes:", error);
    throw error;
  }
}
