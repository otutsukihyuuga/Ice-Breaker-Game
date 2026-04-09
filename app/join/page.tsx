"use client";

import type { Html5Qrcode } from "html5-qrcode";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { parseSessionCodeFromQrOrText } from "@/lib/joinFromQr";

type Mode = "type" | "scan";

const READER_ID = "join-qr-reader";

export default function JoinPage() {
  const [mode, setMode] = useState<Mode>("type");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stopScanning = useCallback(async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    setCameraOn(false);
    if (!s) return;
    try {
      await s.stop();
    } catch {
      /* already stopped */
    }
    try {
      s.clear();
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    return () => {
      void stopScanning();
    };
  }, [stopScanning]);

  useEffect(() => {
    if (mode !== "scan") void stopScanning();
  }, [mode, stopScanning]);

  async function joinWithCode(trimmed: string) {
    setJoinError(null);
    setScanError(null);
    if (!trimmed) {
      setJoinError("Enter a session code.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/sessions?code=${encodeURIComponent(trimmed)}`, { cache: "no-store" });
      if (res.status === 404) {
        setJoinError("No session exists with that code.");
        return;
      }
      if (!res.ok) {
        setJoinError("Could not verify the session. Try again.");
        return;
      }
      window.location.href = `/session/${trimmed}/player`;
    } catch {
      setJoinError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase().replace(/\s+/g, "");
    await joinWithCode(trimmed);
  }

  async function onDecoded(decodedText: string) {
    await stopScanning();
    const parsed = parseSessionCodeFromQrOrText(decodedText);
    if (!parsed) {
      setScanError("Could not read a session code from the QR. Try again or type the code.");
      return;
    }
    await joinWithCode(parsed);
  }

  async function startCamera() {
    setScanError(null);
    await stopScanning();
    setBusy(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5 = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = html5;
      await html5.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          void onDecoded(text);
        },
        () => {}
      );
      setCameraOn(true);
    } catch (err) {
      scannerRef.current = null;
      const msg = err instanceof Error ? err.message : "Camera could not start.";
      setScanError(
        /Permission|NotAllowed|denied/i.test(msg)
          ? "Camera permission denied. Allow camera access or use “Choose QR image”."
          : msg.includes("NotFound") || /no.*camera/i.test(msg)
            ? "No camera found. Use “Choose QR image” or type the code."
            : msg
      );
    } finally {
      setBusy(false);
    }
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await stopScanning();
    setScanError(null);
    setBusy(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5 = new Html5Qrcode(READER_ID, { verbose: false });
      try {
        const text = await html5.scanFile(file, false);
        await html5.clear();
        await onDecoded(text);
      } catch {
        try {
          html5.clear();
        } catch {
          /* */
        }
        setScanError("No QR code found in that image.");
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Could not read the image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold">Join Session</h1>

      <div className="flex w-full max-w-sm rounded-lg border border-zinc-300 p-0.5 dark:border-zinc-600">
        <button
          type="button"
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "type" ? "bg-black text-white dark:bg-zinc-100 dark:text-black" : "text-zinc-600 dark:text-zinc-400"
          }`}
          onClick={() => setMode("type")}
        >
          Type code
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "scan" ? "bg-black text-white dark:bg-zinc-100 dark:text-black" : "text-zinc-600 dark:text-zinc-400"
          }`}
          onClick={() => setMode("scan")}
        >
          Scan QR
        </button>
      </div>

      {mode === "type" && (
        <form className="w-full" onSubmit={onSubmit}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded border border-zinc-300 p-3 text-center text-lg uppercase dark:border-zinc-600 dark:bg-zinc-900"
            placeholder="Enter code (e.g. A1B2C3)"
          />
          {joinError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{joinError}</p>}
          <button disabled={busy} className="mt-3 w-full rounded bg-black px-4 py-3 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-black" type="submit">
            {busy ? "Checking…" : "Join"}
          </button>
        </form>
      )}

      {mode === "scan" && (
        <div className="w-full space-y-3 text-left">
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Point the camera at the host&apos;s join QR, or pick a screenshot of the QR.
          </p>
          <div
            id={READER_ID}
            className="mx-auto min-h-[220px] w-full max-w-[280px] overflow-hidden rounded-lg border border-zinc-300 bg-zinc-950 dark:border-zinc-600"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {!cameraOn ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void startCamera()}
                className="rounded bg-black px-4 py-3 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-black"
              >
                {busy ? "Starting…" : "Use camera"}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void stopScanning()}
                className="rounded border border-zinc-300 px-4 py-3 dark:border-zinc-600"
              >
                Stop camera
              </button>
            )}
            <label className="cursor-pointer rounded border border-zinc-300 px-4 py-3 text-center dark:border-zinc-600">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => void onPickImage(e)} disabled={busy} />
              Choose QR image
            </label>
          </div>
          {scanError && <p className="text-center text-sm text-red-600 dark:text-red-400">{scanError}</p>}
          {joinError && <p className="text-center text-sm text-red-600 dark:text-red-400">{joinError}</p>}
        </div>
      )}

      <Link href="/" className="text-sm text-zinc-500">
        Back
      </Link>
    </main>
  );
}
