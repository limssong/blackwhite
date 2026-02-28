import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getFirebase(): { app: FirebaseApp; db: Firestore } | null {
  if (typeof window === "undefined") return null;
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0] as FirebaseApp;
    }
    db = getFirestore(app);
  }
  return db ? { app: app!, db } : null;
}

export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId);
}

export const LOBBY_COLLECTION = "lobby";
export const GAMES_COLLECTION = "games";
const HEARTBEAT_INTERVAL_MS = 5000;
const OFFLINE_THRESHOLD_MS = 30000;

export type LobbyUser = { id: string; ip: string; lastSeen: number };

export async function fetchMyIp(): Promise<string> {
  const res = await fetch("https://api.ipify.org?format=json");
  const data = (await res.json()) as { ip: string };
  return data.ip;
}
