import { getStore } from "@/lib/db";
import { loadNdStats, sortStats } from "@/lib/nd";
import { json } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const all = await loadNdStats(getStore());
  return json({ stats: sortStats(all.filter((s) => s.status === "active")) });
}
