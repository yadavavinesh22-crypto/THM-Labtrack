import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { rateLimit, tooManyRequests } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!rateLimit(`register:${ip}`, 5, 60 * 60_000)) return tooManyRequests();
    if (process.env.ALLOW_STUDENT_SIGNUP === "false") {
      return NextResponse.json(
        { success: false, error: "Student registration is currently closed." },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const data = registerSchema.parse(body);
    const email = data.email.toLowerCase();

    const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || "").split(",").map(v => v.trim().toLowerCase()).filter(Boolean);
    if (allowedDomains.length && !allowedDomains.includes(email.split("@")[1])) return NextResponse.json({ success: false, error: "Use an approved college email address." }, { status: 403 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const password = await hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        password,
        role: "STUDENT"
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    await prisma.auditLog.create({ data: { actorId: user.id, action: "STUDENT_REGISTERED", entity: "User", entityId: user.id } });
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER]", error);
    const message = error instanceof Error ? error.message : "Registration failed.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
