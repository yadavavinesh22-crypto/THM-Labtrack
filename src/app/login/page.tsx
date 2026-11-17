import { LoginForm } from "@/components/AuthForm";
import Link from "next/link";

export default function LoginPage() {
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-12">
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
      <Link href="/" className="text-sm font-bold text-blue-600">← THM LabTrack</Link>
      <h1 className="mt-6 text-3xl font-black text-slate-950">Welcome back</h1>
      <p className="mb-7 mt-2 text-sm text-slate-500">Sign in to continue to your dashboard.</p>
      <LoginForm />
    </div>
  </main>;
}
