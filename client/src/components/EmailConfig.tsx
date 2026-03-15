import { EmailConfig as EmailConfigType } from '../types';
import s from '../shared.module.css';

interface Props {
  config: EmailConfigType;
  onChange: (config: EmailConfigType) => void;
}

type ConfigKey = keyof EmailConfigType;

export default function EmailConfig({ config, onChange }: Props) {
  const field = (key: ConfigKey, label: string, placeholder: string) => (
    <div key={key}>
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
        {field('from', 'From', 'sender@example.com')}
        {field('to', 'To', 'recipient@example.com')}
      </div>
      <div className={s.row2}>
        {field('subject', 'Subject', 'Check out this file')}
        {field('cc', 'CC', 'cc@example.com')}
      </div>
      {field('emailTitle', 'Email title (header)', 'File Shared With You')}
    </>
  );
}
