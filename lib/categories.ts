export const CATEGORY_KEYS = [
  "coffee",
  "food",
  "shopping",
  "gifts",
  "entertainment",
  "outings",
  "other",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export type CategoryMeta = {
  key: CategoryKey;
  emoji: string;
  color: string;
  kind: "experience" | "thing" | "other";
  label: { ar: string; en: string };
  // للقهوة / coffee
  to: { ar: string; en: string };
  // القهوة / coffee
  al: { ar: string; en: string };
};

export const CATEGORIES: Record<CategoryKey, CategoryMeta> = {
  coffee: { key: "coffee", emoji: "☕", color: "#11494C", kind: "experience", label: { ar: "قهوة", en: "Coffee" }, to: { ar: "للقهوة", en: "coffee" }, al: { ar: "القهوة", en: "coffee" } },
  food: { key: "food", emoji: "🍔", color: "#3AABB1", kind: "experience", label: { ar: "أكل", en: "Food" }, to: { ar: "للأكل", en: "food" }, al: { ar: "الأكل", en: "food" } },
  shopping: { key: "shopping", emoji: "🛍️", color: "#E7B113", kind: "thing", label: { ar: "تسوق", en: "Shopping" }, to: { ar: "للتسوق", en: "shopping" }, al: { ar: "التسوق", en: "shopping" } },
  gifts: { key: "gifts", emoji: "🎁", color: "#0E1011", kind: "thing", label: { ar: "هدايا", en: "Gifts" }, to: { ar: "للهدايا", en: "gifts" }, al: { ar: "الهدايا", en: "gifts" } },
  entertainment: { key: "entertainment", emoji: "🎮", color: "#2A8C92", kind: "experience", label: { ar: "ترفيه", en: "Entertainment" }, to: { ar: "للترفيه", en: "entertainment" }, al: { ar: "الترفيه", en: "entertainment" } },
  outings: { key: "outings", emoji: "🚗", color: "#7FC9CE", kind: "experience", label: { ar: "طلعات", en: "Outings" }, to: { ar: "للطلعات", en: "outings" }, al: { ar: "الطلعات", en: "outings" } },
  other: { key: "other", emoji: "✨", color: "#9FB1B7", kind: "other", label: { ar: "شي ثاني", en: "Something else" }, to: { ar: "لأفكار خارج القائمة", en: "ideas off the list" }, al: { ar: "أفكار ثانية", en: "other ideas" } },
};

export function isCategoryKey(v: unknown): v is CategoryKey {
  return typeof v === "string" && (CATEGORY_KEYS as readonly string[]).includes(v);
}
