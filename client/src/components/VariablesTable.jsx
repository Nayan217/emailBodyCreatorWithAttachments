import React from 'react';
import s from '../shared.module.css';

function VarRow({ row, onRemove, onUpdate }) {
  return (
    <tr>
      <td>
        <input
          className={s.varInput}
          type="text"
          placeholder="variableName"
          value={row.key}
          onChange={e => onUpdate(row.id, { key: e.target.value.trim() })}
        />
      </td>
      <td>
        <input
          className={s.varInput}
          type="text"
          placeholder="value"
          value={row.value}
          onChange={e => onUpdate(row.id, { value: e.target.value })}
        />
      </td>
      <td>
        <button className={s.removeBtn} onClick={() => onRemove(row.id)} title="Remove">✕</button>
      </td>
    </tr>
  );
}

export default function VariablesTable({ rows, onAdd, onRemove, onUpdate }) {
  return (
    <div className={s.panel} style={{ marginBottom: 18 }}>
      <div className={s.panelHeader}>
        <span className={s.panelTitle}>Variables</span>
        <button className={s.abtnSm} onClick={onAdd}>+ Add variable</button>
      </div>

      <table className={s.table}>
        <thead>
          <tr>
            <th>Variable name</th>
            <th>Value</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <VarRow
              key={row.id}
              row={row}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <p className={s.tableHint}>No variables added. Click "+ Add variable".</p>
      )}
    </div>
  );
}
