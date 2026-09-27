import type { NextRequest } from "next/server";
import { getStore } from "@/lib/db";
import { json, requireAdmin, sameOrigin } from "@/lib/server";
import { invalidateRows } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);

  const body = (await req.json().catch(() => ({}))) as { confirm?: unknown };
  if (body.confirm !== "RESET") return json({ error: "confirmation_required" }, 400);

  await getStore().clearAll();
  invalidateRows();
  return json({ ok: true });
}
