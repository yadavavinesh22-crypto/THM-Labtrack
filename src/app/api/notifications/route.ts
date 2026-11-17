import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET() {
 const session = await getServerSession(authOptions);
 if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
 const data = await prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 50 });
 return NextResponse.json({ success: true, data });
}
export async function PATCH(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
 const body = await req.json().catch(() => ({}));
 if (body.all === true) await prisma.notification.updateMany({ where: { userId: session.user.id, readAt: null }, data: { readAt: new Date() } });
 else if (typeof body.id === "string") await prisma.notification.updateMany({ where: { id: body.id, userId: session.user.id }, data: { readAt: new Date() } });
 else return NextResponse.json({ error: "Provide notification id or all=true." }, { status: 400 });
 return NextResponse.json({ success: true });
}
