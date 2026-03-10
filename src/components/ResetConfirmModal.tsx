import styles from '../styles/ResetConfirmModal.module.css';

interface ResetConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ResetConfirmModal({ onConfirm, onCancel }: ResetConfirmModalProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Confirm reset">
      <div className={styles.card}>
        <h2 className={styles.title}>Reset to beginning?</h2>
        <p className={styles.message}>
          This will jump back to word 1 of the entire document. Your reading position will be lost.
        </p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            Reset document
          </button>
        </div>
      </div>
    </div>
  );
}
