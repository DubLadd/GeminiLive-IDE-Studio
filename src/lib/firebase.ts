import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

// Read config from firebase-applet-config.json or fallback
let firebaseConfig: any = null;
try {
  // @ts-ignore
  import('../../firebase-applet-config.json').then(cfg => {
    firebaseConfig = cfg.default || cfg;
  });
} catch (e) {
  // ignore
}

// Inline fallback from provisioned config
const config = {
  projectId: "gen-lang-client-0414271931",
  appId: "1:272101396701:web:70ae55528110e254808b34",
  apiKey: "AIzaSyDRcoNYT-OdKcR6mRfmGsXzbhicppMVGHQ",
  authDomain: "gen-lang-client-0414271931.firebaseapp.com",
  storageBucket: "gen-lang-client-0414271931.firebasestorage.app",
  messagingSenderId: "272101396701",
  measurementId: ""
};

const app = getApps().length === 0 ? initializeApp(config) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure Google Auth Provider with Workspace scopes for Drive & Docs
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/documents');

// Test connection on boot as mandated by firebase-integration-rpc
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore connection: client is offline or network restricted.");
    }
  }
}
testFirestoreConnection();

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  onSnapshot
};
export type { User };
