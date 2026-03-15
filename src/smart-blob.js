/**
 * src/smart-blob.js
 * ─────────────────
 * Renders a FileData entry to HTML for use inside the user's EJS snippet.
 *
 * isInline  → <img> with cid: (email) or dataUrl (preview)
 * isAttach  → empty string — the file goes as a MIME attachment,
 *             nothing is injected into the body unless the template
 *             explicitly uses <%= varName %>
 */
const { escHtml } = require('./utils');

function render(fd, forEmail) {
  if (!fd || !fd.name) return '';
  if (fd.isInline) return renderInline(fd, forEmail);
  return renderAttach(fd, forEmail);
}

function renderInline(fd, forEmail) {
  const src = forEmail ? `cid:${fd.cid}` : fd.dataUrl;
  return `<img src="${src}" alt="${escHtml(fd.name)}" style="max-width:100%;display:block;"/>`;
}

function renderAttach(fd, forEmail) {
  if (forEmail) {
    // File is a MIME attachment — return empty so nothing is auto-injected
    // into the body. The template can reference <%= varName_data.name %> if
    // it wants to mention the file explicitly.
    return '';
  }
  // Browser preview only: offer a download link so the user can verify the file
  return `<a href="${fd.dataUrl}" download="${escHtml(fd.name)}" style="color:#0066cc;">${escHtml(fd.name)}</a>`;
}

module.exports = { render };
