import { useEffect } from 'react';
import { useBeforeUnload } from 'react-router-dom';

/**
 * Warns on refresh/tab close when there are unsaved changes.
 * (Client-side navigation cannot be blocked with the current router setup.)
 */
export const useUnsavedChanges = (
  isDirty,
  message = 'Vous avez des modifications non sauvegardées. Quitter la page ?'
) => {
  useBeforeUnload(
    isDirty
      ? event => {
          event.preventDefault();
          event.returnValue = '';
        }
      : null
  );

  useEffect(() => {
    const handler = event => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = message;
      return message;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, message]);
};
