"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function JoinPage() {
  const [code, setCode] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    window.location.href = `/session/${code.toUpperCase()}/player`;
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
        <button className="mt-3 w-full rounded bg-black px-4 py-3 text-white" type="submit">
          Join
        </button>
      </form>
      <Link href="/" className="text-sm text-zinc-500">Back</Link>
    </main>
  );
}
