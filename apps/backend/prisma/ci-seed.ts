/**
 * CI-only seed — creates a single admin user for E2E tests.
 *
 * Runs only in GitHub Actions. Uses env vars from CI secrets, so no
 * credentials are baked into the repo. Safe to re-run (upsert).
 */

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.CI_ADMIN_EMAIL;
  const password = process.env.CI_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('CI_ADMIN_EMAIL and CI_ADMIN_PASSWORD must be set');
  }

  const hash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash },
    create: {
      email,
      passwordHash: hash,
      firstName: 'CI',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      isEmailVerified: true,
    },
  });

  console.log(`✅ CI admin ready: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('❌ CI seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
