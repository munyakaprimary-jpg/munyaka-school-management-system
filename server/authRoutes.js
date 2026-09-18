import express from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const router = express.Router();
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

const loadUsers = () => {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(raw) || [];
    }
  } catch {}
  return [];
};

const saveUsers = (users) => {
  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch {}
};

/**
 * Generate MUNYAKA-XXXX temporary password
 */
export function generateTemporaryPassword() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(crypto.randomInt(chars.length));
  }
  return `MUNYAKA-${suffix}`;
}

// Login Endpoint with mustChangePassword check
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const users = loadUsers();
    const user = users.find(
      (u) => u.username === username || u.email === username || u.staff_id === username
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Check if user is active
    if (user.is_active === 0 || user.is_active === false) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
    }

    // Verify password
    let passwordValid = false;
    if (user.password_hash) {
      passwordValid = await bcrypt.compare(password, user.password_hash);
    } else if (user.password) {
      passwordValid = user.password === password;
    }

    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const mustChangePassword = !!user.must_change_password;
    const tempToken = crypto.randomBytes(32).toString('hex');

    // Return response indicating forced password change if required
    return res.json({
      success: true,
      mustChangePassword,
      tempToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        staffCategory: user.staff_category || user.staffCategory,
        department: user.department,
        assignedClasses: user.assigned_classes || user.assignedClasses || [],
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
});

// Change Password Endpoint for first-login reset
router.post('/change-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) {
      return res.status(400).json({ success: false, message: 'Username and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const users = loadUsers();
    const index = users.findIndex((u) => u.username === username || u.email === username);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    users[index].password_hash = passwordHash;
    users[index].must_change_password = false;
    users[index].updated_at = new Date().toISOString();
    delete users[index].password; // remove plain text if any

    saveUsers(users);

    const user = users[index];
    return res.json({
      success: true,
      message: 'Password updated successfully. You can now access your dashboard.',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        staffCategory: user.staff_category || user.staffCategory,
        department: user.department,
        assignedClasses: user.assigned_classes || user.assignedClasses || [],
      },
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error while changing password' });
  }
});

// Staff creation endpoint for admins with automatic MUNYAKA-XXXX generation
router.post('/staff', async (req, res) => {
  try {
    const { name, email, role, staffCategory, department, assignedClasses } = req.body;
    if (!name || !role) {
      return res.status(400).json({ success: false, message: 'Name and role are required' });
    }

    const users = loadUsers();
    const tempPassword = generateTemporaryPassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const username = email ? email.split('@')[0].toLowerCase() : `staff_${Math.random().toString(36).substr(2, 6)}`;
    
    // Ensure unique username
    let finalUsername = username;
    let counter = 1;
    while (users.some((u) => u.username === finalUsername)) {
      finalUsername = `${username}${counter}`;
      counter++;
    }

    const newStaff = {
      id: `staff-${Date.now()}`,
      username: finalUsername,
      name,
      email: email || `${finalUsername}@munyaka.ac.ke`,
      role: role.toUpperCase(),
      staff_category: staffCategory || 'TEACHING',
      department: department || 'General',
      assigned_classes: assignedClasses || [],
      password_hash: passwordHash,
      must_change_password: true,
      is_active: 1,
      created_at: new Date().toISOString(),
    };

    users.push(newStaff);
    saveUsers(users);

    return res.json({
      success: true,
      message: 'Staff account created successfully',
      staff: newStaff,
      temporaryPassword: tempPassword,
    });
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ success: false, message: 'Failed to create staff account' });
  }
});

export default router;
