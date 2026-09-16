"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StatusLookupPage() {
  const [token, setToken] = useState("");
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/status/${token.trim()}`);
        }}
        className="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-8 space-y-4 text-center"
      >
        <h1 className="text-lg font-semibold text-slate-900">Check Screening Report</h1>
        <p className="text-sm text-slate-500">Scan the QR on the sample card, or type the code below.</p>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="smpl_..."
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-center font-mono"
        />
        <button className="w-full rounded-md bg-teal-800 text-white py-2 text-sm font-medium">Check Status</button>
      </form>
    </main>
  );
}
