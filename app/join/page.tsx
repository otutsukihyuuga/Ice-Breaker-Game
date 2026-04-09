"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function JoinPage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setJoinError(null);
    const trimmed = code.trim().toUpperCase().replace(/\s+/g, "");
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold">Join Session</h1>
      <form className="w-full" onSubmit={onSubmit}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded border border-zinc-300 p-3 text-center text-lg uppercase"
          placeholder="Enter code (e.g. A1B2C3)"
        />
        {joinError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{joinError}</p>}
        <button disabled={busy} className="mt-3 w-full rounded bg-black px-4 py-3 text-white disabled:opacity-50" type="submit">
          {busy ? "Checking…" : "Join"}
        </button>
      </form>
      <Link href="/" className="text-sm text-zinc-500">Back</Link>
    </main>
  );
}
