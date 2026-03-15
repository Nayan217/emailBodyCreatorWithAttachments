/**
 * src/utils.ts
 * ────────────
 * Shared utilities used across server-side modules.
 */

export function escHtml(s: unknown): string {
  return String(s)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}
