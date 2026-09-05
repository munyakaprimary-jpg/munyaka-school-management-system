/**
 * learning-areas-service.ts — Offline-first learning areas & clusters
 *
 * All reads come from localStorage (via the storage layer).
 * The canonical storage key is 'munyaka_learning_areas'.
 * All mutations go through @/utils/storage so they are immediately
 * reflected across all hooks and components.
 */

import { LearningAreaCluster } from '@/utils/storage';
import { lsRead } from '@/utils/storage';

const KEY = 'munyaka_learning_areas';

/** Fetch all clusters + learning areas from localStorage. */
export function fetchLearningAreasByCluster(): LearningAreaCluster[] {
  return lsRead<LearningAreaCluster[]>(KEY, []);
}

/** Fetch learning areas for a specific cluster. */
export function getLearningAreasForCluster(clusterId: string): LearningAreaCluster | undefined {
  const clusters = fetchLearningAreasByCluster();
  return clusters.find(c => c.id === clusterId);
}

/** Re-export the type for consumers. */
export type { LearningAreaCluster as ClusterData };
