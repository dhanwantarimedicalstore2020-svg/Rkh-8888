import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Initializes Android native status bar appearance.
 * Configures light cream background (#FBF9F5) with dark icons.
 */
export async function initializeNativeStatusBar(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // Style.Light configures dark status-bar text/icons (for light backgrounds)
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#FBF9F5' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    // Defensive catch to prevent webview crash on unsupported devices
    console.warn('[NativeStatusBar] Initialization skipped or unsupported:', err);
  }
}
