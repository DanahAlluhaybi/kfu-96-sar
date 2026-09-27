import { CATEGORY_KEYS, isCategoryKey, type CategoryKey } from "./categories";
import { isLang, type Lang } from "./i18n";

export const CUSTOM_MAX = 60;

export function cleanText(input: unknown, max = CUSTOM_MAX): string | null {
  if (typeof input !== "string") return null;
  const t = input
    .normalize("NFC")
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, " ")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F​-‏‪-‮⁦-⁩]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;
  return Array.from(t).slice(0, max).join("");
}

export type ValidSubmission = { categories: CategoryKey[]; custom_text: string | null; lang: Lang };

export function validateSubmission(body: unknown): { ok: true; value: ValidSubmission } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_body" };
  const b = body as Record<string, unknown>;

  // honeypot
  if (typeof b.website === "string" && b.website.length > 0) return { ok: false, error: "rejected" };

  if (!Array.isArray(b.categories)) return { ok: false, error: "categories_required" };
  if (b.categories.length < 1 || b.categories.length > CATEGORY_KEYS.length) return { ok: false, error: "categories_count" };
  if (!b.categories.every(isCategoryKey)) return { ok: false, error: "unknown_category" };
  const categories = CATEGORY_KEYS.filter((k) => (b.categories as string[]).includes(k));

  const custom_text = categories.includes("other") ? cleanText(b.custom) : null;
  const lang: Lang = isLang(b.lang) ? b.lang : "ar";
  return { ok: true, value: { categories, custom_text, lang } };
}

// so "قهوه!!", "القهوة" and "قَهوة" end up as the same thing
export function normalizeWriteIn(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // tashkeel + tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// anything that looks like a link or a prompt injection stays away from the model
export function isSafeForAi(normalized: string): boolean {
  if (!normalized || normalized.length < 2) return false;
  return !/(http|www|\.com|ignore|instruction|prompt|system|assistant|تجاهل|تعليمات)/i.test(normalized);
}
