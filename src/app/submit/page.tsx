import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { SubmissionForm } from "@/components/SubmissionForm";
import Link from "next/link";

export default async function SubmitPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) redirect("/login");
  if (session.user.role === Role.MANAGER) redirect("/manager");

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-semibold text-blue-600 hover:underline">
              &larr; Back to Dashboard
            </Link>
            <div className="text-lg font-black">
              THM<span className="text-blue-600">LabTrack</span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">Submit Self-Practice Lab</h1>
          <p className="text-slate-600 mt-2">Submit any TryHackMe room you have completed on your own. A manager will review and verify it.</p>
        </div>
        
        {/* Humara naya form jo customLabName leta hai (assignmentId nahi de rahe taaki pata chale ye self-practice hai) */}
        <SubmissionForm assignmentId={null} assignmentTitle="" />
      </div>
    </main>
  );
}
