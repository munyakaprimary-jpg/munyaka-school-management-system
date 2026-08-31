# Emergency Password Reset Server

A standalone Node.js backend that processes `reset-override.json` on startup.

## Setup

```bash
# Install dependencies
npm install bcrypt

# Set the emergency secret in your environment
echo "EMERGENCY_SECRET=$(openssl rand -base64 32)" >> .env
```

## Create a reset-override.json at the project root

```json
{
  "action": "reset_password",
  "secretKey": "your-secret-from-env",
  "role": "superadmin",
  "newPassword": "NewSecurePassword123"
}
```

## Run on server startup

```bash
# Using tsx (TypeScript runner)
npx tsx server/reset-server.ts

# Or compile and run
npx tsc server/reset-server.ts --outDir dist/server
node dist/server/reset-server.js
```

For automatic startup, add a `prestart` script in `package.json`:

```json
"scripts": {
  "prestart": "tsx server/reset-server.ts",
  "start": "node index.js"
}
```

## Behavior

1. **No `reset-override.json`** → starts normally, no action.
2. **Invalid `secretKey`** → aborts, logs warning, file NOT deleted.
3. **Valid `secretKey`** → hashes new password, updates user record, deletes the file, prints success banner.

## Security

- Constant-time `secretKey` comparison to prevent timing attacks.
- Passwords are hashed with **bcrypt** (cost factor 12) before storage.
- Override file is deleted immediately after successful reset.
- Failed resets leave the file in place for an admin to inspect.

## File locations

- **Override file** (must be at project root): `reset-override.json`
- **Users database** (created on first run): `data/users.json`
- **Env variable**: `EMERGENCY_SECRET`
