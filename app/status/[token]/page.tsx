import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function StatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_sample_status", { p_token: token }).single();

  const result = data as
    | { patient_name: string; status: string; result_flag: string; has_report: boolean }
    | null;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
        <h1 className="text-lg font-semibold text-slate-900">Screening Report Status</h1>
        {error || !result ? (
          <p className="text-sm text-slate-500">No sample found for this code. Check the QR/ID and try again.</p>
        ) : (
          <>
            <p className="text-sm text-slate-500">{result.patient_name}</p>
            <p className="text-2xl font-semibold capitalize text-slate-900">
              {result.status.replace("_", " ")}
            </p>
            <p
              className={
                result.result_flag === "abnormal"
                  ? "text-red-600 font-medium"
                  : result.result_flag === "normal"
                  ? "text-emerald-700 font-medium"
                  : "text-slate-400"
              }
            >
              Result: {result.result_flag}
            </p>
            {result.status === "ready" && result.has_report && (
              <a
                href={`/api/report/${token}`}
                className="inline-block mt-2 rounded-md bg-teal-800 text-white px-4 py-2 text-sm font-medium"
              >
                View Report (PDF)
              </a>
            )}
          </>
        )}
        <Link href="/status" className="block text-xs text-slate-400 underline mt-4">
          Check another sample
        </Link>
      </div>
    </main>
  );
}
