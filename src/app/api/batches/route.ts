import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET() {
 const s = await getServerSession(authOptions); if (!s?.user?.id) return NextResponse.json({error:"Authentication required."},{status:401});
 const data = await prisma.batch.findMany({ orderBy:{name:"asc"}, include:{_count:{select:{users:true,assignments:true}}} });
 return NextResponse.json({success:true,data});
}
export async function POST(req: NextRequest) {
 const s = await getServerSession(authOptions); if (!s?.user?.id) return NextResponse.json({error:"Authentication required."},{status:401}); if(s.user.role!==Role.MANAGER) return NextResponse.json({error:"Manager access required."},{status:403});
 const b=await req.json().catch(()=>({})); if(typeof b.name!=="string"||b.name.trim().length<2||b.name.length>80) return NextResponse.json({error:"Batch name must be 2–80 characters."},{status:400});
 try { const data=await prisma.batch.create({data:{name:b.name.trim(),description:typeof b.description==="string"?b.description.slice(0,500):null}}); await prisma.auditLog.create({data:{actorId:s.user.id,action:"BATCH_CREATED",entity:"Batch",entityId:data.id}}); return NextResponse.json({success:true,data},{status:201}); } catch { return NextResponse.json({error:"Batch name may already exist."},{status:409}); }
}
