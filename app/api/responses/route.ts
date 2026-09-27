import type { NextRequest } from "next/server";
import { getStore } from "@/lib/db";
import { normalizeWriteIn, validateSubmission } from "@/lib/sanitize";
import { clientIp, getStatRows, json, rateLimit, sameOrigin } from "@/lib/server";
import { computeStats, invalidateRows } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 2048) return json({ error: "too_large" }, 413);
  if (!rateLimit(`submit:${clientIp(req)}`, 6, 60_000)) return json({ error: "rate_limited" }, 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const v = validateSubmission(body);
  if (!v.ok) return json({ error: v.error }, 400);

  try {
    const store = getStore();
    const id = await store.insertResponse(v.value);
    if (v.value.custom_text) {
      // write-ins are a nice-to-have, don't fail the submit over them
      await store
        .insertCustomAnswer({
          response_id: id,
          text: v.value.custom_text,
          normalized: normalizeWriteIn(v.value.custom_text),
          lang: v.value.lang,
        })
        .catch((e) => console.warn("[96] custom answer not stored", e));
    }
    invalidateRows();
    const stats = computeStats(await getStatRows(true));
    return json({ ok: true, stats }, 201);
  } catch (e) {
    console.error("[96] submit failed", e);
    return json({ error: "server_error" }, 500);
  }
}

export function GET() {
  return json({ error: "method_not_allowed" }, 405);
}
