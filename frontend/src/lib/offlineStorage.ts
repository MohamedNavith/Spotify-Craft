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

export function canSaveAudioOffline(track: UnifiedTrack) {
  return track.provider === 'jamendo' ? track.audioDownloadAllowed === true : track.audioDownloadAllowed !== false;
}

export function playsFromSource(track: UnifiedTrack | null) {
  return !!track && (track.provider === 'upload' || track.id.startsWith('offline-') ||
    track.streamUrl?.startsWith('blob:') || (track.provider === 'jamendo' && !!track.streamUrl));
}

/**
 * Saves a track and its audio into IndexedDB for 100% offline playback.
 */
export async function saveTrackOffline(track: UnifiedTrack): Promise<boolean> {
  try {
    if (!track.streamUrl || !canSaveAudioOffline(track)) return false;
    const response = await fetch(track.streamUrl);
    if (!response.ok) return false;
    const blob = await response.blob();
    if (!blob.size || blob.type.startsWith('text/')) return false;
    const db = await openDB();
    const record: OfflineRecord = { id:track.id, track, blob, downloadedAt:Date.now() };
    return await new Promise<boolean>(resolve => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => { db.close(); resolve(true); };
      tx.onabort = tx.onerror = () => { db.close(); resolve(false); };
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
        const tracks = records.filter(record => record.blob?.size).map((r) => {
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

      req.onsuccess = () => resolve(Boolean(req.result?.blob?.size));
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
