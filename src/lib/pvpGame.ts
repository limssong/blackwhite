"use client";

import { getFirebase, GAMES_COLLECTION, isFirebaseConfigured } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

export type PvpGameStatus = "waiting" | "playing" | "ended";

export type PvpGameState = {
  round: number;
  userScore: number;
  opponentScore: number;
  roundPhase: string;
  isPlayer1Turn: boolean;
  userTiles: number[];
  opponentTiles: number[];
  userUsed: number[];
  opponentUsed: number[];
  userPlayedTiles: number[];
  opponentPlayedColors: ("black" | "white")[];
  roundResults: ("win" | "lose" | "draw")[];
  userSelected: number | null;
  opponentSelected: number | null;
  roundResult: "win" | "lose" | "draw" | null;
  cpuFirstTile: number | null;
  suddenDeath: boolean;
};

export type PvpGameDoc = {
  player1Id: string;
  player1Ip: string;
  player2Id?: string;
  player2Ip?: string;
  status: PvpGameStatus;
  state?: PvpGameState;
  createdAt: unknown;
  updatedAt: unknown;
};

const TILES = [0, 1, 2, 3, 4, 5, 6, 7, 8];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createInitialState(): PvpGameState {
  return {
    round: 0,
    userScore: 0,
    opponentScore: 0,
    roundPhase: "ready",
    isPlayer1Turn: true,
    userTiles: shuffle([...TILES]),
    opponentTiles: shuffle([...TILES]),
    userUsed: [],
    opponentUsed: [],
    userPlayedTiles: [],
    opponentPlayedColors: [],
    roundResults: [],
    userSelected: null,
    opponentSelected: null,
    roundResult: null,
    cpuFirstTile: null,
    suddenDeath: false,
  };
}

export async function createWaitingGame(playerId: string, playerIp: string): Promise<string | null> {
  const fb = getFirebase();
  if (!fb) return null;
  const gameId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  await setDoc(doc(fb.db, GAMES_COLLECTION, gameId), {
    player1Id: playerId,
    player1Ip: playerIp,
    status: "waiting",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return gameId;
}

export async function findWaitingGame(excludePlayerId: string): Promise<string | null> {
  const fb = getFirebase();
  if (!fb) return null;
  const q = query(
    collection(fb.db, GAMES_COLLECTION),
    where("status", "==", "waiting")
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const data = d.data() as PvpGameDoc;
    if (data.player1Id !== excludePlayerId) return d.id;
  }
  return null;
}

export async function joinGame(gameId: string, player2Id: string, player2Ip: string): Promise<boolean> {
  const fb = getFirebase();
  if (!fb) return false;
  const gameRef = doc(fb.db, GAMES_COLLECTION, gameId);
  const state = createInitialState();
  await setDoc(gameRef, {
    player2Id,
    player2Ip,
    status: "playing",
    state,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return true;
}

export function subscribeToGame(gameId: string, onUpdate: (data: PvpGameDoc) => void): () => void {
  const fb = getFirebase();
  if (!fb) return () => {};
  return onSnapshot(doc(fb.db, GAMES_COLLECTION, gameId), (snap) => {
    if (snap.exists()) onUpdate(snap.data() as PvpGameDoc);
  });
}

export async function updateGameState(gameId: string, state: Partial<PvpGameState>): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  const gameRef = doc(fb.db, GAMES_COLLECTION, gameId);
  await setDoc(gameRef, {
    state,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export { createInitialState, TILES };
