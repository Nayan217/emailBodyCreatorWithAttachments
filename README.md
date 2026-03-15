# MIME Email Builder — Node.js + EJS + React

Server-side MIME email builder. Write an EJS snippet in the browser;
the Node.js server renders it with the real `ejs` npm package and returns
a standards-compliant `.eml` file.

---

## Quick Start

```bash
# 1. Install server dependencies + build React frontend
npm run setup

# 2. Start the Express server
npm start
# → http://localhost:3000
```

**Development** (hot reload for React):
```bash
# Terminal 1 — Express backend
npm start

# Terminal 2 — Vite dev server (proxies /build to :3000)
cd client && npm run dev
# → http://localhost:5173
```

---

## Project Structure

```
mime-email-builder/
│
├── package.json          ← server deps (express, ejs, multer) + build scripts
├── server.js             ← Express entry point + POST /build route
│
├── src/                  ← server-side modules (untouched by React migration)
│   ├── ejs-processor.js  ← real ejs.render() + SafeString pattern
│   ├── smart-blob.js     ← FileData → HTML (image inline / attach note)
│   ├── mime-builder.js   ← RFC 2045/2046/2387 .eml construction
│   └── utils.js          ← shared escHtml()
│
├── client/               ← React frontend (Vite)
│   ├── package.json
│   ├── vite.config.js    ← builds to ../public/, proxies /build to :3000
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                      ← root state + POST /build logic
│       ├── hooks/
│       │   └── useTokenExtractor.js     ← EJS token scanner (useMemo)
│       └── components/
│           ├── EmailConfig.jsx          ← from/to/cc/subject/title fields
│           ├── TemplatePanel.jsx        ← config + snippet textarea + token pills
│           ├── AttachmentTable.jsx      ← varName input, file picker, inline/attach toggle
│           ├── VariablesTable.jsx       ← key/value plain variable rows
│           ├── OutputPanel.jsx          ← preview iframe, .eml tab, HTML body tab
│           └── Toast.jsx               ← fixed notification
│
└── public/               ← Vite build output (served by Express)
```

---

## POST /build API

**Request** — `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `snippet` | string | EJS template |
| `emailTitle` | string | Header title |
| `from` / `to` / `cc` / `subject` | string | Email headers |
| `attachmentMeta` | JSON string | `[{varName, disposition}]` parallel to `files[]` |
| `templateVars` | JSON string | `[{key, value}]` plain variables |
| `files` | file[] | One per `attachmentMeta` entry |

**Response** — `application/json`
```json
{ "ok": true, "eml": "...", "htmlBodyEmail": "...", "htmlBodyPreview": "..." }
```

---

## EJS Variables in Your Snippet

| Variable | Value |
|----------|-------|
| `<%= varName %>` | Smart render: inline `<img>` or empty (attach goes as MIME part) |
| `<%= varName_data.name %>` | Filename string |
| `<%= varName_data.size %>` | Human-readable size |
| `<%= myKey %>` | Value from the Variables table |

## MIME Routing

| User choice | File type | Result |
|-------------|-----------|--------|
| `inline` | `image/*` | `Content-Disposition: inline` + `cid:` in HTML |
| `inline` | non-image | Silently downgraded to `attach` |
| `attach` | any | `Content-Disposition: attachment` |
