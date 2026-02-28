"use client";

import { getFirebase, GAMES_COLLECTION } from "./firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { getTileColor } from "./utils";

export type PvpGameStatus = "waiting" | "playing" | "ended";

export type PvpGameState = {
  round: number;
  roundPhase: "ready" | "select" | "reveal" | "done";
  firstPlayerThisRound: "player1" | "player2" | null;
  player1Tiles: number[];
  player2Tiles: number[];
  player1Used: number[];
  player2Used: number[];
  player1Score: number;
  player2Score: number;
  player1Selected: number | null;
  player2Selected: number | null;
  roundResult: "player1" | "player2" | "draw" | null;
  player1PlayedTiles: number[];
  player2PlayedTiles: number[];
  player2PlayedColors: ("black" | "white")[];
  roundResults: ("player1" | "player2" | "draw")[];
  suddenDeath: boolean;
  winner: "player1" | "player2" | null;
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

export function createInitialState(): PvpGameState {
  return {
    round: 0,
    roundPhase: "ready",
    firstPlayerThisRound: null,
    player1Tiles: shuffle([...TILES]),
    player2Tiles: shuffle([...TILES]),
    player1Used: [],
    player2Used: [],
    player1Score: 0,
    player2Score: 0,
    player1Selected: null,
    player2Selected: null,
    roundResult: null,
    player1PlayedTiles: [],
    player2PlayedTiles: [],
    player2PlayedColors: [],
    roundResults: [],
    suddenDeath: false,
    winner: null,
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

export async function updateGameState(gameId: string, state: PvpGameState): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  await setDoc(doc(fb.db, GAMES_COLLECTION, gameId), {
    state,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function startPvpGame(current: PvpGameState): PvpGameState {
  return {
    ...current,
    roundPhase: "select",
    firstPlayerThisRound: Math.random() < 0.5 ? "player1" : "player2",
  };
}

export function applyPvpTileSelect(
  current: PvpGameState,
  player: "player1" | "player2",
  tile: number
): PvpGameState {
  const tiles = player === "player1" ? [...current.player1Tiles] : [...current.player2Tiles];
  const used = player === "player1" ? [...current.player1Used] : [...current.player2Used];
  if (used.includes(tile)) return current;

  const next = { ...current };
  if (player === "player1") {
    next.player1Selected = tile;
  } else {
    next.player2Selected = tile;
  }

  const p1Sel = next.player1Selected;
  const p2Sel = next.player2Selected;

  if (p1Sel !== null && p2Sel !== null) {
    let roundResult: "player1" | "player2" | "draw" = "draw";
    if (p1Sel > p2Sel) roundResult = "player1";
    else if (p2Sel > p1Sel) roundResult = "player2";
    next.roundPhase = "done";
    next.roundResult = roundResult;
    next.player1Score = current.player1Score + (roundResult === "player1" ? 1 : 0);
    next.player2Score = current.player2Score + (roundResult === "player2" ? 1 : 0);
    next.player1Used = [...current.player1Used, p1Sel];
    next.player2Used = [...current.player2Used, p2Sel];
    next.player1PlayedTiles = [...current.player1PlayedTiles, p1Sel];
    next.player2PlayedTiles = [...current.player2PlayedTiles, p2Sel];
    next.player2PlayedColors = [...current.player2PlayedColors, getTileColor(p2Sel as 0|1|2|3|4|5|6|7|8)];
    next.roundResults = [...current.roundResults, roundResult];
  }

  return next;
}

export function applyPvpNextRound(current: PvpGameState): PvpGameState {
  const p1Score = current.player1Score;
  const p2Score = current.player2Score;

  if (p1Score >= 5 || p2Score >= 5) {
    return {
      ...current,
      winner: p1Score >= 5 ? "player1" : "player2",
      roundPhase: "done",
    };
  }

  if (current.round + 1 >= 9) {
    if (p1Score !== p2Score) {
      return {
        ...current,
        winner: p1Score > p2Score ? "player1" : "player2",
        roundPhase: "done",
      };
    }
    return {
      ...createInitialState(),
      suddenDeath: true,
      roundPhase: "ready",
      firstPlayerThisRound: null,
    };
  }

  const firstNext = current.roundResult === "player1" ? "player1" : current.roundResult === "player2" ? "player2" : current.firstPlayerThisRound!;
  return {
    ...current,
    round: current.round + 1,
    roundPhase: "select",
    firstPlayerThisRound: firstNext,
    player1Selected: null,
    player2Selected: null,
    roundResult: null,
  };
}

export function setPvpGameEnded(gameId: string, winner: "player1" | "player2"): Promise<void> {
  const fb = getFirebase();
  if (!fb) return Promise.resolve();
  return setDoc(doc(fb.db, GAMES_COLLECTION, gameId), {
    status: "ended",
    winner,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export { TILES };
