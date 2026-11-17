import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (session.user.role !== Role.MANAGER) return NextResponse.json({ error: "Manager access required." }, { status: 403 });
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 86400000);
  const monthStart = new Date(now.getTime() - 30 * 86400000);
  const [students, assignments, total, pending, verified, rejected, recent] = await Promise.all([
    prisma.user.count({ where: { role: Role.STUDENT } }), prisma.assignment.count(), prisma.submission.count(),
    prisma.submission.count({ where: { status: "PENDING" } }), prisma.submission.count({ where: { status: "VERIFIED" } }),
    prisma.submission.count({ where: { status: "REJECTED" } }),
    prisma.submission.findMany({ where: { submittedAt: { gte: monthStart } }, select: { submittedAt: true, status: true } })
  ]);
  const weeklySubmissions = recent.filter(x => x.submittedAt >= weekStart).length;
  const activity = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(now); day.setDate(now.getDate() - (29 - index));
    const key = day.toISOString().slice(0, 10);
    const entries = recent.filter(x => x.submittedAt.toISOString().slice(0, 10) === key);
    return { date: key, total: entries.length, verified: entries.filter(x => x.status === "VERIFIED").length, rejected: entries.filter(x => x.status === "REJECTED").length };
  });
  return NextResponse.json({ success: true, data: { students, assignments, total, pending, verified, rejected, completionRate: total ? Math.round(verified / total * 100) : 0, weeklySubmissions, monthlySubmissions: recent.length, activity } });
}
