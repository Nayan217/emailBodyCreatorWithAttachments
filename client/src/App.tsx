import { useState, useCallback } from 'react';
import { useTokenExtractor } from './hooks/useTokenExtractor';
import TemplatePanel from './components/TemplatePanel';
import AttachmentTable from './components/AttachmentTable';
import VariablesTable from './components/VariablesTable';
import OutputPanel from './components/OutputPanel';
import Toast from './components/Toast';
import {
  AttachRow,
  VarRow,
  EmailConfig,
  BuildResult,
  BuildResponse,
  AttachmentMeta,
  TemplateVar,
} from './types';
import styles from './App.module.css';

// ── ID counter ────────────────────────────────────────────────────────────

let _id = 0;
const uid = (): number => ++_id;

// ── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_SNIPPET = '<h2>Hi All, this is my <%= reportFile %> that I want to share</h2>';

const DEFAULT_CONFIG: EmailConfig = {
  from: 'sender@example.com',
  to: 'recipient@example.com',
  cc: '',
  subject: 'Check out this file',
  emailTitle: 'File Shared With You',
};

// ── Toast state type ──────────────────────────────────────────────────────

interface ToastState {
  msg: string;
  error: boolean;
}

// ── App ───────────────────────────────────────────────────────────────────

export default function App() {

  // ── Email config ─────────────────────────────────────────────────────────
  const [config, setConfig] = useState<EmailConfig>(DEFAULT_CONFIG);

  // ── EJS template ─────────────────────────────────────────────────────────
  const [snippet, setSnippet] = useState<string>(DEFAULT_SNIPPET);
  const tokens = useTokenExtractor(snippet);

  // ── Attachment rows ───────────────────────────────────────────────────────
  const [attachRows, setAttachRows] = useState<AttachRow[]>([
    { id: uid(), varName: '', file: null, fileName: '', isImage: false, disposition: 'attach' },
  ]);

  const addAttachRow = useCallback((): void => {
    setAttachRows(rows => [...rows, {
      id: uid(), varName: tokens[0] ?? '', file: null,
      fileName: '', isImage: false, disposition: 'attach',
    }]);
  }, [tokens]);

  const removeAttachRow = useCallback((id: number): void => {
    setAttachRows(rows => rows.filter(r => r.id !== id));
  }, []);

  const updateAttachRow = useCallback((id: number, patch: Partial<AttachRow>): void => {
    setAttachRows(rows => rows.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);

  // ── Variable rows ─────────────────────────────────────────────────────────
  const [varRows, setVarRows] = useState<VarRow[]>([]);

  const addVarRow = useCallback((): void => {
    setVarRows(rows => [...rows, { id: uid(), key: '', value: '' }]);
  }, []);

  const removeVarRow = useCallback((id: number): void => {
    setVarRows(rows => rows.filter(r => r.id !== id));
  }, []);

  const updateVarRow = useCallback((id: number, patch: Partial<VarRow>): void => {
    setVarRows(rows => rows.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);

  // ── Output & build state ──────────────────────────────────────────────────
  const [output, setOutput] = useState<Partial<BuildResult>>({});
  const [building, setBuilding] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((msg: string, error = false): void => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 2600);
  }, []);

  // ── POST /build ───────────────────────────────────────────────────────────
  const handleBuild = useCallback(async (): Promise<void> => {
    const missing = attachRows.filter(r => !r.file);
    if (missing.length > 0) {
      showToast('Every attachment row needs a file selected', true);
      return;
    }

    setBuilding(true);
    try {
      const fd = new FormData();
      fd.append('snippet', snippet);
      fd.append('emailTitle', config.emailTitle || 'File Shared With You');
      fd.append('from', config.from);
      fd.append('to', config.to);
      fd.append('cc', config.cc);
      fd.append('subject', config.subject);

      const meta: AttachmentMeta[] = attachRows.map(r => ({
        varName: r.varName,
        disposition: r.disposition,
      }));
      fd.append('attachmentMeta', JSON.stringify(meta));

      const vars: TemplateVar[] = varRows
        .filter(r => r.key)
        .map(r => ({ key: r.key, value: r.value }));
      fd.append('templateVars', JSON.stringify(vars));

      attachRows.forEach(r => {
        if (r.file) fd.append('files', r.file, r.fileName);
      });

      const res = await fetch('/build', { method: 'POST', body: fd });
      const data = await res.json() as BuildResponse;

      if (!data.ok) throw new Error(data.error);

      setOutput(data);
      showToast('Email built');

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(err);
      showToast(msg, true);
      setOutput(o => ({
        ...o,
        htmlBodyPreview: `<pre style="color:red;padding:16px;font-family:monospace">Error: ${msg}</pre>`,
      }));
    } finally {
      setBuilding(false);
    }
  }, [snippet, config, attachRows, varRows, showToast]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.app}>
      <h1 className={styles.heading}>
        MIME Email Builder
        <span className={styles.badge}>EJS · Node.js · RFC 2045</span>
      </h1>

      <div className={styles.grid}>
        <TemplatePanel
          snippet={snippet}
          onSnippetChange={setSnippet}
          config={config}
          onConfigChange={setConfig}
          tokens={tokens}
        />
        <AttachmentTable
          rows={attachRows}
          tokens={tokens}
          onAdd={addAttachRow}
          onRemove={removeAttachRow}
          onUpdate={updateAttachRow}
        />
      </div>

      <VariablesTable
        rows={varRows}
        onAdd={addVarRow}
        onRemove={removeVarRow}
        onUpdate={updateVarRow}
      />

      <button
        className={styles.buildBtn}
        onClick={() => { void handleBuild(); }}
        disabled={building}
      >
        {building
          ? <><span className={styles.spinner} />Building…</>
          : 'Build MIME Email'
        }
      </button>

      <OutputPanel output={output} onToast={showToast} />

      {toast && <Toast msg={toast.msg} error={toast.error} />}
    </div>
  );
}
