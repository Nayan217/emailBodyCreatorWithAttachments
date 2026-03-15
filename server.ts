import express, { Request, Response } from 'express';
import multer                         from 'multer';
import path                           from 'path';

import { render as ejsRender }         from './src/ejs-processor';
import { build, buildHtmlBody }        from './src/mime-builder';
import {
  FileData,
  AttachmentMeta,
  TemplateVar,
  BuildResponse,
  BuildErrorResponse,
} from './src/types';

const app    = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, 'public')));

// ── POST /build ──────────────────────────────────────────────────────────────

app.post(
  '/build',
  upload.array('files', 20),
  async (req: Request, res: Response<BuildResponse | BuildErrorResponse>) => {
    try {
      const {
        snippet        = '',
        emailTitle     = 'File Shared With You',
        from           = 'sender@example.com',
        to             = 'recipient@example.com',
        cc             = '',
        subject        = '(no subject)',
        attachmentMeta = '[]',
        templateVars   = '[]',
      } = req.body as Record<string, string>;

      const meta:  AttachmentMeta[] = JSON.parse(attachmentMeta);
      const files: Express.Multer.File[] = (req.files as Express.Multer.File[]) ?? [];

      if (meta.length !== files.length) {
        return res.status(400).json({
          ok:    false,
          error: 'files and attachmentMeta length mismatch',
        });
      }

      const fileDataList: FileData[] = files.map((f, i) => buildFileData(f, meta[i]));

      // Plain key/value variables → { key: value }
      const plainVars: Record<string, string> = (JSON.parse(templateVars) as TemplateVar[])
        .filter(v => v.key)
        .reduce<Record<string, string>>((acc, v) => { acc[v.key] = v.value; return acc; }, {});

      const snippetPreview = ejsRender(snippet, fileDataList, plainVars, false);
      const snippetEmail   = ejsRender(snippet, fileDataList, plainVars, true);

      const htmlBodyPreview = buildHtmlBody(snippetPreview);
      const htmlBodyEmail   = buildHtmlBody(snippetEmail);

      const eml = build({ htmlBody: htmlBodyEmail, allFiles: fileDataList, from, to, cc, subject });

      return res.json({ ok: true, eml, htmlBodyEmail, htmlBodyPreview });

    } catch (err) {
      console.error('[/build error]', err);
      return res.status(500).json({
        ok:    false,
        error: (err as Error).message,
      });
    }
  },
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts a multer file + its row metadata into a typed FileData object.
 *
 * Disposition rules:
 *   'inline' + image/*  → isInline = true  (cid: reference in HTML)
 *   'inline' + non-image→ silently downgraded to attach
 *   'attach'            → isAttach = true  (Content-Disposition: attachment)
 */
function buildFileData(f: Express.Multer.File, { varName, disposition }: AttachmentMeta): FileData {
  const type    = f.mimetype || 'application/octet-stream';
  const base64  = f.buffer.toString('base64');
  const dataUrl = `data:${type};base64,${base64}`;
  const isImage = type.startsWith('image/');

  const effectiveDisp = disposition === 'inline' && isImage ? 'inline' : 'attach';

  return {
    varName,
    name:      f.originalname,
    type,
    size:      humanSize(f.size),
    sizeBytes: f.size,
    base64,
    dataUrl,
    isImage,
    isInline:  effectiveDisp === 'inline',
    isAttach:  effectiveDisp === 'attach',
    cid:       isImage ? genCid(f.originalname) : null,
  };
}

function humanSize(bytes: number): string {
  if (bytes < 1_024)       return `${bytes} B`;
  if (bytes < 1_048_576)   return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(2)} MB`;
}

function genCid(filename: string): string {
  return `${filename.replace(/[^a-zA-Z0-9]/g, '_')}_${Math.random().toString(36).slice(2)}@mime`;
}

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => console.log(`MIME Email Builder → http://localhost:${PORT}`));
