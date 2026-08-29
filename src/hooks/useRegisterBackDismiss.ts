import { useEffect } from 'react';
import { registerDismissHandler } from '../services/nativeBackService';

/**
 * Reusable hook to register an open modal/sheet for Android hardware back button dismissal.
 */
export function useRegisterBackDismiss(isOpen: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!isOpen) return;

    const unregister = registerDismissHandler(() => {
      onClose();
      return true;
    });

    return () => {
      unregister();
    };
  }, [isOpen, onClose]);
}
