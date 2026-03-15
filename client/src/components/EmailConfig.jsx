import React from 'react';
import s from '../shared.module.css';

export default function EmailConfig({ config, onChange }) {
  const field = (key, label, placeholder) => (
    <div>
      <label className={s.fieldLabel}>{label}</label>
      <input
        className={s.input}
        type="text"
        value={config[key]}
        placeholder={placeholder}
        onChange={e => onChange({ ...config, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <>
      <div className={s.row2}>
        {field('from',    'From',    'sender@example.com')}
        {field('to',      'To',      'recipient@example.com')}
      </div>
      <div className={s.row2}>
        {field('subject', 'Subject', 'Check out this file')}
        {field('cc',      'CC',      'cc@example.com')}
      </div>
      {field('emailTitle', 'Email title (header)', 'File Shared With You')}
    </>
  );
}
