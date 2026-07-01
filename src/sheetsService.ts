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
  "Jumlah Disetujui (ACC)",
];

/**
 * Ensures the default sheet tab exists and is initialized with headers.
 */
export async function ensureSheetTabExists(accessToken: string, spreadsheetId: string): Promise<void> {
  try {
    // 1. Fetch spreadsheet metadata to check if DEFAULT_SHEET_NAME exists
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(title,sheetId))`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!metaRes.ok) {
      const err = await metaRes.json();
      throw new Error(err.error?.message || "Gagal membaca struktur spreadsheet");
    }

    const meta = await metaRes.json();
    const sheets = meta.sheets || [];
    const sheetExists = sheets.some(
      (s: any) => s.properties?.title === DEFAULT_SHEET_NAME
    );

    // 2. If it does not exist, add it
    if (!sheetExists) {
      const createRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                addSheet: {
                  properties: {
                    title: DEFAULT_SHEET_NAME,
                    gridProperties: {
                      frozenRowCount: 1,
                    },
                  },
                },
              },
            ],
          }),
        }
      );

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error?.message || "Gagal membuat tab permohonan baru");
      }
    }

    // 3. Check if headers exist. If the range is empty or invalid, write headers.
    const valuesRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(DEFAULT_SHEET_NAME)}!A1:N1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (valuesRes.ok) {
      const data = await valuesRes.json();
      if (!data.values || data.values.length === 0 || !data.values[0] || data.values[0].length === 0) {
        // Headers are missing, let's write them
        const putRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(DEFAULT_SHEET_NAME)}!A1:N1?valueInputOption=RAW`,
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
        if (!putRes.ok) {
          console.warn("Gagal menulis baris judul kolom awal.");
        }
      }
    } else {
      // Direct writing fallback if reading failed but sheet was just created
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(DEFAULT_SHEET_NAME)}!A1:N1?valueInputOption=RAW`,
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
    }
  } catch (error) {
    console.error("Error in ensureSheetTabExists:", error);
    throw error;
  }
}

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
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${DEFAULT_SHEET_NAME}!A1:N1?valueInputOption=RAW`,
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
    // Self-healing: make sure DEFAULT_SHEET_NAME exists with correct headers
    await ensureSheetTabExists(accessToken, spreadsheetId);

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(DEFAULT_SHEET_NAME)}!A:N`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
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
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTabName)}!A:N`,
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
      accAmount: parseFloat(row[13]) || 0,
      rowIndex: absoluteRowIndex,
    };
  });
}

/**
 * Add a new loan application row.
 */
export async function addApplication(accessToken: string, spreadsheetId: string, app: Omit<LoanApplication, "rowIndex">): Promise<void> {
  try {
    // Self-healing: make sure DEFAULT_SHEET_NAME exists with correct headers
    await ensureSheetTabExists(accessToken, spreadsheetId);

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
      app.accAmount || 0,
    ];

    // Try DEFAULT_SHEET_NAME first
    let targetRange = `${DEFAULT_SHEET_NAME}!A:N`;
    
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
  statusPemrosesan?: string,
  accAmount?: number
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
    // Let's do separate standard PUT requests for simplicity and safety.

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

    // 4. Update Jumlah Disetujui (ACC) (N)
    if (accAmount !== undefined) {
      const accRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!N${rowIndex}?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [[accAmount]],
          }),
        }
      );

      if (!accRes.ok) {
        throw new Error("Gagal memperbarui jumlah disetujui (ACC)");
      }
    }
  } catch (error) {
    console.error("Error in updateApplicationStatusAndNotes:", error);
    throw error;
  }
}

/**
 * Helper to extract spreadsheet ID from a Google Sheets URL.
 */
export function extractSpreadsheetId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Sync all applications from Firestore to Google Sheets.
 */
export async function syncFirestoreToSheets(
  accessToken: string,
  spreadsheetId: string,
  firestoreApps: LoanApplication[]
): Promise<{ added: number; updated: number; failed: number }> {
  let added = 0;
  let updated = 0;
  let failed = 0;

  try {
    // 1. Ensure tab exists and headers are present
    await ensureSheetTabExists(accessToken, spreadsheetId);

    // 2. Fetch existing sheet applications
    const sheetApps = await fetchApplications(accessToken, spreadsheetId);
    const sheetAppMap = new Map<string, LoanApplication>();
    sheetApps.forEach((app) => {
      if (app.id) {
        sheetAppMap.set(app.id, app);
      }
    });

    // 3. Loop through firestore applications and sync
    for (const app of firestoreApps) {
      try {
        const matchedSheetApp = sheetAppMap.get(app.id);

        if (matchedSheetApp) {
          // Check if updates are needed
          const needsUpdate =
            matchedSheetApp.status !== app.status ||
            matchedSheetApp.adminNotes !== app.adminNotes ||
            matchedSheetApp.statusPemrosesan !== app.statusPemrosesan ||
            matchedSheetApp.accAmount !== app.accAmount ||
            matchedSheetApp.customerName !== app.customerName ||
            matchedSheetApp.phoneNumber !== app.phoneNumber ||
            matchedSheetApp.amount !== app.amount ||
            matchedSheetApp.termMonths !== app.termMonths ||
            matchedSheetApp.purpose !== app.purpose ||
            matchedSheetApp.monthlyIncome !== app.monthlyIncome;

          if (needsUpdate) {
            await updateEntireSheetRow(accessToken, spreadsheetId, matchedSheetApp.rowIndex!, app);
            updated++;
          }
        } else {
          // Add as new row
          await addApplication(accessToken, spreadsheetId, app);
          added++;
        }
      } catch (err) {
        console.error(`Gagal menyinkronkan aplikasi ${app.id}:`, err);
        failed++;
      }
    }

    return { added, updated, failed };
  } catch (error) {
    console.error("Error in syncFirestoreToSheets:", error);
    throw error;
  }
}

/**
 * Update an entire row in Google Sheets
 */
export async function updateEntireSheetRow(
  accessToken: string,
  spreadsheetId: string,
  rowIndex: number,
  app: LoanApplication
): Promise<void> {
  const sheetName = DEFAULT_SHEET_NAME;
  
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
    app.accAmount || 0,
  ];

  const range = `${encodeURIComponent(sheetName)}!A${rowIndex}:N${rowIndex}`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
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
    const err = await res.json();
    throw new Error(err.error?.message || `Gagal memperbarui baris ${rowIndex}`);
  }
}

