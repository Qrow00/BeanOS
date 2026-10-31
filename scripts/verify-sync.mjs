import { createCustomer, getCustomerByCode, adjustPoints } from '../src/database/customers.ts';

async function verifySync() {
  console.log('🚀 Starting Real-time Sync Verification...');
  
  try {
    // 1. Create Test Member (Simulating POS app)
    const testName = `SyncTest_${Date.now()}`;
    const member = await createCustomer({ name: testName, phone: '0000000000' });
    console.log(`✅ [Write] Created member: ${member.name} (${member.code})`);

    // 2. Lookup Member (Simulating Browser View)
    const found = await getCustomerByCode(member.code);
    if (!found || found.id !== member.id) {
      throw new Error('Browser lookup failed: Member not found or ID mismatch');
    }
    console.log(`✅ [Read] Browser successfully retrieved: ${found.name}`);

    // 3. Update Points (Simulating POS update)
    const delta = 50;
    const newBalance = await adjustPoints(member.id, delta, 'Sync Test', 'system-test-user');
    console.log(`✅ [Update] Points adjusted by ${delta}. New balance: ${newBalance}`);

    // 4. Final Verification (Simulating Browser refresh)
    const final = await getCustomerByCode(member.code);
    if (final && final.points_balance === newBalance) {
      console.log('✅ [Final] Sync Verified: Data is consistent across cloud calls.');
    } else {
      throw new Error(`Sync mismatch: Expected ${newBalance}, got ${final?.points_balance}`);
    }
  } catch (e) {
    console.error('❌ Sync Verification Failed:', e.message);
    process.exit(1);
  }
}

verifySync();
