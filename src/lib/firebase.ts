import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Check for API key from Vite env vars, JSON config, or local storage override
const localOverride = typeof window !== 'undefined' ? (localStorage.getItem('custom_firebase_api_key') || '') : '';
const resolvedApiKey = (
  (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim() ||
  (import.meta.env.VITE_GOOGLE_API_KEY as string | undefined)?.trim() ||
  (firebaseConfigJson.apiKey || '').trim() ||
  localOverride.trim()
);

export const isFirebaseConfigured = Boolean(resolvedApiKey && resolvedApiKey.length > 5);

const firebaseConfig = {
  apiKey: resolvedApiKey || 'AIzaSyPlaceholderForOfflineDemoMode00000',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string)?.trim() || firebaseConfigJson.authDomain,
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string)?.trim() || firebaseConfigJson.projectId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string)?.trim() || firebaseConfigJson.storageBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string)?.trim() || firebaseConfigJson.messagingSenderId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string)?.trim() || firebaseConfigJson.appId,
};

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let initError: string | null = null;

try {
  if (isFirebaseConfigured) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);
    const customDbId = (import.meta.env.VITE_FIREBASE_DATABASE_ID as string)?.trim() || (firebaseConfigJson as any).firestoreDatabaseId;
    dbInstance = (customDbId && customDbId !== '(default)' && customDbId.trim().length > 0)
      ? getFirestore(app, customDbId.trim())
      : getFirestore(app);
  } else {
    // If no API key is configured, log an informative warning instead of throwing an uncaught module exception
    console.warn(
      '[Firebase] No valid API Key found. App will run in Offline / Demo Mode. ' +
      'To enable Firebase, set VITE_FIREBASE_API_KEY in your environment variables.'
    );
  }
} catch (err: any) {
  initError = err?.message || String(err);
  console.error('[Firebase Init Error]:', err);
}

export const auth = authInstance;
export const db = dbInstance;
export const firebaseInitError = initError;
export default app;

