/**
 * src/smart-blob.ts
 * ─────────────────
 * Renders a FileData entry to HTML for use inside the user's EJS snippet.
 *
 * isInline  → <img> with cid: (email) or dataUrl (preview)
 * isAttach  → empty string in email context — the file goes as a MIME
 *             attachment; nothing is injected into the body unless the
 *             template explicitly references <%= varName %>
 */

import { FileData } from './types';
import { escHtml }  from './utils';

export function render(fd: FileData | null, forEmail: boolean): string {
  if (!fd?.name) return '';
  return fd.isInline ? renderInline(fd, forEmail) : renderAttach(fd, forEmail);
}

function renderInline(fd: FileData, forEmail: boolean): string {
  const src = forEmail ? `cid:${fd.cid}` : fd.dataUrl;
  return `<img src="${src}" alt="${escHtml(fd.name)}" style="max-width:100%;display:block;"/>`;
}

function renderAttach(fd: FileData, forEmail: boolean): string {
  if (forEmail) {
    // Attachment goes as a MIME part — no auto-injection into the body.
    // Templates can use <%= varName_data.name %> to reference it explicitly.
    return '';
  }
  // Browser preview only: provide a download link so the user can verify.
  return `<a href="${fd.dataUrl}" download="${escHtml(fd.name)}" style="color:#0066cc;">${escHtml(fd.name)}</a>`;
}
