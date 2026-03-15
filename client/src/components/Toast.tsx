import styles from './Toast.module.css';

interface ToastProps {
  msg: string;
  error?: boolean;
}

export default function Toast({ msg, error = false }: ToastProps) {
  return (
    <div className={`${styles.toast} ${error ? styles.error : ''}`}>
      {msg}
    </div>
  );
}
