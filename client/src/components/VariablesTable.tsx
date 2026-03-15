import { ChangeEvent } from 'react';
import { VarRow } from '../types';
import s from '../shared.module.css';

// ── VarRow ────────────────────────────────────────────────────────────────

interface VarRowProps {
  row: VarRow;
  onRemove: (id: number) => void;
  onUpdate: (id: number, patch: Partial<VarRow>) => void;
}

function VarRowItem({ row, onRemove, onUpdate }: VarRowProps) {
  return (
    <tr>
      <td>
        <input
          className={s.varInput}
          type="text"
          placeholder="variableName"
          value={row.key}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onUpdate(row.id, { key: e.target.value.trim() })
          }
        />
      </td>
      <td>
        <input
          className={s.varInput}
          type="text"
          placeholder="value"
          value={row.value}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onUpdate(row.id, { value: e.target.value })
          }
        />
      </td>
      <td>
        <button
          className={s.removeBtn}
          onClick={() => onRemove(row.id)}
          title="Remove"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

// ── VariablesTable ────────────────────────────────────────────────────────

interface Props {
  rows: VarRow[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, patch: Partial<VarRow>) => void;
}

export default function VariablesTable({ rows, onAdd, onRemove, onUpdate }: Props) {
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
            <VarRowItem
              key={row.id}
              row={row}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <p className={s.tableHint}>No variables added. Click &quot;+ Add variable&quot;.</p>
      )}
    </div>
  );
}
