"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { SessionState } from "@/types/game";

/**
 * @param bootstrap - Optional snapshot (e.g. from POST create) so UI updates before GET round-trips.
 */
export function useSessionState(code: string, bootstrap: SessionState | null = null) {
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`/api/sessions?code=${encodeURIComponent(code)}`, { cache: "no-store" });
      const text = await res.text();
      let payload: { session?: SessionState; error?: string };
      try {
        payload = JSON.parse(text) as { session?: SessionState; error?: string };
      } catch {
        setSession(null);
        setError("Invalid response (not JSON). Is the API route reachable?");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const message =
          typeof payload.error === "string" ? payload.error : `Failed to load session (${res.status})`;
        setSession(null);
        setError(message);
        setLoading(false);
        return;
      }

      if (!payload.session) {
        setSession(null);
        setError("Session payload missing");
        setLoading(false);
        return;
      }

      setSession(payload.session);
      setError(null);
      setLoading(false);
    } catch (err) {
      setSession(null);
      setError(err instanceof Error ? err.message : "Network error loading session");
      setLoading(false);
    }
  }, [code]);

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!code) {
      setSession(null);
      setError(null);
      setLoading(false);
      return;
    }

    const hasBootstrap = !!(bootstrap && bootstrap.code === code);
    if (hasBootstrap) {
      setSession(bootstrap);
      setError(null);
      setLoading(false);
    } else {
      setLoading(true);
      setError(null);
    }

    void loadRef.current();

    let socket: Socket | null = null;
    try {
      socket = io({ path: "/socket.io" });
      socket.emit("session:join", code);
      socket.on("session:update", () => {
        void loadRef.current();
      });
    } catch (err) {
      console.warn("Socket.IO client failed (polling still works):", err);
    }

    const interval = setInterval(() => {
      void loadRef.current();
    }, 3000);

    return () => {
      clearInterval(interval);
      socket?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- use id to avoid reruns on new object identity; bootstrap read from latest render
  }, [code, bootstrap?.id]);

  return { session, loading, error, refresh: load };
}
