/**
 * Clear test orders from the database.
 *
 * Usage (from apps/api directory):
 *   npx ts-node ../../scripts/clear-test-orders.ts
 *
 * Or via the admin API:
 *   POST /api/v1/admin/orders/bulk-delete
 *   { "names": ["Brittany Keyser", "Edward Keyser", "test", "Mike Esposito"], "hardDelete": true }
 *
 * Environment: Requires DATABASE_URL to be set.
 */

import { PrismaClient } from '@prisma/client';

const TEST_NAMES = [
  'Brittany Keyser',
  'Edward Keyser',
  'test',
  'Mike Esposito',
];

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Searching for test orders...\n');

    for (const name of TEST_NAMES) {
      const parts = name.trim().toLowerCase().split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');

      const whereClause: any = {
        OR: [
          {
            AND: [
              { firstName: { contains: firstName, mode: 'insensitive' } },
              ...(lastName ? [{ lastName: { contains: lastName, mode: 'insensitive' } }] : []),
            ],
          },
        ],
      };

      // For single-word names like "test", also match exact firstName
      if (parts.length === 1) {
        whereClause.OR.push({ firstName: { equals: firstName, mode: 'insensitive' } });
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (users.length === 0) {
        console.log(`  No users found matching "${name}"`);
        continue;
      }

      for (const user of users) {
        const orders = await prisma.order.findMany({
          where: { userId: user.id },
          select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
        });

        if (orders.length === 0) {
          console.log(`  ${user.firstName} ${user.lastName} (${user.email}) — no orders`);
          continue;
        }

        console.log(`  ${user.firstName} ${user.lastName} (${user.email}) — ${orders.length} order(s):`);

        for (const order of orders) {
          // Hard delete (cascade handles related records)
          await prisma.order.delete({ where: { id: order.id } });
          console.log(`    ✓ Deleted ${order.orderNumber} | ${order.status} | $${Number(order.totalAmount).toFixed(2)} | ${order.createdAt.toISOString().split('T')[0]}`);
        }
      }
    }

    console.log('\nDone.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
