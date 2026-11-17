import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET() {
 const session = await getServerSession(authOptions);
 if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
 const users = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true, name: true, batch: { select: { name: true } }, submissions: { where: { status: "VERIFIED" }, select: { id: true, submittedAt: true } } } });
 const data = users.map(u => ({ id: u.id, name: u.name, batch: u.batch?.name ?? "Unassigned", points: u.submissions.length * 10, verifiedLabs: u.submissions.length, recentPoints: u.submissions.filter(s => s.submittedAt >= new Date(Date.now() - 7 * 86400000)).length * 10 })).sort((a,b) => b.points-a.points || b.verifiedLabs-a.verifiedLabs).map((u,i)=>({...u, rank:i+1}));
 return NextResponse.json({ success: true, data });
}
