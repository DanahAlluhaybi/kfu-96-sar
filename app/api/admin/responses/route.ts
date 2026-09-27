import type { NextRequest } from "next/server";
import { isCategoryKey } from "@/lib/categories";
import { getStore } from "@/lib/db";
import { cleanText } from "@/lib/sanitize";
import { json, requireAdmin } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const q = cleanText(sp.get("q"), 60) ?? undefined;
  const cat = sp.get("category");
  const category = isCategoryKey(cat) ? cat : undefined;
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 200, 1), 1000);

  const result = await getStore().listResponses({ q, category, limit });
  return json(result);
}
