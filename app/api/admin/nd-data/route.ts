import type { NextRequest } from "next/server";
import { getStore } from "@/lib/db";
import { ensureMaterialised, loadNdStats, sortStats, validateNdStat } from "@/lib/nd";
import { json, requireAdmin, sameOrigin } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const store = getStore();
  const [custom, all] = await Promise.all([store.ndStats().catch(() => []), loadNdStats(store)]);
  return json({ stats: sortStats(all), usingSeed: custom.length === 0 });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);
  const v = validateNdStat(await req.json().catch(() => null));
  if (!v.ok) return json({ error: v.error }, 400);
  const store = getStore();
  await ensureMaterialised(store);
  await store.upsertNdStats([v.value]);
  return json({ ok: true, stat: v.value });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return json({ error: "id_required" }, 400);
  const store = getStore();
  await ensureMaterialised(store);
  await store.deleteNdStat(id);
  return json({ ok: true });
}
