"use client";

import { FormEvent, useEffect, useState } from "react";

type Props = { assignmentId?: string | null; assignmentTitle?: string };

export function SubmissionForm({ assignmentId, assignmentTitle }: Props) {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [customLabName, setCustomLabName] = useState(""); // Naya state lab name ke liye
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Check karo ki ye self-practice hai ya assigned lab
  const isSelfPractice = !assignmentId;

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function chooseFile(selected?: File) {
    setError("");
    setSuccess("");
    if (!selected) { setFile(null); setPreview(""); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setError("Choose a JPEG, PNG or WebP screenshot.");
      return;
    }
    if (selected.size === 0 || selected.size > 5 * 1024 * 1024) {
      setError("Screenshot must be larger than 0 bytes and no more than 5 MB.");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    
    if (isSelfPractice && !customLabName.trim()) return setError("Enter the lab name.");
    if (!url.trim()) return setError("Enter your TryHackMe submission URL.");
    
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") return setError("Submission URL must use HTTPS.");
    } catch { return setError("Enter a valid URL."); }
    
    if (!file) return setError("Upload a screenshot as proof.");
    if (!confirmed) return setError("Confirm that this is your own work.");

    const data = new FormData();
    
    // Agar assignment ID hai toh wo bhejo, warna customLabName bhejo
    if (!isSelfPractice && assignmentId) {
      data.set("assignmentId", assignmentId);
    } else {
      data.set("customLabName", customLabName.trim());
    }
    
    data.set("submittedUrl", url.trim());
    data.set("proofImage", file);
    data.set("confirmation", "true");

    setLoading(true);
    try {
      const response = await fetch("/api/submissions", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Submission failed.");
      
      setSuccess(result.message || "Submission received.");
      
      // Form reset karo
      setUrl(""); setFile(null); setPreview(""); setConfirmed(false); setCustomLabName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected submission error.");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="font-semibold text-slate-900">
          {isSelfPractice ? "Submit Self-Practice Lab" : `Submit: ${assignmentTitle}`}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {isSelfPractice ? "Submit any TryHackMe room you have completed." : "One submission is allowed per assignment."}
        </p>
      </div>

      {/* Agar Self-Practice hai, tabhi Lab Name ka input dikhega */}
      {isSelfPractice && (
        <label className="block text-sm font-medium text-slate-700">Lab Name (TryHackMe Room Name)
          <input 
            value={customLabName} 
            onChange={e => setCustomLabName(e.target.value)} 
            type="text" 
            placeholder="e.g. OWASP Top 10, Simple CTF..." 
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" 
          />
        </label>
      )}

      <label className="block text-sm font-medium text-slate-700">TryHackMe room / completion URL
        <input value={url} onChange={e => setUrl(e.target.value)} type="url" placeholder="https://tryhackme.com/room/..." className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" />
      </label>

      <label className="block text-sm font-medium text-slate-700">Screenshot proof
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => chooseFile(e.target.files?.[0])} className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100" />
        <span className="mt-1 block text-xs text-slate-500">JPEG, PNG or WebP · 5 MB maximum</span>
      </label>

      {preview && <img src={preview} alt="Screenshot preview" className="max-h-56 rounded-xl border border-slate-200 object-contain" />}

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1" />
        <span>I confirm this is my own work and the attached proof represents my lab activity.</span>
      </label>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}

      <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Uploading proof..." : "Submit lab"}
      </button>
    </form>
  );
}
