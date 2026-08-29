import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import {
  CURRENT_SCHEMA_VERSION,
  exportSystemData,
  importSystemData,
} from './storageService';

export interface ExportResult {
  success: boolean;
  filename: string;
  isNative: boolean;
  uri?: string;
  message: string;
  shared?: boolean;
}

export interface ImportResult {
  success: boolean;
  message: string;
  details?: string[];
  recordsCount?: number;
}

/**
 * Generate a formatted backup filename: RKH-8888-backup-YYYY-MM-DD-HH-mm-ss.json
 */
export function generateBackupFilename(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `RKH-8888-backup-${year}-${month}-${day}-${hours}-${minutes}-${seconds}.json`;
}

/**
 * Native Android + Web Backup Export & Share Engine
 * 1. Generates validated schema v2.2.0 JSON payload
 * 2. On Android: writes file to Cache/Documents and triggers Android System Share sheet
 * 3. On Web/PWA: triggers standard browser download
 */
export async function exportAndSaveBackup(options?: {
  shareAfterSave?: boolean;
}): Promise<ExportResult> {
  const filename = generateBackupFilename();
  const jsonStr = exportSystemData();

  // 1. Android Native Environment
  if (Capacitor.isNativePlatform()) {
    try {
      // Write file into native cache directory for safe cross-app sharing
      const writeRes = await Filesystem.writeFile({
        path: filename,
        data: jsonStr,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      const fileUri = writeRes.uri;
      let shared = false;

      // Trigger Android System Share Sheet if requested or available
      if (options?.shareAfterSave !== false) {
        try {
          const canShare = await Share.canShare();
          if (canShare.value) {
            await Share.share({
              title: 'RKH 8888 System State Backup',
              text: `RKH 8888 Personal Operating System backup (Schema v${CURRENT_SCHEMA_VERSION})`,
              url: fileUri,
              dialogTitle: 'Share RKH 8888 Backup JSON',
            });
            shared = true;
          }
        } catch (shareErr) {
          // User cancelled share dialog or share dismissed
          console.info('[NativeBackup] Share dialog dismissed or cancelled:', shareErr);
        }
      }

      return {
        success: true,
        filename,
        isNative: true,
        uri: fileUri,
        shared,
        message: shared
          ? `Backup "${filename}" saved and shared successfully.`
          : `Backup "${filename}" saved to device cache.`,
      };
    } catch (fsErr) {
      console.warn('[NativeBackup] Native filesystem write failed, falling back to web download:', fsErr);
      // Fall through to browser download fallback
    }
  }

  // 2. Web / Browser / PWA Fallback
  try {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 200);

    return {
      success: true,
      filename,
      isNative: false,
      message: `Backup "${filename}" downloaded to browser.`,
    };
  } catch (webErr) {
    return {
      success: false,
      filename,
      isNative: false,
      message: `Failed to export backup: ${webErr instanceof Error ? webErr.message : 'Unknown error'}`,
    };
  }
}

/**
 * Import backup directly from a user-selected File (HTML5 file input or native file picker)
 * Performs 100% strict Schema v2.2.0 validation with atomic non-destructive failure protection.
 */
export async function importBackupFromFile(file: File): Promise<ImportResult> {
  if (!file) {
    return {
      success: false,
      message: 'No file was selected for restoration.',
    };
  }

  if (file.size > 50 * 1024 * 1024) {
    return {
      success: false,
      message: 'Backup file exceeds safe size limit (50 MB).',
    };
  }

  try {
    const text = await file.text();
    return importSystemData(text);
  } catch (readErr) {
    return {
      success: false,
      message: `Could not read selected file: ${readErr instanceof Error ? readErr.message : 'Read error'}`,
    };
  }
}
