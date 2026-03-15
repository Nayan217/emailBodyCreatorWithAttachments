import React, { useState, useCallback } from 'react';
import { useTokenExtractor } from './hooks/useTokenExtractor';
import TemplatePanel  from './components/TemplatePanel';
import AttachmentTable from './components/AttachmentTable';
import VariablesTable from './components/VariablesTable';
import OutputPanel    from './components/OutputPanel';
import Toast          from './components/Toast';
import styles         from './App.module.css';

let _id = 0;
const uid = () => ++_id;

const DEFAULT_SNIPPET = '<h2>Hi All, this is my <%= reportFile %> that I want to share</h2>';

export default function App() {
  // ── Email config ───────────────────────────────────────────────────────────
  const [config, setConfig] = useState({
    from:       'sender@example.com',
    to:         'recipient@example.com',
    cc:         '',
    subject:    'Check out this file',
    emailTitle: 'File Shared With You',
  });

  // ── EJS template ──────────────────────────────────────────────────────────
  const [snippet, setSnippet] = useState(DEFAULT_SNIPPET);
  const tokens = useTokenExtractor(snippet);

  // ── Attachment rows ────────────────────────────────────────────────────────
  // [{ id, varName, file, fileName, isImage, disposition }]
  const [attachRows, setAttachRows] = useState([
    { id: uid(), varName: '', file: null, fileName: '', isImage: false, disposition: 'attach' },
  ]);

  const addAttachRow = useCallback(() => {
    setAttachRows(rows => [...rows, {
      id: uid(), varName: tokens[0] || '', file: null, fileName: '', isImage: false, disposition: 'attach',
    }]);
  }, [tokens]);

  const removeAttachRow = useCallback(id => {
    setAttachRows(rows => rows.filter(r => r.id !== id));
  }, []);

  const updateAttachRow = useCallback((id, patch) => {
    setAttachRows(rows => rows.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);

  // ── Variable rows ──────────────────────────────────────────────────────────
  // [{ id, key, value }]
  const [varRows, setVarRows] = useState([]);

  const addVarRow = useCallback(() => {
    setVarRows(rows => [...rows, { id: uid(), key: '', value: '' }]);
  }, []);

  const removeVarRow = useCallback(id => {
    setVarRows(rows => rows.filter(r => r.id !== id));
  }, []);

  const updateVarRow = useCallback((id, patch) => {
    setVarRows(rows => rows.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);

  // ── Build output ───────────────────────────────────────────────────────────
  const [output, setOutput] = useState({ eml: '', htmlBodyEmail: '', htmlBodyPreview: '' });
  const [building, setBuilding] = useState(false);
  const [toast, setToast]       = useState(null);

  const showToast = useCallback((msg, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 2600);
  }, []);

  // ── POST /build ────────────────────────────────────────────────────────────
  const handleBuild = useCallback(async () => {
    const missing = attachRows.filter(r => !r.file);
    if (missing.length) {
      showToast('Every attachment row needs a file selected', true);
      return;
    }

    setBuilding(true);
    try {
      const fd = new FormData();
      fd.append('snippet',    snippet);
      fd.append('emailTitle', config.emailTitle || 'File Shared With You');
      fd.append('from',       config.from);
      fd.append('to',         config.to);
      fd.append('cc',         config.cc);
      fd.append('subject',    config.subject);

      const meta = attachRows.map(r => ({ varName: r.varName, disposition: r.disposition }));
      fd.append('attachmentMeta', JSON.stringify(meta));

      const vars = varRows
        .filter(r => r.key)
        .map(r => ({ key: r.key, value: r.value }));
      fd.append('templateVars', JSON.stringify(vars));

      attachRows.forEach(r => fd.append('files', r.file, r.fileName));

      const res  = await fetch('/build', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Server error');

      setOutput(data);
      showToast('Email built');
    } catch (err) {
      console.error(err);
      showToast(err.message, true);
      setOutput(o => ({ ...o, htmlBodyPreview: `<pre style="color:red;padding:16px;font-family:monospace">Error: ${err.message}</pre>` }));
    } finally {
      setBuilding(false);
    }
  }, [snippet, config, attachRows, varRows, showToast]);

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
        onClick={handleBuild}
        disabled={building}
      >
        {building
          ? <><span className={styles.spinner} />Building…</>
          : 'Build MIME Email'}
      </button>

      <OutputPanel output={output} onToast={showToast} />

      {toast && <Toast msg={toast.msg} error={toast.error} />}
    </div>
  );
}
