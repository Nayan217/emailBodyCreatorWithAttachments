import React from 'react';
import styles from './Toast.module.css';

export default function Toast({ msg, error }) {
  return (
    <div className={`${styles.toast} ${error ? styles.error : ''}`}>
      {msg}
    </div>
  );
}
