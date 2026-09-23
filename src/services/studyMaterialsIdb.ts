/**
 * IndexedDB helper for Study Corner materials.
 * Stores attachments and study materials locally for true offline access.
 */
import { openDB } from 'idb';
import { getDBConfig } from '@/services/idbStore';
import type { ContentItem } from '@/data/cbcStudyContent';

const STORE_NAME = 'study_materials';

export async function getStudyMaterialsDb() {
  const config = getDBConfig();
  return openDB(config.name, config.version, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('grade', 'grade', { unique: false });
        store.createIndex('strand', 'strand', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }
    },
  });
}

export async function saveStudyMaterialIdb(item: ContentItem): Promise<void> {
  try {
    const db = await getStudyMaterialsDb();
    await db.put(STORE_NAME, item);
  } catch (err) {
    console.error('[idbStore] saveStudyMaterialIdb failed:', err);
  }
}

export async function getAllStudyMaterialsIdb(): Promise<ContentItem[]> {
  try {
    const db = await getStudyMaterialsDb();
    return await db.getAll(STORE_NAME);
  } catch (err) {
    console.error('[idbStore] getAllStudyMaterialsIdb failed:', err);
    return [];
  }
}

export async function deleteStudyMaterialIdb(id: string): Promise<void> {
  try {
    const db = await getStudyMaterialsDb();
    await db.delete(STORE_NAME, id);
  } catch (err) {
    console.error('[idbStore] deleteStudyMaterialIdb failed:', err);
  }
}
