"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function registerSample(formData: FormData) {
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

export async function addResult(formData: FormData) {
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

export async function uploadReport(formData: FormData) {
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
