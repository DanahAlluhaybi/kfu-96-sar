import type { NextRequest } from "next/server";
import { CATEGORIES } from "@/lib/categories";
import { getStore } from "@/lib/db";
import { requireAdmin } from "@/lib/server";

export const dynamic = "force-dynamic";

function cell(v: string) {
  // stop excel from treating cells as formulas
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function riyadh(iso: string) {
  const d = new Date(new Date(iso).getTime() + 3 * 3600_000);
  return d.toISOString().replace("T", " ").slice(0, 19);
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const rows = await getStore().allResponses();
  const header = ["id", "created_at_utc", "created_at_riyadh", "categories", "categories_ar", "categories_en", "custom_text", "lang"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.created_at,
        riyadh(r.created_at),
        r.categories.join(";"),
        r.categories.map((c) => CATEGORIES[c]?.label.ar ?? c).join("؛ "),
        r.categories.map((c) => CATEGORIES[c]?.label.en ?? c).join("; "),
        r.custom_text ?? "",
        r.lang,
      ]
        .map((v) => cell(String(v)))
        .join(","),
    );
  }
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  // BOM so excel reads the arabic properly
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="96-sar-responses-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
