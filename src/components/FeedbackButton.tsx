/**
 * FeedbackButton
 *
 * A small "💬 Feedback" link in the app header.
 * Opens a Google Form in a new tab so visitors can leave feedback.
 */

import styles from '../styles/FeedbackButton.module.css';

const FEEDBACK_FORM_URL = 'https://forms.gle/dCBSTs4SjvhmA3Zh6';

export default function FeedbackButton() {
  return (
    <a
      href={FEEDBACK_FORM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.feedbackBtn}
      aria-label="Submit feedback about ReadSwift"
      title="Share your feedback — it helps us improve!"
    >
      💬 Feedback
    </a>
  );
}
