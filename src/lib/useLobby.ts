"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getFirebase,
  isFirebaseConfigured,
  fetchMyIp,
  LOBBY_COLLECTION,
  type LobbyUser,
} from "./firebase";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

const HEARTBEAT_MS = 5000;
const OFFLINE_THRESHOLD_MS = 30000;

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useLobby() {
  const [onlineUsers, setOnlineUsers] = useState<LobbyUser[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [myIp, setMyIp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const leaveLobby = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    const fb = getFirebase();
    if (fb && myId) {
      deleteDoc(doc(fb.db, LOBBY_COLLECTION, myId)).catch(() => {});
    }
    setMyId(null);
    setOnlineUsers([]);
  }, [myId]);

  const enterLobby = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      setError("Firebase가 설정되지 않았습니다. .env.local을 확인해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ip = await fetchMyIp();
      setMyIp(ip);
      const fb = getFirebase();
      if (!fb) {
        setError("Firebase 연결에 실패했습니다.");
        setLoading(false);
        return;
      }
      const id = genId();
      setMyId(id);
      const lobbyRef = doc(fb.db, LOBBY_COLLECTION, id);
      await setDoc(lobbyRef, {
        ip,
        lastSeen: Date.now(),
        updatedAt: serverTimestamp(),
      });

      unsubRef.current = onSnapshot(collection(fb.db, LOBBY_COLLECTION), (snapshot) => {
        const now = Date.now();
        const users: LobbyUser[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const lastSeen = typeof data.lastSeen === "number" ? data.lastSeen : now;
          if (now - lastSeen < OFFLINE_THRESHOLD_MS && data.ip) {
            users.push({ id: d.id, ip: data.ip, lastSeen });
          }
        });
        users.sort((a, b) => b.lastSeen - a.lastSeen);
        setOnlineUsers(users);
      });

      heartbeatRef.current = setInterval(async () => {
        try {
          await setDoc(lobbyRef, {
            ip,
            lastSeen: Date.now(),
            updatedAt: serverTimestamp(),
          });
        } catch {}
      }, HEARTBEAT_MS);
    } catch (e) {
      setError("IP 조회 또는 로비 접속에 실패했습니다.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  return { onlineUsers, myId, myIp, enterLobby, leaveLobby, error, loading, isConfigured: isFirebaseConfigured() };
}
