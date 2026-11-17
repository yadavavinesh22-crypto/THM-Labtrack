"use client";

import { useState } from "react";

type Submission = {
  id: string; 
  submittedUrl: string; 
  proofImageUrl: string; 
  status: string;
  submittedAt: string; 
  feedback: string | null; 
  duplicateProof?: boolean;
  customLabName?: string | null; // <-- Naya field add kiya
  student: { name: string; email: string };
  assignment: { title: string } | null; // <-- Isko null allow kiya
};

export function ManagerReview({ initial }: { initial: Submission[] }) {
  const [items, setItems] = useState(initial);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function review(id: string, status: "VERIFIED" | "REJECTED") {
    setError("");
    if (status === "REJECTED" && !feedback[id]?.trim()) {
      setError("Add feedback before rejecting a submission.");
      return;
    }
    setBusy(id);
    try {
      const response = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, feedback: feedback[id] || undefined })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Review failed.");
      setItems(current => current.map(item => item.id === id ? { ...item, status, feedback: feedback[id] || null } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update submission.");
    } finally { setBusy(""); }
  }

  if (!items.length) return <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No submissions yet.</div>;

  return <div className="space-y-4">
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>{["Student", "Lab", "Submitted URL", "Proof", "Status", "Review"].map(x => <th key={x} className="px-4 py-3">{x}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map(item => <tr key={item.id} className="align-top">
            <td className="px-4 py-4"><p className="font-semibold text-slate-900">{item.student.name}</p><p className="text-xs text-slate-500">{item.student.email}</p><p className="mt-1 text-xs text-slate-400">{new Date(item.submittedAt).toLocaleDateString()}</p></td>
            
            {/* Yahan change kiya hai: Agar assignment hai toh title dikhao, warna customLabName dikhao */}
            <td className="px-4 py-4 font-medium text-slate-800">
              {item.assignment?.title || item.customLabName || "Self-Practice Lab"}
            </td>
            
            <td className="max-w-48 break-all px-4 py-4"><a href={item.submittedUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open submission</a></td>
            <td className="px-4 py-4"><a href={item.proofImageUrl} target="_blank" rel="noreferrer"><img src={item.proofImageUrl} alt="Student proof" className="h-20 w-28 rounded-lg border object-cover" /></a></td>
            <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "VERIFIED" ? "bg-emerald-100 text-emerald-700" : item.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{item.status}</span></td>
            <td className="min-w-56 px-4 py-4">
              {item.status === "PENDING" ? <div className="space-y-2">
                <textarea value={feedback[item.id] || ""} onChange={e => setFeedback(v => ({ ...v, [item.id]: e.target.value }))} placeholder="Optional feedback; required for rejection" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <button disabled={busy === item.id} onClick={() => review(item.id, "VERIFIED")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Verify</button>
                  <button disabled={busy === item.id} onClick={() => review(item.id, "REJECTED")} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Reject</button>
                </div>
              </div> : <p className="max-w-52 text-xs text-slate-500">{item.feedback || "Reviewed"}</p>}
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </div>;
}
