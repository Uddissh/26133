import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">HexaSync</h1>
        <p className="text-slate-500">Newborn Screening &amp; Genetic Report Tracking Platform</p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="rounded-md bg-teal-800 text-white px-5 py-2.5 text-sm font-medium">
            Staff Login
          </Link>
          <Link
            href="/status"
            className="rounded-md border border-teal-800 text-teal-800 px-5 py-2.5 text-sm font-medium"
          >
            Check Report Status
          </Link>
        </div>
      </div>
    </main>
  );
}
