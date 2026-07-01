import { db, auth } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { LoanApplication } from "./types";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const LOCAL_STORAGE_KEY = "puas_klaten_applications";

// Local Storage Fallback Helpers
function getLocalApplications(): LoanApplication[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error reading from local storage:", e);
    return [];
  }
}

function saveLocalApplications(apps: LoanApplication[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(apps));
  } catch (e) {
    console.error("Error writing to local storage:", e);
  }
}

/**
 * Fetch all loan applications from Firestore, falling back to LocalStorage if offline or unconfigured.
 */
export async function fetchApplicationsFirestore(): Promise<LoanApplication[]> {
  const colPath = "applications";
  try {
    // If not signed in yet, use local storage
    if (!auth.currentUser) {
      return getLocalApplications();
    }

    const q = query(collection(db, colPath), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const results: LoanApplication[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: docSnap.id,
        customerName: data.customerName || "",
        customerEmail: data.customerEmail || "",
        phoneNumber: data.phoneNumber || "",
        amount: Number(data.amount) || 0,
        termMonths: Number(data.termMonths) || 0,
        purpose: data.purpose || "",
        monthlyIncome: Number(data.monthlyIncome) || 0,
        status: data.status || "Pending",
        createdAt: data.createdAt || new Date().toISOString(),
        adminNotes: data.adminNotes || "",
        kantor: data.kantor || "Klaten",
        statusPemrosesan: data.statusPemrosesan || "Pemberkasan Masuk",
        accAmount: data.accAmount !== undefined ? Number(data.accAmount) : undefined,
      });
    });

    // Seed local storage with fetched data to keep them in sync
    if (results.length > 0) {
      saveLocalApplications(results);
    }
    return results;
  } catch (error) {
    console.warn("Firestore fetch failed, falling back to LocalStorage:", error);
    const local = getLocalApplications();
    if (local.length > 0) {
      return local;
    }
    
    // If permission or other error, log appropriately
    try {
      handleFirestoreError(error, OperationType.LIST, colPath);
    } catch (e) {
      // Return local fallback to prevent hard crash
      return local;
    }
    return [];
  }
}

/**
 * Add a new application to Firestore and LocalStorage.
 */
export async function addApplicationFirestore(app: Omit<LoanApplication, "rowIndex">): Promise<void> {
  const colPath = "applications";
  
  // Update Local Storage first
  const currentLocal = getLocalApplications();
  const updatedLocal = [app as LoanApplication, ...currentLocal];
  saveLocalApplications(updatedLocal);

  try {
    if (!auth.currentUser) {
      return;
    }
    
    const docRef = doc(db, colPath, app.id);
    await setDoc(docRef, {
      id: app.id,
      customerName: app.customerName,
      customerEmail: app.customerEmail,
      phoneNumber: app.phoneNumber,
      amount: app.amount,
      termMonths: app.termMonths,
      purpose: app.purpose,
      monthlyIncome: app.monthlyIncome,
      status: app.status,
      createdAt: app.createdAt,
      adminNotes: app.adminNotes,
      kantor: app.kantor,
      statusPemrosesan: app.statusPemrosesan,
      accAmount: app.accAmount ?? null,
    });
  } catch (error) {
    console.error("Failed to add application to Firestore:", error);
    handleFirestoreError(error, OperationType.WRITE, `${colPath}/${app.id}`);
  }
}

/**
 * Update the status of an application in Firestore and LocalStorage.
 */
export async function updateApplicationFirestore(
  id: string,
  updates: Partial<LoanApplication>
): Promise<void> {
  const colPath = "applications";
  
  // Update Local Storage first
  const currentLocal = getLocalApplications();
  const updatedLocal = currentLocal.map((app) => {
    if (app.id === id) {
      return { ...app, ...updates };
    }
    return app;
  });
  saveLocalApplications(updatedLocal);

  try {
    if (!auth.currentUser) {
      return;
    }
    
    const docRef = doc(db, colPath, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Failed to update application in Firestore:", error);
    handleFirestoreError(error, OperationType.UPDATE, `${colPath}/${id}`);
  }
}

/**
 * Delete an application from Firestore and LocalStorage.
 */
export async function deleteApplicationFirestore(id: string): Promise<void> {
  const colPath = "applications";
  
  // Update Local Storage first
  const currentLocal = getLocalApplications();
  const updatedLocal = currentLocal.filter((app) => app.id !== id);
  saveLocalApplications(updatedLocal);

  try {
    if (!auth.currentUser) {
      return;
    }
    
    const docRef = doc(db, colPath, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Failed to delete application in Firestore:", error);
    handleFirestoreError(error, OperationType.DELETE, `${colPath}/${id}`);
  }
}
