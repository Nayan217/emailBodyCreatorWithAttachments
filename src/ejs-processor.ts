/**
 * src/ejs-processor.ts
 * ────────────────────
 * Server-side EJS rendering using the official `ejs` npm package.
 *
 * Data context built from fileDataList:
 *   [varName]        → SafeString wrapping the rendered HTML for that file
 *   [varName]_data   → raw FileData object (for .name, .size, etc.)
 *   [key]            → plain string value from the Variables table
 *
 * SafeString pattern:
 *   ejs's <%= %> calls our custom escape() on every value.
 *   SafeString instances pass through unescaped so pre-built HTML
 *   (e.g. <img> tags) renders correctly — identical to Handlebars'
 *   SafeString and EJS's own internal escapeXML behaviour.
 */

import ejs from 'ejs';
import { FileData } from './types';
import { render as renderBlob } from './smart-blob';

// ── SafeString ────────────────────────────────────────────────────────────

class SafeString {
  readonly value: string;
  constructor(v: unknown) { this.value = String(v); }
  toString(): string      { return this.value; }
}

// ── Escape function ───────────────────────────────────────────────────────

function escapeHtml(s: unknown): string {
  if (s instanceof SafeString) return s.toString();
  return String(s)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

// ── Main renderer ─────────────────────────────────────────────────────────

/**
 * Renders the user's EJS snippet with the full data context.
 *
 * @param snippet       - EJS template string
 * @param fileDataList  - one FileData entry per attachment row
 * @param plainVars     - { key: value } plain text variables from the Variables table
 * @param forEmail      - true → cid: refs / blank attach; false → dataUrl (preview)
 */
export function render(
  snippet:      string,
  fileDataList: FileData[],
  plainVars:    Record<string, string>,
  forEmail:     boolean,
): string {
  const data: Record<string, unknown> = {};

  // Plain key/value variables — available directly as <%= key %>
  Object.assign(data, plainVars);

  for (const fd of fileDataList) {
    if (!fd.varName) continue;
    // The variable → SafeString so <%= varName %> doesn't double-escape HTML
    data[fd.varName]          = new SafeString(renderBlob(fd, forEmail));
    // _data suffix → raw FileData for property access in the template
    data[`${fd.varName}_data`] = fd;
  }

  return ejs.render(snippet, data, {
    escape:       escapeHtml,
    rmWhitespace: false,
  });
}
