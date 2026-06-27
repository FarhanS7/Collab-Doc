import { prisma } from '../lib/prisma.js';

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  // Truncate tables to ensure database isolation between test cases
  const tables = ['DocumentMember', 'DocumentVersion', 'Document', 'User'];
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (err) {
      // Suppress missing table errors or schema mismatches in setup
    }
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
