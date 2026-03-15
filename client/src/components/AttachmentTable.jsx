import React, { useId } from 'react';
import s from '../shared.module.css';

function AttachRow({ row, tokens, onRemove, onUpdate }) {
  const fileInputId = `file-${row.id}`;
  const datalistId  = `dl-${row.id}`;

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    const isImage = f.type.startsWith('image/');
    onUpdate(row.id, {
      file:     f,
      fileName: f.name,
      isImage,
      // downgrade inline→attach if a non-image is loaded
      disposition: (!isImage && row.disposition === 'inline') ? 'attach' : row.disposition,
    });
  };

  const setDisp = disp => onUpdate(row.id, { disposition: disp });

  return (
    <tr>
      {/* Variable name */}
      <td>
        <input
          className={s.varInput}
          type="text"
          list={datalistId}
          placeholder="variable name"
          value={row.varName}
          onChange={e => onUpdate(row.id, { varName: e.target.value })}
        />
        <datalist id={datalistId}>
          {tokens.map(t => <option key={t} value={t} />)}
        </datalist>
      </td>

      {/* File picker */}
      <td>
        <div className={s.fileCell}>
          <label className={s.fileChooseLabel} htmlFor={fileInputId}>Choose</label>
          <input
            id={fileInputId}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          {row.fileName
            ? <span className={s.fileName} title={row.fileName}>{row.fileName}</span>
            : <span className={s.noFile}>No file</span>
          }
        </div>
      </td>

      {/* Disposition toggle */}
      <td>
        <div className={s.dispToggle}>
          <button
            className={`${s.dispBtn} ${row.disposition === 'inline' ? s.dispBtnInlineActive : ''}`}
            disabled={!row.isImage}
            title="Inline — images only (cid: reference)"
            onClick={() => setDisp('inline')}
          >
            inline
          </button>
          <button
            className={`${s.dispBtn} ${row.disposition === 'attach' ? s.dispBtnActive : ''}`}
            title="Attach — Content-Disposition: attachment"
            onClick={() => setDisp('attach')}
          >
            attach
          </button>
        </div>
      </td>

      {/* Remove */}
      <td>
        <button className={s.removeBtn} onClick={() => onRemove(row.id)} title="Remove">✕</button>
      </td>
    </tr>
  );
}

export default function AttachmentTable({ rows, tokens, onAdd, onRemove, onUpdate }) {
  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <span className={s.panelTitle}>Attachments</span>
        <button className={s.abtnSm} onClick={onAdd}>+ Add row</button>
      </div>

      <table className={s.table}>
        <thead>
          <tr>
            <th>Variable</th>
            <th>File</th>
            <th>Disposition</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <AttachRow
              key={row.id}
              row={row}
              tokens={tokens}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <p className={s.tableHint}>No attachments added. Click "+ Add row".</p>
      )}

      <div className={s.legend}>
        <b>inline</b> — image rendered in body via <code>cid:</code> (images only)<br />
        <b>attach</b> — sent as file attachment (<code>Content-Disposition: attachment</code>)
      </div>
    </div>
  );
}
