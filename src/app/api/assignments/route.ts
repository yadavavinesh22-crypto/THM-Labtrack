import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const currentUser = session.user.role === Role.STUDENT ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { batchId: true } }) : null;
    const assignments = session.user.role === Role.STUDENT
      ? await prisma.assignment.findMany({
          where: { deadline: { gte: new Date() }, OR: [{ batchId: null }, ...(currentUser?.batchId ? [{ batchId: currentUser.batchId }] : [])] },
          orderBy: { deadline: "asc" },
          include: { submissions: { where: { studentId: session.user.id }, select: { id: true, status: true, submittedAt: true, feedback: true } } }
        })
      : await prisma.assignment.findMany({
          orderBy: { deadline: "asc" },
          include: { _count: { select: { submissions: true } } }
        });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    console.error("[ASSIGNMENTS_GET]", error);
    return NextResponse.json({ success: false, error: "Unable to load assignments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  if (session.user.role !== Role.MANAGER) return NextResponse.json({ success: false, error: "Manager access required." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const room = typeof body.thmRoomUrl === "string" ? body.thmRoomUrl : "";
  const deadline = new Date(body.deadline);
  let url: URL | null = null; try { url = new URL(room); } catch {}
  if (title.length < 3 || title.length > 120 || !description || description.length > 5000 || !url || url.protocol !== "https:" || !["tryhackme.com", "www.tryhackme.com"].includes(url.hostname) || Number.isNaN(deadline.getTime())) return NextResponse.json({ success: false, error: "Provide a valid title, description, TryHackMe HTTPS room URL, and deadline." }, { status: 400 });
  try {
    const assignment = await prisma.assignment.create({ data: { title, description, thmRoomUrl: url.toString(), deadline, batchId: typeof body.batchId === "string" && body.batchId ? body.batchId : null } });
    const students = await prisma.user.findMany({ where: { role: Role.STUDENT, ...(assignment.batchId ? { batchId: assignment.batchId } : {}) }, select: { id: true } });
    if (students.length) await prisma.notification.createMany({ data: students.map(u => ({ userId: u.id, title: "New lab assignment", message: `${title} has been assigned. Deadline: ${deadline.toLocaleString()}.` })) });
    await prisma.auditLog.create({ data: { actorId: session.user.id, action: "ASSIGNMENT_CREATED", entity: "Assignment", entityId: assignment.id } });
    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: "Could not create assignment. Check the selected batch." }, { status: 400 }); }
}
