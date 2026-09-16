import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: sample, error } = await admin
    .from("samples")
    .select("report_path, status")
    .eq("token", token)
    .single();

  if (error || !sample || sample.status !== "ready" || !sample.report_path) {
    return NextResponse.json({ error: "Report not available" }, { status: 404 });
  }

  const { data: signed, error: signErr } = await admin.storage
    .from("reports")
    .createSignedUrl(sample.report_path, 300); // 5 minutes

  if (signErr || !signed) {
    return NextResponse.json({ error: "Could not generate link" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
