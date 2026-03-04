/**
 * SignInPrompt
 * One-time dismissible prompt shown after the user's first reading session.
 * Once dismissed (or acted on), it never shows again.
 */

import { useState } from 'react';
import { useAuth } from './useAuth';
import styles from '../styles/SignInPrompt.module.css';

const LS_KEY = 'readswift_signin_prompt_dismissed';

interface SignInPromptProps {
  /** Whether the user has just completed a reading session */
  sessionCompleted: boolean;
  onDismiss: () => void;
}

export default function SignInPrompt({ sessionCompleted, onDismiss }: SignInPromptProps) {
  const { isAuthenticated, isSupabaseConfigured, signInWithGoogle } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Derive visibility without a side-effect setState
  const show =
    isSupabaseConfigured &&
    !isAuthenticated &&
    sessionCompleted &&
    !dismissed &&
    !localStorage.getItem(LS_KEY);

  const dismiss = () => {
    localStorage.setItem(LS_KEY, '1');
    setDismissed(true);
    onDismiss();
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // Ignore — the page will redirect for OAuth
    }
    dismiss();
  };

  if (!show) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Sign in prompt">
      <div className={styles.card}>
        <div className={styles.icon}>📚</div>
        <h2 className={styles.title}>Unlock Cross-Device Reading</h2>
        <p className={styles.subtitle}>Sign in with Google to:</p>
        <ul className={styles.benefits}>
          <li>✓ Sync your reading progress across all devices</li>
          <li>✓ Never lose your place in any book</li>
          <li>✓ Keep your preferences and history safe</li>
          <li>✓ Resume reading from any device instantly</li>
        </ul>
        <div className={styles.actions}>
          <button className={styles.signInBtn} onClick={handleSignIn}>
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt=""
              className={styles.googleLogo}
            />
            Sign In with Google
          </button>
          <button className={styles.dismissBtn} onClick={dismiss}>
            Continue Without Signing In
          </button>
        </div>
        <p className={styles.privacy}>
          We only store reading progress metadata — your files are never uploaded.
        </p>
      </div>
    </div>
  );
}
