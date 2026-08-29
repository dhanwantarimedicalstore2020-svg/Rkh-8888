import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

type DismissHandler = () => boolean | void;

// Stack of active UI dismiss handlers (modals, sheets, dialogs)
const dismissStack: DismissHandler[] = [];
let rootBackHandler: (() => boolean) | null = null;
let isListenerInitialized = false;

/**
 * Registers a dismiss callback for an open modal, dialog, or drawer.
 * Returns an unregister cleanup function.
 */
export function registerDismissHandler(handler: DismissHandler): () => void {
  dismissStack.push(handler);
  return () => {
    const idx = dismissStack.lastIndexOf(handler);
    if (idx !== -1) {
      dismissStack.splice(idx, 1);
    }
  };
}

/**
 * Sets a fallback navigation back handler (e.g. switching back to 'today' tab).
 */
export function setRootBackHandler(handler: (() => boolean) | null): void {
  rootBackHandler = handler;
}

/**
 * Initializes the Capacitor Android hardware back-button listener.
 */
export function initializeNativeBackButton(): void {
  if (isListenerInitialized || !Capacitor.isNativePlatform()) {
    return;
  }

  isListenerInitialized = true;

  CapApp.addListener('backButton', async () => {
    // 1. If any modal, sheet, or dialog is open in the dismiss stack: close top-most
    if (dismissStack.length > 0) {
      const topHandler = dismissStack.pop();
      if (topHandler) {
        const handled = topHandler();
        if (handled !== false) {
          return;
        }
      }
    }

    // 2. If at a non-root tab or sub-view: navigate back
    if (rootBackHandler) {
      const handled = rootBackHandler();
      if (handled) {
        return;
      }
    }

    // 3. If at root with nothing open: exit app cleanly
    try {
      await CapApp.exitApp();
    } catch {
      // Fallback
    }
  });
}
