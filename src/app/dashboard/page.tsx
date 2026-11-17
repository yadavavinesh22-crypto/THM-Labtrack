import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import Link from "next/link"; // <-- Naya Import Link ke liye
import { authOptions } from "@/lib/auth";
import {prisma} from "@/lib/prisma"; // Note: Tera purana code 'prisma' import kar raha tha, agar default export hai toh aise hi rehne de
import { SignOutButton } from "@/components/SignOutButton";
import { SubmissionForm } from "@/components/SubmissionForm";
import { StudentInsights } from "@/components/StudentInsights";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role === Role.MANAGER) redirect("/manager");

  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { batchId: true } });
  const assignments = await prisma.assignment.findMany({
    where: { OR: [{ batchId: null }, ...(currentUser?.batchId ? [{ batchId: currentUser.batchId }] : [])] },
    orderBy: { deadline: "asc" },
    include: {
      submissions: {
        where: { studentId: session.user.id },
        select: { id: true, status: true, feedback: true, submittedAt: true }
      }
    }
  });

  // Points calculate karne ke liye (Har verified lab = 10 points)
  const verifiedCount = assignments.filter(a => a.submissions[0]?.status === "VERIFIED").length;
  const submittedCount = assignments.filter(a => a.submissions.length > 0).length;
  const progress = assignments.length ? Math.round(verifiedCount / assignments.length * 100) : 0;
  const totalPoints = verifiedCount * 10;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-black">THM<span className="text-blue-600">LabTrack</span></p>
            <p className="text-xs text-slate-500">Student Dashboard</p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">STUDENT PORTAL</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Your lab assignments</h1>
            <p className="mt-2 text-slate-500">Complete each assigned lab before the deadline.</p>
          </div>
          {/* Naya Button Self-Practice ke liye */}
          <Link 
            href="/submit" 
            className="inline-block bg-emerald-600 text-white text-center font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition"
          >
            + Submit Self-Practice Lab
          </Link>
        </div>

        <div className="mb-6 rounded-2xl border bg-white p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-sm font-semibold">Your progress</p>
            <p className="text-slate-500 text-sm mt-1">{verifiedCount} verified · {submittedCount} submitted · {assignments.length} total</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">
              🏆 {totalPoints} Points
            </span>
            <span className="text-slate-900 font-black text-xl">{progress}%</span>
          </div>
        </div>

        <div className="mb-5 flex gap-4 text-sm">
          <a href="/calendar" className="text-blue-600 underline">Lab calendar</a>
          <a href="/certificate" className="text-blue-600 underline">Completion certificate</a>
        </div>

        <StudentInsights />

        {assignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No assignments at the moment. Check back later or submit a self-practice lab!
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {assignments.map(assignment => {
              const submission = assignment.submissions[0];
              return (
                <section key={assignment.id} className="space-y-4">
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h2 className="text-lg font-bold text-slate-900">{assignment.title}</h2>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                        Due {new Date(assignment.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{assignment.description}</p>
                    <a href={assignment.thmRoomUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-blue-600 underline">
                      Open TryHackMe room ↗
                    </a>
                    
                    {submission && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-3">
                        <p className="text-sm font-semibold">
                          Submission status: <span className="capitalize">{submission.status.toLowerCase()}</span>
                        </p>
                        {submission.feedback && (
                          <p className="text-sm text-red-600 mt-1">Feedback: {submission.feedback}</p>
                        )}
                      </div>
                    )}
                  </article>
                  
                  {(!submission || submission.status === "REJECTED") && assignment.deadline >= new Date() && (
                    <SubmissionForm assignmentId={assignment.id} assignmentTitle={assignment.title} />
                  )}
                  
                  {assignment.deadline < new Date() && !submission && (
                    <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-500">Deadline passed — no submission recorded.</p>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
