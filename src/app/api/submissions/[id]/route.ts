import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validators";

type Context = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    // Yahan fix kiya hai: Agar Manager NAHI hai, toh block karo
    if (session.user.role !== Role.MANAGER) {
      return NextResponse.json({ success: false, error: "Manager access required." }, { status: 403 });
    }

    const body: unknown = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues.map((i) => i.message).join(" ") }, { status: 400 });
    }

    const existing = await prisma.submission.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Submission not found." }, { status: 404 });
    }

    const updated = await prisma.submission.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status,
        reviewedAt: new Date(),
        feedback: parsed.data.status === "REJECTED" ? parsed.data.feedback : parsed.data.feedback ?? null
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        assignment: { select: { id: true, title: true } }
      }
    });

    // Yahan fix kiya hai: Agar Self-Practice hai (assignment null hai), toh customLabName use karo
    const labName = updated.assignment?.title || updated.customLabName || "Lab";

    await prisma.notification.create({ 
      data: { 
        userId: existing.studentId, 
        title: `Lab ${parsed.data.status.toLowerCase()}`, 
        message: `${labName}: ${parsed.data.status.toLowerCase()}.${parsed.data.feedback ? ` Feedback: ${parsed.data.feedback}` : ""}` 
      } 
    });

    await prisma.auditLog.create({ 
      data: { 
        actorId: session.user.id, 
        action: `SUBMISSION_${parsed.data.status}`, 
        entity: "Submission", 
        entityId: params.id, 
        details: { studentId: existing.studentId } 
      } 
    });

    return NextResponse.json({ success: true, message: `Submission ${parsed.data.status.toLowerCase()}.`, data: updated });
  } catch (error) {
    console.error("[SUBMISSION_PATCH]", error);
    return NextResponse.json({ success: false, error: "Unable to update submission." }, { status: 500 });
  }
}
