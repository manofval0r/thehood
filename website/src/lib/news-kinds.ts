/**
 * Labels for the news beats. Beats are the small set of things a security
 * headline is about, and each maps to a pixel motif that already exists in the
 * motif registry; this file only carries the words, the same split as
 * resource-kinds.ts.
 */

export const BEAT_LABEL: Record<string, string> = {
  threat: "Threat",
  advisory: "Advisory",
  breach: "Breach",
  research: "Analysis",
  region: "Home",
  industry: "Industry",
};

export function beatLabel(beat: string): string {
  return BEAT_LABEL[beat] ?? "News";
}
