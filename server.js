const express      = require('express');
const multer       = require('multer');
const path         = require('path');
const ejsProcessor = require('./src/ejs-processor');
const mimeBuilder  = require('./src/mime-builder');

const app    = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, 'public')));

/**
 * POST /build
 *
 * FormData fields:
 *   snippet         {string}
 *   emailTitle      {string}
 *   from/to/cc/subject {string}
 *   attachmentMeta  {string} JSON: [{varName, disposition}]  — parallel to files[]
 *   files           {file[]} — one per meta entry, same order
 *
 * disposition values:
 *   'inline'  → image only, cid: reference in HTML (RFC 2387)
 *   'attach'  → Content-Disposition: attachment regardless of type
 */
app.post('/build', upload.array('files', 20), async (req, res) => {
  try {
    const {
      snippet     = '',
      emailTitle  = 'File Shared With You',
      from        = 'sender@example.com',
      to          = 'recipient@example.com',
      cc          = '',
      subject     = '(no subject)',
      attachmentMeta = '[]',
      templateVars   = '[]',
    } = req.body;

    const meta  = JSON.parse(attachmentMeta);   // [{varName, disposition}]
    const files = req.files || [];

    if (meta.length !== files.length) {
      return res.status(400).json({ ok: false, error: 'files and attachmentMeta length mismatch' });
    }

    // Build FileData objects, merging user-chosen disposition into each
    const fileDataList = files.map((f, i) => buildFileData(f, meta[i]));

    // Plain key/value variables: [{key, value}] → {key: value, ...}
    const plainVars = JSON.parse(templateVars)
      .filter(v => v.key)
      .reduce((acc, v) => { acc[v.key] = v.value; return acc; }, {});

    // Render snippet twice
    const snippetPreview = ejsProcessor.render(snippet, fileDataList, plainVars, false);
    const snippetEmail   = ejsProcessor.render(snippet, fileDataList, plainVars, true);

    const htmlBodyPreview = mimeBuilder.buildHtmlBody(snippetPreview);
    const htmlBodyEmail   = mimeBuilder.buildHtmlBody(snippetEmail);

    const eml = mimeBuilder.build({ htmlBody: htmlBodyEmail, allFiles: fileDataList, from, to, cc, subject });

    res.json({ ok: true, eml, htmlBodyEmail, htmlBodyPreview });

  } catch (err) {
    console.error('[/build error]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Converts a multer file + its row meta into a FileData object.
 *
 * Disposition rules:
 *   user chose 'inline'  AND file is image/* → inline (cid:)
 *   user chose 'inline'  AND file is NOT image → silently downgrade to attach
 *   user chose 'attach'  → always attach, never inline
 */
function buildFileData(f, { varName, disposition }) {
  const type    = f.mimetype || 'application/octet-stream';
  const base64  = f.buffer.toString('base64');
  const dataUrl = `data:${type};base64,${base64}`;
  const isImage = type.startsWith('image/');

  // Honour user's choice; guard inline to images only
  const effectiveDisp = (disposition === 'inline' && isImage) ? 'inline' : 'attach';

  return {
    varName,                    // EJS variable name this file maps to
    name:      f.originalname,
    type,
    size:      humanSize(f.size),
    sizeBytes: f.size,
    base64,
    dataUrl,
    isImage,
    isInline:  effectiveDisp === 'inline',   // true → cid: in HTML
    isAttach:  effectiveDisp === 'attach',   // true → MIME attachment part
    cid:       isImage ? genCid(f.originalname) : null,
  };
}

function humanSize(bytes) {
  if (bytes < 1024)      return bytes + ' B';
  if (bytes < 1048576)   return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

function genCid(filename) {
  return filename.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Math.random().toString(36).slice(2) + '@mime';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MIME Email Builder → http://localhost:${PORT}`));
