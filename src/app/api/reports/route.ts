import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET() {
 const s=await getServerSession(authOptions); if(!s?.user?.id) return NextResponse.json({error:"Authentication required."},{status:401}); if(s.user.role!==Role.MANAGER) return NextResponse.json({error:"Manager access required."},{status:403});
 const rows=await prisma.submission.findMany({orderBy:{submittedAt:"desc"},include:{student:{select:{name:true,email:true,batch:{select:{name:true}}}},assignment:{select:{title:true,deadline:true}}}});
 const cell=(v:unknown)=>{const raw=String(v??"").replace(/[\r\n]+/g," ");const safe=/^[=+@\-\t]/.test(raw)?`'${raw}`:raw;return `"${safe.replace(/"/g,'""')}"`;};
 const csv=[ ["Student","Email","Batch","Assignment","Status","Submitted At","Deadline","Attempts","Feedback"], ...rows.map(r=>[r.student.name,r.student.email,r.student.batch?.name??"Unassigned",r.assignment?.title,r.status,r.submittedAt.toISOString(),r.assignment.deadline?.toISOString(),r.attemptCount,r.feedback??""]) ].map(row=>row.map(cell).join(",")).join("\r\n");
 await prisma.auditLog.create({data:{actorId:s.user.id,action:"REPORT_EXPORTED",entity:"Submission",details:{count:rows.length}}});
 return new NextResponse(csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=thm-labtrack-report.csv","Cache-Control":"no-store"}});
}
