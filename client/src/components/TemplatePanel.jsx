import React from 'react';
import s from '../shared.module.css';
import EmailConfig from './EmailConfig';

export default function TemplatePanel({ snippet, onSnippetChange, config, onConfigChange, tokens }) {
  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <span className={s.panelTitle}>EJS Template</span>
      </div>

      <EmailConfig config={config} onChange={onConfigChange} />

      <label className={s.fieldLabel}>EJS snippet:</label>
      <textarea
        className={s.textarea}
        spellCheck={false}
        value={snippet}
        onChange={e => onSnippetChange(e.target.value)}
      />

      <div className={s.tokenBar}>
        <span className={s.tokenBarLabel}>Variables detected:</span>
        {tokens.length === 0
          ? <span className={s.tokenBarEmpty}>Write a template above</span>
          : tokens.map(t => <span key={t} className={s.tokenPill}>{t}</span>)
        }
      </div>
    </div>
  );
}
