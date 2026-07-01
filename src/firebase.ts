import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Auth provider for Sheets integration
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/spreadsheets");
googleProvider.addScope("https://www.googleapis.com/auth/drive.file");

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export function getCachedGoogleToken(): string | null {
  return cachedAccessToken;
}

export function setCachedGoogleToken(token: string | null) {
  cachedAccessToken = token;
}

// Function to trigger Google authentication popup specifically for Google Sheet synchronization
export const signInWithGoogleSheets = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Gagal memperoleh token akses dari Google Auth.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Kesalahan masuk Google:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};


// Load cached authentication status
export const initAuth = (
  onAuthSuccess?: (user: any) => void,
  onAuthFailure?: () => void
) => {
  // Check sessionStorage for local authenticated user first
  const storedLocalUser = sessionStorage.getItem("local_auth_user");
  if (storedLocalUser) {
    try {
      const localUser = JSON.parse(storedLocalUser);
      if (onAuthSuccess) {
        setTimeout(() => onAuthSuccess(localUser), 0);
      }
      return () => {};
    } catch (e) {
      sessionStorage.removeItem("local_auth_user");
    }
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Authenticate using simple Username and Password
export const loginWithCredentials = async (username: string, password: string): Promise<any> => {
  const normUser = username.trim().toLowerCase();
  
  // Local bypass for admin/puasklaten
  if (normUser === "admin" && password === "puasklaten") {
    const localUser = {
      uid: "local-admin-id",
      email: "admin@puasklaten.com",
      displayName: "ADMIN BANK",
      isLocal: true,
    };
    sessionStorage.setItem("local_auth_user", JSON.stringify(localUser));
    return localUser;
  }

  // Convert standard username to email format for Firebase Auth
  const email = username.includes("@") ? username : `${username.toLowerCase().trim()}@puasklaten.com`;
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.warn("Firebase Auth primary failed:", error);
    
    // Check if the error is auth/operation-not-allowed or similar configuration restrictions
    if (error.code === "auth/operation-not-allowed") {
      console.warn("Email/Password Auth is disabled in Firebase console. Falling back to local offline session.");
      const localUser = {
        uid: `local-user-${normUser}`,
        email: email,
        displayName: username.toUpperCase(),
        isLocal: true,
      };
      sessionStorage.setItem("local_auth_user", JSON.stringify(localUser));
      return localUser;
    }

    // If the account does not exist, automatically register it for smooth onboarding
    if (
      error.code === "auth/user-not-found" || 
      error.code === "auth/invalid-credential" ||
      error.message?.includes("INVALID_LOGIN_CREDENTIALS") ||
      error.message?.includes("user-not-found")
    ) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
      } catch (createError: any) {
        console.error("Auto-registration failed:", createError);
        if (createError.code === "auth/operation-not-allowed") {
          console.warn("Auto-registration failed due to disabled provider. Falling back to local offline session.");
          const localUser = {
            uid: `local-user-${normUser}`,
            email: email,
            displayName: username.toUpperCase(),
            isLocal: true,
          };
          sessionStorage.setItem("local_auth_user", JSON.stringify(localUser));
          return localUser;
        }
        throw new Error("Kombinasi nama akun atau kata sandi tidak valid.");
      }
    }
    
    // Other error codes, fall back to local offline session to keep app alive
    console.warn("Falling back to local session due to error:", error);
    const localUser = {
      uid: `local-user-${normUser}`,
      email: email,
      displayName: username.toUpperCase(),
      isLocal: true,
    };
    sessionStorage.setItem("local_auth_user", JSON.stringify(localUser));
    return localUser;
  }
};

export const logout = async () => {
  sessionStorage.removeItem("local_auth_user");
  cachedAccessToken = null;
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Firebase signOut error:", e);
  }
};

