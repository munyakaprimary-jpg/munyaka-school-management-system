/**
 * IndexedDB helper for Study Corner materials.
 * Stores attachments and study materials locally for true offline access.
 */
import { idbStore, IDB_SCHEMA } from '@/services/idbStore';
import type { ContentItem } from '@/data/cbcStudyContent';

const STORE_NAME = 'study_materials';

export async function saveStudyMaterialIdb(item: ContentItem): Promise<void> {
  try {
    await idbStore.put(STORE_NAME, item);
  } catch (err) {
    console.error('[studyMaterialsIdb] saveStudyMaterialIdb failed:', err);
  }
}

export async function getAllStudyMaterialsIdb(): Promise<ContentItem[]> {
  try {
    return await idbStore.getAll<ContentItem>(STORE_NAME);
  } catch (err) {
    console.error('[studyMaterialsIdb] getAllStudyMaterialsIdb failed:', err);
    return [];
  }
}

export async function deleteStudyMaterialIdb(id: string): Promise<void> {
  try {
    await idbStore.delete(STORE_NAME, id);
  } catch (err) {
    console.error('[studyMaterialsIdb] deleteStudyMaterialIdb failed:', err);
  }
}
