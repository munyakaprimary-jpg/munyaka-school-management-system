// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { LearningArea, ClusterData } from '@/types/assessments';

export interface LearningAreaDB {
  id: string;
  name: string;
  periods_per_week: number;
  type: 'Core' | 'Elective';
  description?: string;
  cluster_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClusterDB {
  id: string;
  name: string;
  description: string;
}

export const LearningAreasService = {
  /**
   * Fetch all active learning areas from the database
   */
  async fetchLearningAreas(): Promise<LearningAreaDB[]> {
    const { data, error } = await supabase
      .from('learning_areas')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching learning areas:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Fetch all clusters from the database
   */
  async fetchClusters(): Promise<ClusterDB[]> {
    const { data, error } = await supabase
      .from('clusters')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching clusters:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Fetch learning areas grouped by cluster
   */
  async fetchLearningAreasByCluster(): Promise<ClusterData[]> {
    try {
      const [learningAreas, clusters] = await Promise.all([
        this.fetchLearningAreas(),
        this.fetchClusters()
      ]);

      // Group learning areas by cluster
      const clusterMap = new Map<string, ClusterData>();

      clusters.forEach(cluster => {
        clusterMap.set(cluster.id, {
          id: cluster.id,
          name: cluster.name,
          learningAreas: []
        });
      });

      learningAreas.forEach(area => {
        const cluster = clusterMap.get(area.cluster_id);
        if (cluster) {
          cluster.learningAreas.push({
            id: area.id,
            name: area.name,
            type: area.type
          });
        }
      });

      return Array.from(clusterMap.values());
    } catch (error) {
      console.error('Error fetching learning areas by cluster:', error);
      throw error;
    }
  },

  /**
   * Get learning areas for a specific cluster
   */
  async getLearningAreasForCluster(clusterId: string): Promise<LearningArea[]> {
    const { data, error } = await supabase
      .from('learning_areas')
      .select('id, name, type')
      .eq('cluster_id', clusterId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching learning areas for cluster:', error);
      throw error;
    }

    return (data || []).map(area => ({
      id: area.id,
      name: area.name,
      type: area.type
    }));
  }
};
