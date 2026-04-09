import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold">Ice Breaker Game</h1>
      <p className="max-w-2xl text-zinc-600">
        A facilitator-led, non-competitive energizer for innovation workshops.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link className="rounded bg-black px-5 py-3 text-white" href="/host">
          Start as Host
        </Link>
        <Link className="rounded border border-zinc-300 px-5 py-3" href="/join">
          Join Session
        </Link>
      </div>
    </main>
  );
}
