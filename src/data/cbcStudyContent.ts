import {
  cbcStudyContent as cbc,
  strandCategories as sc,
  gradeLevels as gl,
  ContentItem as CI,
  StrandCategory as SC,
  Attachment as Att,
} from "./initialSeedData";

export const cbcStudyContent = cbc;
export const strandCategories = sc;
export const gradeLevels = gl;
export const assessmentTypeOptions = [
  { value: 'formative', label: 'Formative Assessment (AfA)' },
  { value: 'summative', label: 'Summative Assessment' },
  { value: 'project', label: 'Project-Based Assessment' },
  { value: 'portfolio', label: 'Portfolio Assessment' }
];
export type ContentItem = CI;
export type StrandCategory = SC;
export type Attachment = Att;
export default cbcStudyContent;
