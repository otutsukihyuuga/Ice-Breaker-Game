"use client";

import type { PromptType } from "@/lib/constants";
import { FormEvent, useEffect, useMemo, useState } from "react";

type PromptItem = {
  id: string;
  text: string;
  type: PromptType;
  enabled: boolean;
};

export default function AdminPromptsPage() {
  const [key, setKey] = useState("");
  const [type, setType] = useState<string>("ALL");
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<PromptType>("MOVE");

  const filterQuery = useMemo(() => (type === "ALL" ? "" : `&type=${type}`), [type]);

  useEffect(() => {
    if (!key) return;
    let canceled = false;

    async function fetchPrompts() {
      const res = await fetch(`/api/admin/prompts?key=${encodeURIComponent(key)}${filterQuery}`, { cache: "no-store" });
      if (!res.ok || canceled) return;
      const data = await res.json();
      if (!canceled) setPrompts(data.prompts);
    }

    fetchPrompts();
    return () => {
      canceled = true;
    };
  }, [key, filterQuery]);

  async function load() {
    if (!key) return;
    const res = await fetch(`/api/admin/prompts?key=${encodeURIComponent(key)}${filterQuery}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setPrompts(data.prompts);
  }

  async function createPrompt(e: FormEvent) {
    e.preventDefault();
    await fetch(`/api/admin/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ text: newText, type: newType, enabled: true }),
    });
    setNewText("");
    await load();
  }

  async function updatePrompt(prompt: PromptItem, patch: Partial<PromptItem>) {
    await fetch(`/api/admin/prompts/${prompt.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ ...prompt, ...patch }),
    });
    await load();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 px-6 py-8">
      <h1 className="text-3xl font-bold">Prompt Admin</h1>
      <input
        className="max-w-sm rounded border border-zinc-300 p-2"
        placeholder="Admin key"
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />

      <div className="flex gap-2">
        <select className="rounded border border-zinc-300 p-2" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="ALL">All</option>
          <option value="MOVE">Move</option>
          <option value="TALK">Talk</option>
          <option value="CREATE">Create</option>
          <option value="WILDCARD">Wildcard</option>
        </select>
      </div>

      <form className="rounded border border-zinc-200 p-4" onSubmit={createPrompt}>
        <h2 className="font-semibold">Add prompt</h2>
        <textarea className="mt-2 w-full rounded border border-zinc-300 p-2" value={newText} onChange={(e) => setNewText(e.target.value)} />
        <div className="mt-2 flex gap-2">
          <select className="rounded border border-zinc-300 p-2" value={newType} onChange={(e) => setNewType(e.target.value as PromptType)}>
            <option value="MOVE">MOVE</option>
            <option value="TALK">TALK</option>
            <option value="CREATE">CREATE</option>
            <option value="WILDCARD">WILDCARD</option>
          </select>
          <button className="rounded bg-black px-4 py-2 text-white" type="submit">Add</button>
        </div>
      </form>

      <section className="grid gap-2">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="rounded border border-zinc-200 p-3">
            <p className="font-medium">{prompt.text}</p>
            <p className="text-xs text-zinc-500">{prompt.type}</p>
            <div className="mt-2 flex gap-2">
              <button className="rounded border border-zinc-300 px-2 py-1 text-sm" onClick={() => updatePrompt(prompt, { enabled: !prompt.enabled })}>
                {prompt.enabled ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
