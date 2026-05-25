'use strict';
const path = require('path');
const fs = require('fs');

try {
  const adminPkg = require.resolve('@strapi/admin/package.json');
  const src = path.join(__dirname, 'build');
  const dest = path.join(path.dirname(adminPkg), 'dist', 'server', 'server', 'build');

  if (!fs.existsSync(src)) {
    console.log('[copy-admin-build] No ./build directory, skipping');
    process.exit(0);
  }

  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log('[copy-admin-build] Copied ./build ->', dest);
} catch (err) {
  console.error('[copy-admin-build] Warning:', err.message);
}
