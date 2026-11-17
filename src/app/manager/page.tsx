import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/SignOutButton";
import { ManagerReview } from "@/components/ManagerReview";
import { ManagerTools } from "@/components/ManagerTools";
import { ManagerPeople } from "@/components/ManagerPeople";
import { ManagerActivity } from "@/components/ManagerActivity";

export default async function ManagerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== Role.MANAGER) redirect("/dashboard");

  const submissions = await prisma.submission.findMany({
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
    include: {
      student: { select: { name: true, email: true } },
      assignment: { select: { title: true } }
    }
  });
  const pending = submissions.filter(s => s.status === "PENDING").length;
  const proofCounts = new Map<string, number>();
  submissions.forEach(s => { if (s.proofHash) proofCounts.set(s.proofHash, (proofCounts.get(s.proofHash) ?? 0) + 1); });
  const serialized = submissions.map(s => ({ ...s, duplicateProof: Boolean(s.proofHash && (proofCounts.get(s.proofHash) ?? 0) > 1), submittedAt: s.submittedAt.toISOString() }));

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><p className="text-lg font-black">THM<span className="text-blue-600">LabTrack</span></p><p className="text-xs text-slate-500">Manager dashboard</p></div><div className="flex items-center gap-4"><span className="hidden text-sm text-slate-600 sm:block">{session.user.name}</span><SignOutButton /></div></div></header>
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8"><p className="text-sm font-semibold text-blue-600">MANAGER PORTAL</p><h1 className="mt-1 text-3xl font-black text-slate-950">Submission review</h1><p className="mt-2 text-slate-500">Review student evidence and record a decision.</p></div>
      <ManagerTools />
      <ManagerPeople />
      <ManagerActivity />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Total submissions</p><p className="mt-2 text-3xl font-black">{submissions.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Awaiting review</p><p className="mt-2 text-3xl font-black text-amber-600">{pending}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Verified</p><p className="mt-2 text-3xl font-black text-emerald-600">{submissions.filter(s => s.status === "VERIFIED").length}</p></div>
      </div>
      <ManagerReview initial={serialized} />
    </div>
  </main>;
}
