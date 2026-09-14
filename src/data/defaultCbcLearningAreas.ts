import type { LearningArea, ClusterData } from '@/types/assessments';

/**
 * Default CBC Learning Areas categorized by school level.
 * These are the official Kenyan CBC subjects used to seed the
 * Learning Area Manager on first load when no custom areas are
 * stored in localStorage or the database.
 */

export interface DefaultLearningArea {
  name: string;
  periodsPerWeek: number;
  type: 'Core' | 'Elective';
  description?: string;
}

export type CbcClusterId =
  | 'pre-primary'
  | 'lower-primary'
  | 'upper-primary'
  | 'junior-school';

export const DEFAULT_CBC_CLUSTERS: ClusterData[] = [
  {
    id: 'pre-primary',
    name: 'Pre-Primary',
    description: 'Early childhood development learning areas (PP1 - PP2)',
    learningAreas: [
      { name: 'Mathematical Activities', type: 'Core' },
      { name: 'Language Activities', type: 'Core' },
      { name: 'Religious Education Activities (CRE/IRE/HRE)', type: 'Core' },
      { name: 'Environmental Activities', type: 'Core' },
      { name: 'Psychomotor and Creative Activities', type: 'Core' },
    ],
  },
  {
    id: 'lower-primary',
    name: 'Lower Primary',
    description: 'Foundational learning areas for Grades 1, 2, and 3',
    learningAreas: [
      { name: 'Mathematics', type: 'Core' },
      { name: 'English Language Activities', type: 'Core' },
      { name: 'Kiswahili Language Activities / Kenya Sign Language', type: 'Core' },
      { name: 'Religious Education Activities (CRE/IRE/HRE)', type: 'Core' },
      { name: 'Environmental Activities', type: 'Core' },
      { name: 'Creative Activities', type: 'Core' },
    ],
  },
  {
    id: 'upper-primary',
    name: 'Upper Primary',
    description: 'Intermediate learning areas for Grades 4, 5, and 6',
    learningAreas: [
      { name: 'Mathematics', type: 'Core' },
      { name: 'English', type: 'Core' },
      { name: 'Kiswahili', type: 'Core' },
      { name: 'Science and Technology', type: 'Core' },
      { name: 'Agriculture and Nutrition', type: 'Core' },
      { name: 'Social Studies', type: 'Core' },
      { name: 'Religious Education (CRE/IRE/HRE)', type: 'Core' },
      { name: 'Creative Arts', type: 'Core' },
    ],
  },
  {
    id: 'junior-school',
    name: 'Junior School',
    description: 'Secondary preparation learning areas for Grades 7, 8, and 9',
    learningAreas: [
      { name: 'English', type: 'Core' },
      { name: 'Kiswahili / Kenya Sign Language', type: 'Core' },
      { name: 'Mathematics', type: 'Core' },
      { name: 'Integrated Science', type: 'Core' },
      { name: 'Health Education', type: 'Core' },
      { name: 'Social Studies', type: 'Core' },
      { name: 'Religious Education (CRE/IRE/HRE)', type: 'Core' },
      { name: 'Pre-Technical Studies', type: 'Core' },
      { name: 'Agriculture and Nutrition', type: 'Core' },
      { name: 'Creative Arts and Sports', type: 'Core' },
    ],
  },
];

/**
 * Build a fully-formed ClusterData[] with unique IDs for each
 * learning area, ready to be persisted as the initial state.
 */
export const buildDefaultClusters = (): ClusterData[] => {
  return DEFAULT_CBC_CLUSTERS.map((cluster) => ({
    ...cluster,
    learningAreas: cluster.learningAreas.map((area, index) => ({
      id: `default-${cluster.id}-${index}-${Date.now().toString(36)}`,
      name: area.name,
      type: area.type,
    })),
  }));
};
