import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-black tracking-tight text-slate-950">THM<span className="text-blue-600">LabTrack</span></Link>
        <Link href="/login" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Login</Link>
      </nav>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-20 md:grid-cols-2 md:pt-28">
        <div>
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">College lab management</span>
          <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">Your daily labs.<br/><span className="text-blue-600">Clearly tracked.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">A single place for students to submit TryHackMe lab work and for managers to review progress, verify evidence, and provide feedback.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">Access dashboard</Link>
            <Link href="/register" className="rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50">Student signup</Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">For enrolled students and authorized college managers.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-soft">
          <div className="rounded-2xl bg-slate-950 p-6 text-white">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold">Submission overview</span><span className="rounded-full bg-emerald-400/15 px-2 py-1 text-xs text-emerald-300">Live workflow</span></div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-4"><p className="text-xs text-slate-300">Status</p><p className="mt-2 text-2xl font-bold">Pending</p></div>
              <div className="rounded-xl bg-white/10 p-4"><p className="text-xs text-slate-300">Evidence</p><p className="mt-2 text-2xl font-bold">Attached</p></div>
            </div>
            <div className="mt-4 rounded-xl bg-white/10 p-4"><div className="flex justify-between text-sm"><span>Linux Fundamentals</span><span className="text-amber-300">In review</span></div><div className="mt-3 h-2 rounded-full bg-white/15"><div className="h-2 w-3/4 rounded-full bg-blue-400"/></div></div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs font-semibold text-slate-600">
            <div className="rounded-xl bg-white p-3">Submit proof</div><div className="rounded-xl bg-white p-3">Manager review</div><div className="rounded-xl bg-white p-3">Get feedback</div>
          </div>
        </div>
      </section>
      <section className="border-t border-slate-100 bg-slate-50 px-6 py-14"><div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        {[["01","Submit labs","Share the room URL and a screenshot of your completed work."],["02","Review evidence","Managers see submissions in one organized queue."],["03","Track outcomes","Students can see whether work is pending, verified, or rejected."]].map(([n,t,d])=><div key={n}><p className="text-sm font-bold text-blue-600">{n}</p><h2 className="mt-2 text-lg font-bold">{t}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{d}</p></div>)}
      </div></section>
      <footer className="px-6 py-8 text-center text-xs text-slate-400">THM LabTrack · College lab submission portal</footer>
    </main>
  );
}
