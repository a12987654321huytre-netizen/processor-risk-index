import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PROVIDERS } from "@/data";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

const KEY = "pri-corrections";

export const Route = createFileRoute("/corrections")({
  head: () => ({ meta: [{ title: "Corrections — Processor Risk Index" }] }),
  component: Corrections,
});

function Corrections() {
  const [done, setDone] = useState(false);
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const row = {
      at: new Date().toISOString(),
      provider: String(fd.get("provider") ?? ""),
      claim: String(fd.get("claim") ?? ""),
      explanation: String(fd.get("explanation") ?? ""),
      url: String(fd.get("url") ?? ""),
      email: String(fd.get("email") ?? ""),
    };
    try {
      const prev = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown[];
      localStorage.setItem(KEY, JSON.stringify([row, ...prev].slice(0, 50)));
    } catch {
      /* ignore quota */
    }
    setDone(true);
    e.currentTarget.reset();
  }

  return (
    <div className="page-wrap py-10 max-w-xl">
      <h1 className="font-display text-4xl">Corrections</h1>
      <p className="mt-3 text-ink-muted">
        Think we got something wrong? Processors and merchants can send evidence. Submissions are not auto-published.
        Evidence beats outrage in either direction. There is no premium listing and no paid score change.
      </p>
      <p className="mt-3 text-sm text-ink-subtle">
        This preview stores the form on this device only. A production mailbox is not wired. Keep a copy of what you
        send.
      </p>
      {done ? (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent-soft p-4 text-sm">
          Saved on this device. We do not publish corrections until a human reads the supporting URL.
        </p>
      ) : null}
      <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="provider">Provider</Label>
          <Select id="provider" name="provider" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="claim">Claim being challenged</Label>
          <Input id="claim" name="claim" required />
        </div>
        <div>
          <Label htmlFor="explanation">Explanation</Label>
          <Textarea id="explanation" name="explanation" required />
        </div>
        <div>
          <Label htmlFor="url">Supporting URL</Label>
          <Input id="url" name="url" type="url" placeholder="https://" />
        </div>
        <div>
          <Label htmlFor="email">Contact email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <Button type="submit">Submit correction</Button>
      </form>
    </div>
  );
}
