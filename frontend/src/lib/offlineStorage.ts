/**
 * Wavelength Offline Song Storage Engine (IndexedDB)
 * Allows downloading and playing full tracks offline without internet.
 */

import { UnifiedTrack } from '../types';

const DB_NAME = 'wavelength_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface OfflineRecord {
  id: string;
  track: UnifiedTrack;
  blob?: Blob;
  downloadedAt: number;
}

/**
 * Saves a track and its audio into IndexedDB for 100% offline playback.
 */
export async function saveTrackOffline(track: UnifiedTrack): Promise<boolean> {
  try {
    const db = await openDB();

    let audioBlob: Blob | undefined;
    if (track.streamUrl) {
      try {
        const res = await fetch(track.streamUrl);
        if (res.ok) {
          audioBlob = await res.blob();
        }
      } catch (fetchErr) {
        console.warn('Could not fetch audio blob, saving metadata only:', fetchErr);
      }
    }

    const record: OfflineRecord = {
      id: track.id,
      track: {
        ...track,
        audioDownloadAllowed: true,
      },
      blob: audioBlob,
      downloadedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save track offline:', err);
    return false;
  }
}

/**
 * Returns all tracks saved for offline listening.
 */
export async function getOfflineTracks(): Promise<UnifiedTrack[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records: OfflineRecord[] = req.result || [];
        const tracks = records.map((r) => {
          let streamUrl = r.track.streamUrl;
          if (r.blob) {
            try {
              streamUrl = URL.createObjectURL(r.blob);
            } catch {}
          }
          return {
            ...r.track,
            streamUrl,
          };
        });
        resolve(tracks);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Checks if a track ID is already stored in offline storage.
 */
export async function isTrackOffline(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve(Boolean(req.result));
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Removes a track from offline storage.
 */
export async function deleteOfflineTrack(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}
