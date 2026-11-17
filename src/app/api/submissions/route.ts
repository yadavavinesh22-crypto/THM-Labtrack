import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { randomUUID, createHash } from "node:crypto";
import { authOptions } from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import { cloudinary, cloudinaryReady } from "@/lib/cloudinary";
import { submissionSchema } from "@/lib/validators";
import { rateLimit, safeUrl, tooManyRequests } from "@/lib/security";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const signatures: Record<string, (buffer: Buffer) => boolean> = {
  "image/jpeg": (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  "image/webp": (b) => b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const where = session.user.role === Role.MANAGER
      ? {}
      : { studentId: session.user.id };

    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      include: {
        student: { select: { id: true, name: true, email: true } },
        assignment: { select: { id: true, title: true, thmRoomUrl: true, deadline: true } }
      }
    });

    return NextResponse.json({ success: true, data: submissions });
  } catch (error) {
    console.error("[SUBMISSIONS_GET]", error);
    return NextResponse.json({ success: false, error: "Unable to load submissions." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    if (!rateLimit(`submit:${session.user.id}`, 8, 60_000)) return tooManyRequests();
    
    if (session.user.role !== Role.STUDENT) {
      return NextResponse.json({ success: false, error: "Only students can submit labs." }, { status: 403 });
    }

    if (!cloudinaryReady()) {
      return NextResponse.json({ success: false, error: "Image storage is not configured. Add Cloudinary credentials." }, { status: 503 });
    }

    const form = await request.formData();
    const parsed = submissionSchema.safeParse({
      assignmentId: form.get("assignmentId"),
      submittedUrl: form.get("submittedUrl"),
      confirmation: form.get("confirmation"),
      customLabName: form.get("customLabName"), // Naya field
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues.map((i) => i.message).join(" ") }, { status: 400 });
    }

    const file = form.get("proofImage");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: "Screenshot proof is required." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "Screenshot must be 5 MB or smaller." }, { status: 400 });
    }
    if (!signatures[file.type]) {
      return NextResponse.json({ success: false, error: "Only JPEG, PNG and WebP images are accepted." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!signatures[file.type](buffer)) {
      return NextResponse.json({ success: false, error: "The uploaded file is not a valid image." }, { status: 400 });
    }

    if (!safeUrl(parsed.data.submittedUrl, ["tryhackme.com"])) {
      return NextResponse.json({ success: false, error: "Submission link must be hosted on TryHackMe." }, { status: 400 });
    }

    let assignment = null;
    // Agar assignmentId hai, tabhi check karo
    if (parsed.data.assignmentId) {
      assignment = await prisma.assignment.findUnique({
        where: { id: parsed.data.assignmentId },
        select: { id: true, deadline: true }
      });
      if (!assignment) {
        return NextResponse.json({ success: false, error: "Assignment not found." }, { status: 404 });
      }
      if (assignment.deadline < new Date()) {
        return NextResponse.json({ success: false, error: "Assignment deadline has passed." }, { status: 400 });
      }
    }

    // Check karo agar pehle se submit kiya hai (Sirf assigned assignment ke liye)
    let existing = null;
    if (assignment) {
      existing = await prisma.submission.findUnique({
        where: {
          studentId_assignmentId: {
            studentId: session.user.id,
            assignmentId: assignment.id
          }
        }
      });
      if (existing && existing.status !== "REJECTED") {
        return NextResponse.json({ success: false, error: "Only rejected submissions can be resubmitted. Contact a manager if a correction is needed." }, { status: 409 });
      }
    }

    const proofHash = createHash("sha256").update(buffer).digest("hex");
    const upload = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "thm-labtrack/proofs",
          public_id: randomUUID(),
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
          transformation: [{ width: 1800, height: 1800, crop: "limit" }]
        },
        (error, result) => {
          if (error || !result) reject(error || new Error("Cloud image upload failed."));
          else resolve({ secure_url: result.secure_url });
        }
      );
      stream.end(buffer);
    });

    const submission = existing ? await prisma.submission.update({
      where: { id: existing.id },
      data: { submittedUrl: parsed.data.submittedUrl, proofImageUrl: upload.secure_url, proofHash, status: "PENDING", feedback: null, reviewedAt: null, submittedAt: new Date(), attemptCount: { increment: 1 } },
      select: { id: true, status: true, submittedAt: true, proofImageUrl: true, attemptCount: true }
    }) : await prisma.submission.create({
      data: { 
        studentId: session.user.id, 
        assignmentId: assignment ? assignment.id : null, 
        customLabName: assignment ? null : parsed.data.customLabName, 
        submittedUrl: parsed.data.submittedUrl, 
        proofImageUrl: upload.secure_url, 
        proofHash 
      },
      select: { id: true, status: true, submittedAt: true, proofImageUrl: true, attemptCount: true }
    });

    await prisma.auditLog.create({ data: { actorId: session.user.id, action: existing ? "SUBMISSION_RESUBMITTED" : "SUBMISSION_CREATED", entity: "Submission", entityId: submission.id } });

    return NextResponse.json({ success: true, message: existing ? "Resubmission received and queued for review." : "Submission received and queued for review.", data: submission }, { status: 201 });

  } catch (error: unknown) {
    console.error("[SUBMISSION_POST]", error);
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ success: false, error: "You have already submitted this assignment." }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "Submission could not be processed. Check server logs and try again." }, { status: 500 });
  }
}
