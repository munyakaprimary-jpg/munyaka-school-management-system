/**
 * Unified Staff Account Seeding Script (`seedStaffAccounts.js`)
 * ============================================================
 * 
 * Populates or updates the test staff accounts in data/users.json:
 *   - Admin: Username `admin`, Role `ADMIN`, Staff Category `ADMINISTRATIVE`, Department `MANAGEMENT`
 *   - Teacher: Username `teacher_john`, Role `TEACHER`, Staff Category `TEACHING`, Department `ACADEMIC`
 *   - Accountant: Username `accountant_mary`, Role `ACCOUNTANT`, Staff Category `NON_TEACHING`, Department `FINANCE`
 *   - Stores: Username `store_peter`, Role `SUPPORT_STAFF`, Staff Category `NON_TEACHING`, Department `STORES`
 * 
 * Features:
 *   1. `generateTemporaryPassword()` helper producing `MUNYAKA-XXXX` (e.g. `MUNYAKA-8A2F`).
 *   2. Bcrypt hashing of temporary passwords before insertion.
 *   3. `mustChangePassword = true` by default.
 *   4. Upsert logic (creates if missing, updates if exists).
 *   5. Clean terminal table output listing Username, Role, Staff Category, Department, and plain-text Temporary Password.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// 1. Temporary Password Generator
export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit ambiguous 0, O, I, 1
  let randomHex = '';
  for (let i = 0; i < 4; i++) {
    randomHex += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MUNYAKA-${randomHex}`;
}

const ACCOUNTS_TO_SEED = [
  {
    username: 'admin',
    name: 'Admin User',
    email: 'admin@munyaka.sc.ke',
    role: 'ADMIN',
    staffCategory: 'ADMINISTRATIVE',
    department: 'MANAGEMENT',
  },
  {
    username: 'teacher_john',
    name: 'John Teacher',
    email: 'teacher_john@munyaka.sc.ke',
    role: 'TEACHER',
    staffCategory: 'TEACHING',
    department: 'ACADEMIC',
  },
  {
    username: 'accountant_mary',
    name: 'Mary Accountant',
    email: 'accountant_mary@munyaka.sc.ke',
    role: 'ACCOUNTANT',
    staffCategory: 'NON_TEACHING',
    department: 'FINANCE',
  },
  {
    username: 'store_peter',
    name: 'Peter Stores',
    email: 'store_peter@munyaka.sc.ke',
    role: 'SUPPORT_STAFF',
    staffCategory: 'NON_TEACHING',
    department: 'STORES',
  },
];

async function seedStaff() {
  console.log('🌱 Seeding staff accounts into data/users.json...');

  let db = { users: [] };
  if (fs.existsSync(USERS_FILE)) {
    try {
      const content = fs.readFileSync(USERS_FILE, 'utf8');
      db = JSON.parse(content);
      if (!Array.isArray(db.users)) {
        db.users = [];
      }
    } catch (e) {
      console.warn('Could not parse existing users.json, starting fresh.');
      db = { users: [] };
    }
  } else {
    // ensure data directory exists
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const tableOutput = [];

  for (const spec of ACCOUNTS_TO_SEED) {
    const plainPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Check if account already exists by username or email
    const existingIndex = db.users.findIndex(
      (u) =>
        (u.username && u.username.toLowerCase() === spec.username.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === spec.email.toLowerCase())
    );

    const userRecord = {
      id: existingIndex >= 0 ? db.users[existingIndex].id : `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      username: spec.username,
      name: spec.name,
      email: spec.email,
      role: spec.role,
      staffCategory: spec.staffCategory,
      department: spec.department,
      passwordHash,
      mustChangePassword: true,
      isActive: true,
      createdAt: existingIndex >= 0 ? db.users[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Upsert: update existing while keeping ID and creation date
      db.users[existingIndex] = {
        ...db.users[existingIndex],
        ...userRecord,
      };
    } else {
      db.users.push(userRecord);
    }

    tableOutput.push({
      Username: spec.username,
      Role: spec.role,
      'Staff Category': spec.staffCategory,
      Department: spec.department,
      'Temporary Password': plainPassword,
    });
  }

  fs.writeFileSync(USERS_FILE, JSON.stringify(db, null, 2), 'utf8');

  console.log('\\n═════════════════════════════════════════════════════════════════════════════════════');
  console.log('                          SEEDED STAFF ACCOUNTS SUMMARY                              ');
  console.log('═════════════════════════════════════════════════════════════════════════════════════');
  console.table(tableOutput);
  console.log('═════════════════════════════════════════════════════════════════════════════════════');
  console.log('✓ Successfully seeded staff accounts with mustChangePassword = true');
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedStaff().catch((err) => {
    console.error('Error seeding staff accounts:', err);
    process.exit(1);
  });
}
