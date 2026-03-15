import React, { useState } from 'react';
import styles from './OutputPanel.module.css';
import s from '../shared.module.css';

const TABS = [
  { id: 'preview', label: 'HTML Preview' },
  { id: 'eml',     label: '.eml (raw MIME)' },
  { id: 'html',    label: 'HTML Body' },
];

export default function OutputPanel({ output, onToast }) {
  const [activeTab, setActiveTab] = useState('preview');

  const copy = (text, msg) => {
    if (!text) { onToast('Build the email first', true); return; }
    navigator.clipboard.writeText(text).then(() => onToast(msg));
  };

  const download = (content, filename, type) => {
    if (!content) { onToast('Build the email first', true); return; }
    const a  = document.createElement('a');
    a.href   = URL.createObjectURL(new Blob([content], { type }));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* HTML Preview */}
      {activeTab === 'preview' && (
        <div className={styles.tc}>
          <iframe
            className={styles.iframe}
            srcDoc={output.htmlBodyPreview || "<p style='color:#aaa;font-family:sans-serif;padding:20px'>Build the email to preview…</p>"}
            title="Email preview"
          />
          <div className={styles.actions}>
            <button className={s.abtnPri} onClick={() => copy(output.htmlBodyEmail, 'HTML body copied')}>Copy HTML body</button>
            <button className={s.abtn}    onClick={() => download(output.eml, 'email.eml', 'message/rfc822')}>Download .eml</button>
            <button className={s.abtn}    onClick={() => download(output.htmlBodyEmail, 'email-body.html', 'text/html')}>Download .html</button>
          </div>
        </div>
      )}

      {/* Raw .eml */}
      {activeTab === 'eml' && (
        <div className={styles.tc}>
          <pre className={styles.codeOut}>{output.eml || 'Raw .eml will appear here…'}</pre>
          <div className={styles.actions}>
            <button className={s.abtnPri} onClick={() => copy(output.eml, '.eml copied')}>Copy .eml</button>
            <button className={s.abtn}    onClick={() => download(output.eml, 'email.eml', 'message/rfc822')}>Download .eml</button>
          </div>
        </div>
      )}

      {/* HTML Body */}
      {activeTab === 'html' && (
        <div className={styles.tc}>
          <pre className={styles.codeOut}>{output.htmlBodyEmail || 'HTML body will appear here…'}</pre>
          <div className={styles.actions}>
            <button className={s.abtnPri} onClick={() => copy(output.htmlBodyEmail, 'HTML body copied')}>Copy HTML</button>
          </div>
        </div>
      )}
    </div>
  );
}
