/**
 * Cleanup test orders from the database.
 * Run: npx ts-node scripts/cleanup-test-orders.ts
 *
 * Requires the API to be running. Uses admin credentials to authenticate
 * and calls the bulk-delete endpoint.
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sales@sbbpeptides.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const TEST_NAMES = [
  'edward keyser',
  'mike eposito',
  'brittany keyser',
  'test',
  'test user',
  'test account',
];

async function main() {
  if (!ADMIN_PASSWORD) {
    console.error('Set ADMIN_PASSWORD env var to run this script.');
    console.error('Usage: ADMIN_PASSWORD=yourpass npx ts-node scripts/cleanup-test-orders.ts');
    process.exit(1);
  }

  console.log(`Authenticating as ${ADMIN_EMAIL}...`);

  const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status, await loginRes.text());
    process.exit(1);
  }

  const { accessToken } = await loginRes.json();
  console.log('Authenticated. Deleting test orders...\n');

  const deleteRes = await fetch(`${API_BASE_URL}/admin/orders/bulk-delete`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      names: TEST_NAMES,
      hardDelete: true,
    }),
  });

  if (!deleteRes.ok) {
    console.error('Bulk delete failed:', deleteRes.status, await deleteRes.text());
    process.exit(1);
  }

  const result = await deleteRes.json();
  console.log(`Processed ${result.processed} entries:\n`);
  for (const r of result.results) {
    console.log(`  ${r.orderNumber} → ${r.result}`);
  }
  console.log('\nDone.');
}

main().catch(console.error);
