import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function PATCH(req: NextRequest, {params}:{params:{id:string}}) {
 const s=await getServerSession(authOptions); if(!s?.user?.id) return NextResponse.json({error:"Authentication required."},{status:401}); if(s.user.role!==Role.MANAGER) return NextResponse.json({error:"Manager access required."},{status:403});
 const b=await req.json().catch(()=>({})); const data:any={};
 if(typeof b.title==="string"&&b.title.trim().length>=3&&b.title.length<=120)data.title=b.title.trim();
 if(typeof b.description==="string"&&b.description.length<=5000)data.description=b.description;
 if(typeof b.deadline==="string"&&!Number.isNaN(new Date(b.deadline).getTime()))data.deadline=new Date(b.deadline);
 if(typeof b.thmRoomUrl==="string"){try{const u=new URL(b.thmRoomUrl);if(u.protocol!=="https:"||!(["tryhackme.com","www.tryhackme.com"].includes(u.hostname)))throw Error();data.thmRoomUrl=u.toString()}catch{return NextResponse.json({error:"Room URL must be an HTTPS TryHackMe URL."},{status:400})}}
 if(typeof b.batchId==="string")data.batchId=b.batchId||null;
 if(!Object.keys(data).length)return NextResponse.json({error:"No valid fields supplied."},{status:400});
 try{const result=await prisma.assignment.update({where:{id:params.id},data});await prisma.auditLog.create({data:{actorId:s.user.id,action:"ASSIGNMENT_UPDATED",entity:"Assignment",entityId:params.id}});return NextResponse.json({success:true,data:result})}catch{return NextResponse.json({error:"Assignment not found or update failed."},{status:404})}
}
export async function DELETE(_req:NextRequest,{params}:{params:{id:string}}){const s=await getServerSession(authOptions);if(!s?.user?.id)return NextResponse.json({error:"Authentication required."},{status:401});if(s.user.role!==Role.MANAGER)return NextResponse.json({error:"Manager access required."},{status:403});try{await prisma.assignment.delete({where:{id:params.id}});await prisma.auditLog.create({data:{actorId:s.user.id,action:"ASSIGNMENT_DELETED",entity:"Assignment",entityId:params.id}});return NextResponse.json({success:true})}catch{return NextResponse.json({error:"Assignment not found or could not be deleted."},{status:404})}}
