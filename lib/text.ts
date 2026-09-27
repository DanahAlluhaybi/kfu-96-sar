// emoji render badly on windows (the flag shows up as "SA"), so strip them
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{23F0}-\u{23FF}\u{231A}\u{231B}\u{FE0F}\u{200D}]/gu;
export function stripEmoji(s: string): string {
  return s.replace(EMOJI, "").replace(/\s{2,}/g, " ").replace(/\s+([.،,!؟?])/g, "$1").trim();
}
