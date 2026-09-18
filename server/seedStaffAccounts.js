import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

/**
 * Generates a temporary password strictly matching MUNYAKA-XXXX
 * e.g. MUNYAKA-4829 or MUNYAKA-7K2P
 */
export function generateTemporaryPassword(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // removed ambiguous O, 0, I, 1
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(crypto.randomInt(chars.length));
  }
  return `MUNYAKA-${suffix}`;
}

interface StaffSeedAccount {
  username: string;
  name: string;
  email: string;
  role: string;
  staffCategory: 'ADMINISTRATIVE' | 'TEACHING' | 'NON_TEACHING';
  department: string;
  assignedClasses?: string[];
}

const DEFAULT_ACCOUNTS: StaffSeedAccount[] = [
  {
    username: 'admin',
    name: 'System Administrator',
    email: 'admin@munyaka.ac.ke',
    role: 'ADMIN',
    staffCategory: 'ADMINISTRATIVE',
    department: 'Administration',
  },
  {
    username: 'teacher_john',
    name: 'John Kamau',
    email: 'john.kamau@munyaka.ac.ke',
    role: 'TEACHER',
    staffCategory: 'TEACHING',
    department: 'Upper Primary',
    assignedClasses: ['Grade 4 Green', 'Grade 7 Mercury'],
  },
  {
    username: 'accountant_mary',
    name: 'Mary Wanjiku',
    email: 'mary.wanjiku@munyaka.ac.ke',
    role: 'ACCOUNTANT',
    staffCategory: 'NON_TEACHING',
    department: 'Finance & Accounts',
  },
  {
    username: 'store_peter',
    name: 'Peter Otieno',
    email: 'peter.otieno@munyaka.ac.ke',
    role: 'SUPPORT_STAFF',
    staffCategory: 'NON_TEACHING',
    department: 'Stores & Inventory',
  },
];

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

export async function seedStaffAccounts() {
  console.log('\n============================================================');
  console.log('       MUNYAKA SCHOOL - STAFF ACCOUNT SEEDING UTILITY       ');
  console.log('============================================================\n');

  let existingUsers: any[] = [];
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf8');
      existingUsers = JSON.parse(raw);
      if (!Array.isArray(existingUsers)) existingUsers = [];
    } else {
      const dir = path.dirname(USERS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  } catch (err) {
    console.warn('Could not read existing users.json, starting fresh.', err);
  }

  const tableOutput: Array<{ Username: string; Role: string; Category: string; 'Temp Password': string }> = [];

  for (const acc of DEFAULT_ACCOUNTS) {
    const tempPassword = generateTemporaryPassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // Check if user exists (upsert logic)
    const existingIndex = existingUsers.findIndex(
      (u) => u.username === acc.username || u.email === acc.email
    );

    const userData = {
      id: existingIndex >= 0 ? existingUsers[existingIndex].id : `staff-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      username: acc.username,
      name: acc.name,
      email: acc.email,
      role: acc.role,
      staff_category: acc.staffCategory,
      department: acc.department,
      assigned_classes: acc.assignedClasses || [],
      password_hash: passwordHash,
      must_change_password: true,
      is_active: 1,
      created_at: existingIndex >= 0 ? existingUsers[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Preserve original created_at but update credentials & temporary password status
      existingUsers[existingIndex] = {
        ...existingUsers[existingIndex],
        ...userData,
        created_at: existingUsers[existingIndex].created_at,
      };
    } else {
      existingUsers.push(userData);
    }

    tableOutput.push({
      Username: acc.username,
      Role: acc.role,
      Category: acc.staffCategory,
      'Temp Password': tempPassword,
    });
  }

  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(existingUsers, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write users.json:', err);
  }

  console.table(tableOutput);
  console.log('\n✅ Seeding complete! All accounts marked with must_change_password = true.');
  console.log('============================================================\n');
  return tableOutput;
}

// Run directly if called via node
if (process.argv[1] && process.argv[1].endsWith('seedStaffAccounts.js')) {
  seedStaffAccounts().catch(console.error);
}
