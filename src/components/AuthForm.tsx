"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result || result.error) {
        setError("Email or password is incorrect.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium">Email
        <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" />
      </label>
      <label className="block text-sm font-medium">Password
        <input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" />
      </label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {loading ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-center text-sm text-slate-500">New student? <Link className="font-semibold text-blue-600" href="/register">Create an account</Link></p>
    </form>
  );
}

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Registration failed.");
      const login = await signIn("credentials", { email, password, redirect: false });
      if (login?.error) throw new Error("Account created. Please sign in.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium">Full name
        <input required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" />
      </label>
      <label className="block text-sm font-medium">College email
        <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" />
      </label>
      <label className="block text-sm font-medium">Password
        <input required type="password" minLength={10} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" />
      </label>
      <p className="text-xs text-slate-500">Use at least 10 characters, including a letter and a number.</p>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {loading ? "Creating account..." : "Create student account"}
      </button>
      <p className="text-center text-sm text-slate-500">Already registered? <Link className="font-semibold text-blue-600" href="/login">Sign in</Link></p>
    </form>
  );
}
