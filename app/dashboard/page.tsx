import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: samples } = await supabase
    .from("samples")
    .select("id, token, patient_name, status, result_flag, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-slate-900">Samples</h1>
          <Link
            href="/dashboard/samples/new"
            className="rounded-md bg-teal-800 text-white px-4 py-2 text-sm font-medium"
          >
            + Register Sample
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {samples?.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{s.patient_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.token}</td>
                  <td className="px-4 py-3 capitalize">{s.status.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        s.result_flag === "abnormal"
                          ? "text-red-600 font-medium"
                          : s.result_flag === "normal"
                          ? "text-emerald-700 font-medium"
                          : "text-slate-400"
                      }
                    >
                      {s.result_flag}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/samples/${s.id}`} className="text-teal-800 underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {!samples?.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    No samples yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
