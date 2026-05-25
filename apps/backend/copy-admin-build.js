'use strict';
const path = require('path');
const fs = require('fs');

function findAdminInStore(storeDir) {
  if (!fs.existsSync(storeDir)) return null;
  const entry = fs.readdirSync(storeDir).find(e => e.startsWith('@strapi+admin@'));
  if (!entry) return null;
  return path.join(storeDir, entry, 'node_modules', '@strapi', 'admin');
}

try {
  const src = path.join(__dirname, 'build');

  if (!fs.existsSync(src)) {
    console.log('[copy-admin-build] No ./build directory, skipping');
    process.exit(0);
  }

  // Try require.resolve first, then fall back to searching the pnpm store
  let adminDir = null;

  try {
    adminDir = path.dirname(require.resolve('@strapi/admin/package.json'));
  } catch (_) {
    // pnpm store may be at the workspace root (one or two levels up)
    const stores = [
      path.join(__dirname, 'node_modules', '.pnpm'),
      path.join(__dirname, '..', '..', 'node_modules', '.pnpm'),
      path.join(__dirname, '..', 'node_modules', '.pnpm'),
    ];
    for (const s of stores) {
      adminDir = findAdminInStore(s);
      if (adminDir) break;
    }
  }

  if (!adminDir) {
    console.log('[copy-admin-build] @strapi/admin not found, skipping admin build copy');
    process.exit(0);
  }

  const dest = path.join(adminDir, 'dist', 'server', 'server', 'build');
  console.log('[copy-admin-build] Copying', src, '->', dest);
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log('[copy-admin-build] Done');
} catch (err) {
  console.error('[copy-admin-build] Error:', err.message);
}
