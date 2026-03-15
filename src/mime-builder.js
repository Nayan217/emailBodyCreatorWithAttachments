/**
 * src/mime-builder.js — RFC 2045 / 2046 / 2183 / 2387
 */
const CRLF = '\r\n';
const { escHtml } = require('./utils');

const makeBoundary = tag => `${tag}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

function chunkBase64(b64) {
  return (b64.match(/.{1,76}/g) || []).join(CRLF);
}

function quotedPrintable(str) {
  const buf = Buffer.from(str, 'utf8');
  let out = '', line = '';
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    if (byte === 0x0d) continue;
    if (byte === 0x0a) { out += line + CRLF; line = ''; continue; }
    let enc;
    if (byte === 0x09 || byte === 0x20)                      enc = String.fromCharCode(byte);
    else if (byte >= 0x21 && byte <= 0x7e && byte !== 0x3d) enc = String.fromCharCode(byte);
    else enc = '=' + byte.toString(16).toUpperCase().padStart(2, '0');
    if (line.length + enc.length >= 75) { out += line + '=' + CRLF; line = ''; }
    line += enc;
  }
  if (line) out += line;
  return out;
}

function encodeHeader(s) {
  if (!s) return '';
  return /^[\x00-\x7f]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`;
}

function htmlToPlain(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

/**
 * Wraps the rendered snippet in the bare minimum needed for a valid HTML email.
 * No added headers, footers, attachment lists, or styles beyond what the
 * snippet itself contains.
 */
function buildHtmlBody(snippetHtml) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body>${snippetHtml}</body>
</html>`;
}

// ── MIME part builders ──────────────────────────────────────────────────────
function altParts(bAlt, plain, html) {
  return `--${bAlt}${CRLF}Content-Type: text/plain; charset=UTF-8${CRLF}Content-Transfer-Encoding: 7bit${CRLF}${CRLF}${plain}${CRLF}`
       + `--${bAlt}${CRLF}Content-Type: text/html; charset=UTF-8${CRLF}Content-Transfer-Encoding: quoted-printable${CRLF}${CRLF}${quotedPrintable(html)}${CRLF}`;
}

function relatedParts(bRel, bAlt, plain, html, inlines) {
  let s = `--${bRel}${CRLF}Content-Type: multipart/alternative; boundary="${bAlt}"${CRLF}${CRLF}`;
  s += altParts(bAlt, plain, html);
  s += `--${bAlt}--${CRLF}${CRLF}`;
  for (const f of inlines) {
    s += `--${bRel}${CRLF}Content-Type: ${f.type}; name="${f.name}"${CRLF}`;
    s += `Content-Transfer-Encoding: base64${CRLF}`;
    s += `Content-ID: <${f.cid}>${CRLF}`;
    s += `Content-Disposition: inline; filename="${f.name}"${CRLF}${CRLF}`;
    s += chunkBase64(f.base64) + CRLF + CRLF;
  }
  return s;
}

function attachPart(f) {
  return `Content-Type: ${f.type}; name="${f.name}"${CRLF}`
       + `Content-Transfer-Encoding: base64${CRLF}`
       + `Content-Disposition: attachment; filename="${f.name}"${CRLF}${CRLF}`
       + chunkBase64(f.base64) + CRLF + CRLF;
}

// ── Main builder ────────────────────────────────────────────────────────────
function build({ htmlBody, allFiles, from, to, cc, subject }) {
  const inlines     = allFiles.filter(f => f.isInline);
  const attachments = allFiles.filter(f => f.isAttach);
  const hasInlines  = inlines.length > 0;
  const hasAttach   = attachments.length > 0;
  const plain       = htmlToPlain(htmlBody);
  const bMixed = makeBoundary('MIXED'), bRel = makeBoundary('REL'), bAlt = makeBoundary('ALT');

  let eml = `MIME-Version: 1.0${CRLF}Date: ${new Date().toUTCString()}${CRLF}`;
  eml += `From: ${encodeHeader(from)}${CRLF}To: ${encodeHeader(to)}${CRLF}`;
  if (cc) eml += `CC: ${encodeHeader(cc)}${CRLF}`;
  eml += `Subject: ${encodeHeader(subject)}${CRLF}`;

  if (!hasInlines && !hasAttach) {
    eml += `Content-Type: multipart/alternative; boundary="${bAlt}"${CRLF}${CRLF}`;
    eml += altParts(bAlt, plain, htmlBody) + `--${bAlt}--${CRLF}`;
  } else if (!hasAttach) {
    eml += `Content-Type: multipart/related; boundary="${bRel}"; type="multipart/alternative"${CRLF}${CRLF}`;
    eml += relatedParts(bRel, bAlt, plain, htmlBody, inlines) + `--${bRel}--${CRLF}`;
  } else if (!hasInlines) {
    eml += `Content-Type: multipart/mixed; boundary="${bMixed}"${CRLF}${CRLF}`;
    eml += `--${bMixed}${CRLF}Content-Type: multipart/alternative; boundary="${bAlt}"${CRLF}${CRLF}`;
    eml += altParts(bAlt, plain, htmlBody) + `--${bAlt}--${CRLF}${CRLF}`;
    attachments.forEach(a => { eml += `--${bMixed}${CRLF}` + attachPart(a); });
    eml += `--${bMixed}--${CRLF}`;
  } else {
    eml += `Content-Type: multipart/mixed; boundary="${bMixed}"${CRLF}${CRLF}`;
    eml += `--${bMixed}${CRLF}Content-Type: multipart/related; boundary="${bRel}"; type="multipart/alternative"${CRLF}${CRLF}`;
    eml += relatedParts(bRel, bAlt, plain, htmlBody, inlines) + `--${bRel}--${CRLF}${CRLF}`;
    attachments.forEach(a => { eml += `--${bMixed}${CRLF}` + attachPart(a); });
    eml += `--${bMixed}--${CRLF}`;
  }
  return eml;
}

module.exports = { build, buildHtmlBody };
