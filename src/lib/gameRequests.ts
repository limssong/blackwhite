"use client";

import { getFirebase, GAME_REQUESTS_COLLECTION, GAMES_COLLECTION } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { createInitialState } from "./pvpGame";

export type GameRequestStatus = "pending" | "accepted" | "rejected";

export type GameRequestDoc = {
  fromUserId: string;
  fromUserIp: string;
  toUserId: string;
  toUserIp: string;
  status: GameRequestStatus;
  gameId?: string;
  createdAt: unknown;
  updatedAt: unknown;
};

export async function createGameRequest(
  fromUserId: string,
  fromUserIp: string,
  toUserId: string,
  toUserIp: string
): Promise<string | null> {
  const fb = getFirebase();
  if (!fb) return null;
  const requestId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  await setDoc(doc(fb.db, GAME_REQUESTS_COLLECTION, requestId), {
    fromUserId,
    fromUserIp,
    toUserId,
    toUserIp,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return requestId;
}

export function subscribeToIncomingRequests(
  myUserId: string,
  onRequests: (requests: { id: string; data: GameRequestDoc }[]) => void
): () => void {
  const fb = getFirebase();
  if (!fb) return () => {};
  const q = query(
    collection(fb.db, GAME_REQUESTS_COLLECTION),
    where("toUserId", "==", myUserId)
  );
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs
      .map((d) => ({ id: d.id, data: d.data() as GameRequestDoc }))
      .filter((x) => x.data.status === "pending");
    onRequests(list);
  });
}

export function subscribeToSentRequests(
  myUserId: string,
  onAccepted: (gameId: string) => void
): () => void {
  const fb = getFirebase();
  if (!fb) return () => {};
  const q = query(
    collection(fb.db, GAME_REQUESTS_COLLECTION),
    where("fromUserId", "==", myUserId)
  );
  return onSnapshot(q, (snapshot) => {
    snapshot.docs.forEach((d) => {
      const data = d.data() as GameRequestDoc;
      if (data.status === "accepted" && data.gameId) onAccepted(data.gameId);
    });
  });
}

export async function acceptGameRequest(
  requestId: string,
  acceptorUserId: string,
  acceptorUserIp: string
): Promise<string | null> {
  const fb = getFirebase();
  if (!fb) return null;
  const requestRef = doc(fb.db, GAME_REQUESTS_COLLECTION, requestId);
  const snap = await getDoc(requestRef);
  const data = snap.data() as GameRequestDoc | undefined;
  if (!data || data.status !== "pending") return null;

  const gameId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const state = createInitialState();
  await setDoc(doc(fb.db, GAMES_COLLECTION, gameId), {
    player1Id: data.fromUserId,
    player1Ip: data.fromUserIp,
    player2Id: acceptorUserId,
    player2Ip: acceptorUserIp,
    status: "playing",
    state,
    updatedAt: serverTimestamp(),
  });
  await setDoc(requestRef, {
    status: "accepted",
    gameId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return gameId;
}

export async function rejectGameRequest(requestId: string): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  await setDoc(doc(fb.db, GAME_REQUESTS_COLLECTION, requestId), {
    status: "rejected",
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
