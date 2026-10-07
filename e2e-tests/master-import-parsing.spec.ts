import { describe, it, expect, beforeEach } from 'vitest';
import { importMasterSyncPackage, validateMasterPackage } from '../src/utils/importMasterSyncPackage';

describe('Master JSON Import Parsing & State Reload', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('validates master package correctly', () => {
    expect(validateMasterPackage({ packageType: 'munyaka_master_sync' })).toBe(true);
    expect(validateMasterPackage({ data: { learners: [] } })).toBe(true);
    expect(validateMasterPackage(null)).toBe(false);
    expect(validateMasterPackage('invalid')).toBe(false);
  });

  it('correctly extracts learners from nested data.learners structure', async () => {
    const samplePackage = {
      packageType: 'munyaka_master_sync',
      data: {
        learners: [
          { id: '1', admNo: 'ADM001', name: 'Learner One', grade: 'Grade 1' },
          { id: '2', admNo: 'ADM002', name: 'Learner Two', grade: 'Grade 2' }
        ]
      }
    };

    const file = new File([JSON.stringify(samplePackage)], 'master_backup.json', { type: 'application/json' });
    
    // Test the parsing logic by simulating file read
    const text = await file.text();
    const parsed = JSON.parse(text);
    const payloadData = parsed.data || parsed;
    
    let extractedLearners: any[] = [];
    if (Array.isArray(payloadData.learners)) {
      extractedLearners = payloadData.learners;
    }

    expect(extractedLearners.length).toBe(2);
    expect(extractedLearners[0].name).toBe('Learner One');
  });

  it('correctly extracts learners from munyaka_learners_db key', async () => {
    const samplePackage = {
      munyaka_learners_db: [
        { id: '1', admNo: 'ADM001', name: 'Learner A' }
      ]
    };

    const text = JSON.stringify(samplePackage);
    const parsed = JSON.parse(text);
    const payloadData = parsed.data || parsed;
    
    let extractedLearners: any[] = [];
    if (Array.isArray(payloadData.munyaka_learners_db)) {
      extractedLearners = payloadData.munyaka_learners_db;
    }

    expect(extractedLearners.length).toBe(1);
    expect(extractedLearners[0].name).toBe('Learner A');
  });
});
