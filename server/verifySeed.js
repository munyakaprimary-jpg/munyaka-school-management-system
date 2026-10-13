import { execSync } from 'child_process';
import { initialSeedData } from '../src/data/initialSeedData.ts';

console.log('=== SEED VERIFICATION CHECK ===');
console.log(`Students count: ${initialSeedData.students?.length || 0}`);
console.log(`Staff count: ${initialSeedData.staff?.length || 0}`);
console.log(`Attendance records: ${Object.keys(initialSeedData.attendance || {}).length}`);
console.log(`Fees records: ${initialSeedData.fees?.length || 0}`);
console.log('===============================');
