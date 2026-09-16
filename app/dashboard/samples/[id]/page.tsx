import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function addResult(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const sample_id = formData.get("sample_id") as string;
  const test_type = formData.get("test_type") as string;
  const value = Number(formData.get("value"));
  const unit = formData.get("unit") as string;

  const { error } = await supabase
    .from("test_results")
    .insert({ sample_id, test_type, value, unit });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/samples/${sample_id}`);
}

async function uploadReport(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const sample_id = formData.get("sample_id") as string;
  const file = formData.get("file") as File;
  if (!file || file.size === 0) return;

  const path = `${sample_id}.pdf`;
  const { error: upErr } = await supabase.storage
    .from("reports")
    .upload(path, file, { upsert: true, contentType: "application/pdf" });
  if (upErr) throw new Error(upErr.message);

  const { error } = await supabase.from("samples").update({ report_path: path }).eq("id", sample_id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/samples/${sample_id}`);
}

export default async function SampleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sample } = await supabase
    .from("samples")
    .select("*")
    .eq("id", id)
    .single();

  const { data: ranges } = await supabase.from("reference_ranges").select("*");
  const { data: results } = await supabase
    .from("test_results")
    .select("*")
    .eq("sample_id", id)
    .order("created_at", { ascending: false });

  if (!sample) return <main className="p-10">Sample not found.</main>;

  const statusUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/status/${sample.token}`;
  const qrDataUrl = await QRCode.toDataURL(statusUrl, { width: 220, margin: 1 });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{sample.patient_name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Status: <span className="capitalize">{sample.status.replace("_", " ")}</span> · Result:{" "}
              <span
                className={
                  sample.result_flag === "abnormal"
                    ? "text-red-600 font-medium"
                    : sample.result_flag === "normal"
                    ? "text-emerald-700 font-medium"
                    : "text-slate-400"
                }
              >
                {sample.result_flag}
              </span>
            </p>
            <p className="text-xs font-mono text-slate-400 mt-1">{sample.token}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Sample QR code" width={110} height={110} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Enter Test Result</h2>
          <form action={addResult} className="flex flex-wrap gap-3 items-end">
            <input type="hidden" name="sample_id" value={sample.id} />
            <div>
              <label className="block text-xs text-slate-500 mb-1">Test</label>
              <select name="test_type" required className="rounded-md border border-slate-300 px-2 py-2 text-sm">
                {ranges?.map((r) => (
                  <option key={r.test_type} value={r.test_type}>
                    {r.test_type} ({r.min}-{r.max} {r.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Value</label>
              <input
                name="value"
                type="number"
                step="any"
                required
                className="w-28 rounded-md border border-slate-300 px-2 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Unit</label>
              <input name="unit" required className="w-24 rounded-md border border-slate-300 px-2 py-2 text-sm" />
            </div>
            <button className="rounded-md bg-teal-800 text-white px-4 py-2 text-sm font-medium">Save</button>
          </form>

          <ul className="mt-4 text-sm text-slate-600 space-y-1">
            {results?.map((r) => (
              <li key={r.id}>
                {r.test_type}: {r.value} {r.unit}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Upload Report (PDF)</h2>
          <form action={uploadReport} className="flex items-center gap-3">
            <input type="hidden" name="sample_id" value={sample.id} />
            <input type="file" name="file" accept="application/pdf" required className="text-sm" />
            <button className="rounded-md bg-teal-800 text-white px-4 py-2 text-sm font-medium">Upload</button>
          </form>
          {sample.report_path && <p className="text-xs text-emerald-700 mt-2">Report on file.</p>}
        </div>
      </div>
    </main>
  );
}
