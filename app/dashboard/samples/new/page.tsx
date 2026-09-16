import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function registerSample(formData: FormData) {
  "use server";
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const { data: staffRow } = await supabase
    .from("staff")
    .select("hospital_id")
    .eq("id", userData.user?.id)
    .single();

  if (!staffRow) throw new Error("Staff record not found for this user.");

  const { data, error } = await supabase
    .from("samples")
    .insert({
      patient_name: formData.get("patient_name") as string,
      guardian_contact: formData.get("guardian_contact") as string,
      hospital_id: staffRow.hospital_id,
      created_by: userData.user?.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/dashboard/samples/${data.id}`);
}

export default function NewSamplePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <form
        action={registerSample}
        className="max-w-md mx-auto bg-white rounded-xl border border-slate-200 p-8 space-y-4"
      >
        <h1 className="text-xl font-semibold text-slate-900">Register Sample</h1>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Patient / Baby Name</label>
          <input
            name="patient_name"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Guardian Contact (optional)</label>
          <input
            name="guardian_contact"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-teal-800 text-white py-2 text-sm font-medium"
        >
          Register &amp; Generate QR
        </button>
      </form>
    </main>
  );
}
