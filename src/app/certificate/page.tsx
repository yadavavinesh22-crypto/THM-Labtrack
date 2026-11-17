import {getServerSession} from "next-auth";
import {redirect} from "next/navigation";
import {authOptions} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {Role} from "@prisma/client";
import {PrintButton} from "@/components/PrintButton";
export default async function CertificatePage(){
 const s=await getServerSession(authOptions);if(!s?.user?.id)redirect("/login");if(s.user.role!==Role.STUDENT)redirect("/manager");
 const [user,batch,allAssignments]=await Promise.all([prisma.user.findUnique({where:{id:s.user.id},select:{name:true}}),prisma.user.findUnique({where:{id:s.user.id},select:{batchId:true}}),prisma.assignment.findMany({select:{id:true,title:true,batchId:true}})]);
 const assignments=allAssignments.filter(a=>a.batchId===null||(batch?.batchId&&a.batchId===batch.batchId));
 const verified=await prisma.submission.findMany({where:{studentId:s.user.id,status:"VERIFIED"},select:{assignmentId:true}});const done=new Set(verified.map(x=>x.assignmentId));const complete=assignments.length>0&&assignments.every(a=>done.has(a.id));
 return <main className="min-h-screen bg-slate-100 p-6"><div className="mx-auto max-w-4xl"><div className="mb-4 flex justify-between"><a href="/dashboard" className="text-sm text-blue-600 underline">← Dashboard</a>{complete&&<PrintButton/>}</div><section className="border-8 border-double border-slate-700 bg-white p-12 text-center shadow-xl print:shadow-none"><p className="text-sm font-bold tracking-[0.3em] text-blue-700">THM LABTRACK</p><h1 className="mt-10 text-4xl font-black">Certificate of Completion</h1>{complete?<><p className="mt-8 text-lg text-slate-600">This acknowledges that</p><p className="mt-3 text-3xl font-bold">{user?.name}</p><p className="mt-5 text-lg text-slate-600">has completed all currently assigned and verified TryHackMe labs.</p><p className="mt-8 text-sm text-slate-500">{assignments.length} labs verified · Issued {new Date().toLocaleDateString()}</p></>:<><p className="mt-10 text-lg text-slate-600">Certificate not yet available.</p><p className="mt-3 text-sm text-slate-500">Complete and receive verification for every currently assigned lab to unlock it.</p><p className="mt-4 text-sm">Verified {done.size} of {assignments.length}</p></>}</section></div></main>
}
